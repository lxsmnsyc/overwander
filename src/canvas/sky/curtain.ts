import Weather from '../../data/overworld/weather';
import type QuadBatch from '../gl/quad-batch';
import type { QuadPoint } from '../gl/quad-batch';
import { projectAir } from '../board';
import type { SkyCamera } from './drops';

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
 * A curtain sky, drawn rib by rib. The gradient down a band is a strip
 * one pixel across, stretched over each rib, so the ribs of one band
 * share one picture
 */
export function paintCurtain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  curtain: Curtain,
  clock: number,
): void {
  const seconds = clock / 1000;
  const across = width / curtain.ribs;
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  for (let band = 0; band < curtain.bands; band++) {
    const shift = Math.sin(seconds * 0.12 + band) * 0.5 + 0.5;
    const strip = curtainStrip(band, shift, curtain);

    if (strip == null) {
      continue;
    }

    const top = height * (curtain.top + band * curtain.gap);
    const deep = height * curtain.deep;

    for (let rib = 0; rib < curtain.ribs; rib++) {
      const { foot, light } = ribAt(curtain, band, rib, seconds);

      context.globalAlpha = held * light;
      // A hair wider than its share, so two ribs meet rather than
      // leaving a seam of ground between them
      context.drawImage(strip, 0, 0, 1, CURTAIN_STEPS, rib * across, top, across + 1, deep * foot);
    }
  }
  context.globalAlpha = held;
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
 * The ring a curtain hangs on: a circle **inside** the board's own
 * footprint, hanging above the ground the player walks on.
 *
 * It has to be there and nowhere else. The board's far edge is already
 * at the very top of the picture, so a ring set outside it is off the
 * frame at ground level before any height is added at all — this
 * camera looks down, and the sky it leaves is a band a few dozen
 * pixels deep. Drawn over the board there is room, and the ring's far
 * half runs off the top while its near half hangs where it can be
 * seen, which is what turning the camera walks the player through
 */
const RING = { radius: 0.5, foot: 0.32, head: 1.05, spread: 1.06 };

/** One fold of a curtain, laid out ready for either painter */
interface Fold {
  corners: QuadPoint[];
  light: number;
  band: number;
  scale: number;
}

/**
 * Every fold of a curtain, back to front.
 *
 * The head is held level and the foot sways, which is the way the flat
 * curtain does it: swaying the head instead gives a boiling top edge,
 * because the folds of a band no longer agree about where the band
 * begins
 */
function foldsOf(curtain: Curtain, camera: SkyCamera, clock: number): Fold[] {
  const seconds = clock / 1000;
  const folds: Fold[] = [];
  // The whole circle, so some of it is over the board whichever way
  // the camera is facing
  const step = (Math.PI * 2) / curtain.ribs;

  for (let band = 0; band < curtain.bands; band++) {
    const out = RING.radius + band * RING.radius * curtain.gap;

    for (let rib = 0; rib < curtain.ribs; rib++) {
      const { foot, light } = ribAt(curtain, band, rib, seconds);
      const one = step * rib;
      // A hair wider than its share, so two folds meet rather than
      // leaving a seam of sky between them
      const two = one + step * RING.spread;
      // The head is held level and the foot sways. Swaying the head
      // instead gives a boiling top edge, because the folds of a band
      // stop agreeing about where the band begins
      const low = RING.foot * foot;

      const oneU = 0.5 + Math.cos(one) * out;
      const oneV = 0.5 + Math.sin(one) * out;
      const twoU = 0.5 + Math.cos(two) * out;
      const twoV = 0.5 + Math.sin(two) * out;
      const near = airOn(camera, oneU, oneV, low);

      if (near.scale <= 0.05) {
        continue;
      }
      /**
       * Bright over the far ground and gone by the time it has come
       * round in front. The ring is closed so that something is always
       * over the horizon whichever way the player faces; without this
       * the half of it standing between the player and the board reads
       * as a hoop around the chunk rather than a curtain over it
       */
      const round = turned(oneU, oneV, camera.yaw);
      const facing = Math.min(1, Math.max(0, (0.85 - round) / 0.45));

      if (facing <= 0) {
        continue;
      }
      folds.push({
        corners: [
          airOn(camera, oneU, oneV, RING.head),
          airOn(camera, twoU, twoV, RING.head),
          airOn(camera, twoU, twoV, low),
          near,
        ],
        light: light * facing,
        band,
        scale: near.scale,
      });
    }
  }
  // Behind first, so a near fold is drawn over the far one it hides
  folds.sort((one, other) => one.scale - other.scale);
  return folds;
}

export function paintCurtainOver(
  context: CanvasRenderingContext2D,
  curtain: Curtain,
  camera: SkyCamera,
  clock: number,
): void {
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  for (const fold of foldsOf(curtain, camera, clock)) {
    /**
     * Built from this fold's own top and bottom rather than once for
     * the whole band. The folds are drawn in depth order and stand at
     * different heights, so a gradient built for one of them and used
     * for the next is a picture that jumps every time the sort shuffles
     */
    const strip = context.createLinearGradient(0, fold.corners[0].y, 0, fold.corners[3].y);

    for (const stop of curtain.stops) {
      strip.addColorStop(
        stop.at,
        `${stop.colour}${Math.round(stop.alpha * 0xff)
          .toString(16)
          .padStart(2, '0')}`,
      );
    }
    context.globalAlpha = held * fold.light;
    context.fillStyle = strip;
    context.beginPath();
    context.moveTo(fold.corners[0].x, fold.corners[0].y);
    for (const corner of fold.corners.slice(1)) {
      context.lineTo(corner.x, corner.y);
    }
    context.closePath();
    context.fill();
  }
  context.globalAlpha = held;
}

export function batchCurtainOver(
  batch: QuadBatch,
  curtain: Curtain,
  camera: SkyCamera,
  clock: number,
  strength: number,
): void {
  const seconds = clock / 1000;

  for (const fold of foldsOf(curtain, camera, clock)) {
    const strip = curtainStrip(
      fold.band,
      Math.sin(seconds * 0.12 + fold.band) * 0.5 + 0.5,
      curtain,
    );

    if (strip == null) {
      continue;
    }
    batch.invalidate(strip);
    batch.quad(
      strip,
      { x: 0, y: 0, width: 1, height: CURTAIN_STEPS },
      fold.corners,
      strength * fold.light,
      undefined,
      'smooth',
      'screen',
    );
  }
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

const curtains: (HTMLCanvasElement | null)[] = [];

/**
 * One band's light, repainted where it stands this frame. Its stops
 * drift, so it is drawn again every frame: a strip this size costs a
 * quarter of a kilobyte to hand over
 */
export function curtainStrip(
  band: number,
  shift: number,
  curtain: Curtain,
): HTMLCanvasElement | null {
  const held = curtains[band] ?? document.createElement('canvas');

  held.width = 1;
  held.height = CURTAIN_STEPS;

  const into = held.getContext('2d');

  if (into == null) {
    return null;
  }
  const light = into.createLinearGradient(0, 0, 0, CURTAIN_STEPS);

  for (const stop of curtain.stops) {
    // The middle of the band breathes up and down it, which is what
    // keeps a curtain from being a picture that happens to move
    const at = stop.at <= 0 || stop.at >= 1 ? stop.at : Math.min(0.98, stop.at + shift * 0.08);

    light.addColorStop(
      at,
      `${stop.colour}${Math.round(stop.alpha * 0xff)
        .toString(16)
        .padStart(2, '0')}`,
    );
  }
  into.clearRect(0, 0, 1, CURTAIN_STEPS);
  into.fillStyle = light;
  into.fillRect(0, 0, 1, CURTAIN_STEPS);
  curtains[band] = held;
  return held;
}
