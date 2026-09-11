import Weather from '../../data/overworld/weather';
import type { QuadPoint } from '../gl/quad-batch';
import { projectAir } from '../board';
import type { SkyCamera } from './drops';
import { sheetOf, tintOf } from './field';

/** The curtains a heavy sky is drawn as, flat and turned into the world, and the strips they are cached as */
/**
 * A curtain sky: an aurora, or the shimmer over dead-still air.
 *
 * It is drawn as ribs rather than as one band across the picture,
 * which is the whole difference between an aurora and a green smear.
 * A real curtain is folded, so each rib hangs to its own depth and
 * lights to its own brightness, and the fold walks along the sky.
 */
interface CurtainStop {
  /** How far down the band it sits, 0 to 1 */
  at: number;
  colour: string;
  /** How much of it there is, 0 to 1 */
  alpha: number;
}

interface Curtain {
  /** How many bands hang, each behind the last */
  bands: number;
  /** Where the first hangs, and how far below it the next does */
  top: number;
  gap: number;
  /** How far a band reaches down the picture */
  deep: number;
  /** How fast a fold walks along the sky */
  pace: number;
  /** How many folds there are across it */
  ribs: number;
  /**
   * How uneven the folds are, 0 for a even comb of them and 1 for a
   * sky where some rays are half the brightness of their neighbours
   */
  grain: number;
  /**
   * How much wider a fold is drawn than its share of the picture.
   * Screened over each other they blend; drawn edge to edge they read
   * as the row of rectangles they are
   */
  spread: number;
  /** How much a fold's foot rises and falls, as a share of its depth */
  sway: number;
  /** The light down one band, top to bottom */
  stops: CurtainStop[];
}

/**
 * How tall a curtain's gradient is kept, as a strip one pixel across
 * and stretched over the picture. A gradient is one dimension, and
 * this is that dimension
 */
export const CURTAIN_STEPS = 64;

export const CURTAINS: Partial<Record<Weather, Curtain>> = {
  /**
   * Green low and violet at the crown, which is the order the real
   * thing burns in: oxygen down where the air is thick, nitrogen above
   * it. The body is brightest near the foot rather than in the middle,
   * so the bottom edge reads as an edge instead of a fade
   */
  [Weather.Aurora]: {
    bands: 3,
    top: 0.02,
    gap: 0.07,
    deep: 0.44,
    pace: 0.5,
    ribs: 40,
    sway: 0.22,
    grain: 0.45,
    spread: 2.6,
    stops: [
      { at: 0, colour: '#b06cff', alpha: 0 },
      { at: 0.16, colour: '#b06cff', alpha: 0.1 },
      { at: 0.4, colour: '#3dff9e', alpha: 0.16 },
      { at: 0.78, colour: '#3dff9e', alpha: 0.3 },
      { at: 1, colour: '#3dff9e', alpha: 0 },
    ],
  },
};

/**
 * Where one rib of one band hangs this frame, and how brightly.
 *
 * Both come off the same travelling wave, so a fold that is deeper is
 * also brighter: that is what a curtain does, and it is what keeps
 * ribs from reading as a row of rectangles
 */
export function ribAt(
  curtain: Curtain,
  band: number,
  rib: number,
  seconds: number,
): { foot: number; light: number } {
  const phase = seconds * curtain.pace + rib * 0.36 + band * 1.3;
  const wave = Math.sin(phase);
  // A second wave that does not divide into the first, so the rays
  // come out uneven: an even comb of them reads as a fence
  const grain = Math.sin(rib * 2.399 + band * 1.7) * 0.5 + 0.5;

  return {
    foot: 1 + wave * curtain.sway,
    light:
      (0.45 + 0.55 * (Math.sin(phase * 1.7 + band) * 0.5 + 0.5)) *
      (1 - curtain.grain + curtain.grain * grain),
  };
}

/**
 * How large a curtain's field is worked out at.
 *
 * Wider than a bow's, and for the one reason: a bow has three bands
 * across the picture where a curtain has forty folds. At the bow's
 * width a fold would be two pixels across and would crawl as the wave
 * moved it, which is the one thing the ribs exist to avoid
 */
export const CURTAIN_WIDE = 256;
export const CURTAIN_TALL = 96;

/** How far a curtain slides as the camera comes round, in fields per turn */
const CURTAIN_TURN = 0.5;

/**
 * What a fold over the far ground keeps of a near one's depth, and how
 * much higher it hangs. Distance foreshortens it: further off is
 * shorter and higher in the picture
 */
const CURTAIN_FAR = 0.7;
const CURTAIN_LIFT = 0.3;

/**
 * How much of the ring the picture spans, in laps.
 *
 * Half of one, because a picture never showed the whole ring: the
 * folds behind the player were behind the player. Mapping a full lap
 * across the field put a quarter of the columns past the fade and
 * blanked them, which is a curtain with a hole where the middle of
 * the view is
 */
const CURTAIN_ARC = 0.5;

/**
 * What the folds are worth together.
 *
 * Each was drawn half again wider than its share once, so any point of
 * the sky had two or three of them screening over it. The field reads
 * the wave once where the ribs overlapped, so the light they piled up
 * is put back here rather than pretended at with a width
 */
const CURTAIN_GAIN = 1.6;

/**
 * Where a fold starts to go, and how quickly, as it comes round in
 * front of the player.
 *
 * Bright over the far ground and gone by the time it is overhead,
 * which is what the ring did: without it the half of the curtain
 * standing between the player and the board read as a hoop around the
 * chunk rather than a sky over it
 */
const CURTAIN_FACE = 0.85;
const CURTAIN_FADE = 0.45;

let curtainSheet: HTMLCanvasElement | null = null;
let curtainPixels: ImageData | null = null;
/** The light down one band, sampled into steps rather than interpolated per pixel */
const ramps: Float32Array[] = [];

/**
 * The light down a band, as `CURTAIN_STEPS` rungs of red, green, blue
 * and alpha.
 *
 * The stops are the curtain's own, so the colour is exactly what the
 * ribs were drawn in. Sampled once per band per frame and read by
 * every pixel of it, since a gradient down a band is one dimension and
 * this is that dimension
 */
function curtainRamp(curtain: Curtain, band: number, shift: number): Float32Array {
  const ramp = ramps[band] ?? new Float32Array(CURTAIN_STEPS * 4);
  // The middle of the band breathes up and down it, which is what
  // keeps a curtain from being a picture that happens to move
  const stops = curtain.stops.map((stop) => ({
    at: stop.at <= 0 || stop.at >= 1 ? stop.at : Math.min(0.98, stop.at + shift * 0.08),
    rgb: tintOf(stop.colour),
    alpha: stop.alpha,
  }));

  ramps[band] = ramp;
  for (let step = 0; step < CURTAIN_STEPS; step++) {
    const at = step / (CURTAIN_STEPS - 1);
    let below = stops[0];
    let above = stops[stops.length - 1];

    for (let which = 0; which < stops.length - 1; which++) {
      if (at >= stops[which].at && at <= stops[which + 1].at) {
        below = stops[which];
        above = stops[which + 1];
        break;
      }
    }

    const span = above.at - below.at;
    const mix = span <= 0 ? 0 : (at - below.at) / span;
    const into = step * 4;

    for (let channel = 0; channel < 3; channel++) {
      ramp[into + channel] = below.rgb[channel] + (above.rgb[channel] - below.rgb[channel]) * mix;
    }
    ramp[into + 3] = below.alpha + (above.alpha - below.alpha) * mix;
  }
  return ramp;
}

/**
 * A curtain worked out into a field, the way a bow is.
 *
 * It was drawn rib by rib once, which is one blit per fold per band
 * and a fresh gradient behind each of them: a hundred and twenty draws
 * a frame for one sky. The folds are a travelling wave, and a wave is
 * arithmetic, so the whole curtain is worked out into a small picture
 * and stretched over the board. One draw, at any window size.
 *
 * The fold is sampled continuously rather than per rib, so what was a
 * row of strips is now the same wave read between them, and the light
 * a fold carries still rises and falls with its own depth
 */
export function curtainField(
  curtain: Curtain,
  clock: number,
  yaw: number,
): HTMLCanvasElement | null {
  const made = sheetOf(curtainSheet, CURTAIN_WIDE, CURTAIN_TALL);

  curtainSheet = made;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }

  const image = curtainPixels ?? into.createImageData(CURTAIN_WIDE, CURTAIN_TALL);

  curtainPixels = image;
  image.data.fill(0);

  const seconds = clock / 1000;
  const slide = yaw * CURTAIN_TURN * curtain.ribs;

  for (let band = 0; band < curtain.bands; band++) {
    const ramp = curtainRamp(curtain, band, Math.sin(seconds * 0.12 + band) * 0.5 + 0.5);
    const top = curtain.top + band * curtain.gap;

    for (let x = 0; x < CURTAIN_WIDE; x++) {
      const across = x / CURTAIN_WIDE;
      // Where this column falls between the folds. Read as a real
      // number rather than a fold's index, which is what turns a row
      // of strips into one wave
      const { foot, light } = ribAt(curtain, band, across * curtain.ribs + slide, seconds);
      /**
       * Which way this column is turned, and so how far off it is.
       *
       * The curtain hung on a ring in the world once, and turning the
       * camera walked the player through it: the far half ran off the
       * top of the frame while the near half hung over the board.
       * There is no ring any more, so the ring's two answers are read
       * off the column instead. One turn of the camera is one lap of
       * it, and a column at the back is small, high and faint where
       * one at the front is deep and bright
       */
      // Where along the arc this column looks. It is the column's
      // alone, not the camera's: the middle of the picture is the far
      // side of the arc whichever way the player faces, and turning
      // walks different folds through it rather than tipping the arc
      const round = Math.cos((across - 0.5) * CURTAIN_ARC * Math.PI * 2);
      const near = 0.5 - 0.5 * round;
      // Bright over the far ground and going as it comes round, which
      // is the ring's own answer rather than a fade invented for the
      // field
      const facing = Math.min(1, Math.max(0, (CURTAIN_FACE - near) / CURTAIN_FADE));

      if (facing <= 0) {
        continue;
      }
      const deep = curtain.deep * foot * (CURTAIN_FAR + (1 - CURTAIN_FAR) * near);
      // And it hangs from higher up the further off it is, which is
      // what the ring's far half did by running off the top
      const head = top * (CURTAIN_LIFT + (1 - CURTAIN_LIFT) * near);
      const from = Math.max(0, Math.ceil(head * (CURTAIN_TALL - 1)));
      const to = Math.min(CURTAIN_TALL - 1, Math.floor((head + deep) * (CURTAIN_TALL - 1)));

      for (let y = from; y <= to; y++) {
        const down = (y / (CURTAIN_TALL - 1) - head) / deep;
        const rung =
          Math.min(CURTAIN_STEPS - 1, Math.max(0, Math.round(down * (CURTAIN_STEPS - 1)))) * 4;
        const lit = ramp[rung + 3] * light * facing * CURTAIN_GAIN;
        const at = (y * CURTAIN_WIDE + x) * 4;

        // Added rather than laid over, the way the ribs screened over
        // each other: two folds meeting is more light, not the nearer
        // one winning
        image.data[at] += ramp[rung] * lit;
        image.data[at + 1] += ramp[rung + 1] * lit;
        image.data[at + 2] += ramp[rung + 2] * lit;
        image.data[at + 3] += lit * 0xff;
      }
    }
  }
  into.putImageData(image, 0, 0);
  return made;
}

/**
 * A curtain sky: one field, stretched over the picture
 */
export function paintCurtain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  curtain: Curtain,
  clock: number,
  yaw = 0,
): void {
  const field = curtainField(curtain, clock, yaw);

  if (field == null) {
    return;
  }
  context.globalCompositeOperation = 'screen';
  context.drawImage(field, 0, 0, width, height);
}

/**
 * The far sky, built as things standing in the world.
 *
 * None of these want depth the way a raindrop does — an aurora has no
 * drops to space out — but all of them want a *place*. Drawn at fixed
 * screen coordinates they follow the player round, which is a worse
 * failure than the rain's: a rainbow is a direction, and one that sits
 * in the same corner whichever way you face tells you nothing.
 *
 * The one constraint the geometry has to respect is that this camera
 * looks **down**. At sixty degrees the horizon sits near the top of
 * the frame and the projection diverges just past it, so there is
 * barely any sky in the picture. Everything here hangs low and close,
 * draped over the board rather than standing behind it.
 */

/**
 * How deep a world point is once the camera has been walked round: 0
 * at the board's far edge and 1 at the near one, and past either end
 * beyond it
 */
export function turned(u: number, v: number, yaw: number): number {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  return (u - 0.5) * sin + (v - 0.5) * cos + 0.5;
}

/** A world point in the canvas' own pixels */
export function airOn(
  camera: SkyCamera,
  u: number,
  v: number,
  h: number,
): QuadPoint & { scale: number } {
  const point = projectAir({ u, v }, h, camera.yaw);

  return {
    x: camera.x + point.x * camera.width,
    y: camera.y + point.y * camera.height,
    scale: point.scale,
  };
}

/**
 * One round drop, drawn once and stamped wherever a fall wants one.
 *
 * Big enough that a flake on a large board is still a circle, small
 * enough to cost nothing: it is the only texture the sky uses
 */
export const DROP_SIZE = 32;

/** How much of the sheet the circle fills, leaving room for its edge */
export const DROP_RADIUS = DROP_SIZE / 2 - 1;

let drop: HTMLCanvasElement | null = null;

export function roundDrop(): HTMLCanvasElement | null {
  if (drop != null) {
    return drop;
  }
  const made = document.createElement('canvas');

  made.width = DROP_SIZE;
  made.height = DROP_SIZE;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }
  // White, so the drop's own colour is what tints it
  into.fillStyle = '#ffffff';
  into.beginPath();
  into.arc(DROP_SIZE / 2, DROP_SIZE / 2, DROP_RADIUS, 0, Math.PI * 2);
  into.fill();
  drop = made;
  return made;
}
