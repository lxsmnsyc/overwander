import Weather from '../../data/overworld/weather';
import type QuadBatch from '../gl/quad-batch';
import { BLENDS, MODES, type WashMode } from './wash';

/** The sheen laid over a wet or a frozen ground */
/**
 * A sheen: light split across the air, laid over the whole picture.
 *
 * A bow is not geometry here. The real one hangs at infinity and
 * cannot be walked around, and built as an arch over the chunk it
 * read as a hoop standing in the field. What one is to the eye is
 * colour in the air, so it is drawn as colour in the air: bands that
 * walk the picture, bend on the way, and slide as the camera turns.
 *
 * The field is arithmetic per pixel, which is a shader in everything
 * but where it runs. It is worked out into a small canvas and
 * stretched over the board, so it costs the same at any window size
 * and lands in both the 2D pass and the batch.
 */
interface Sheen {
  /** How much of it, at the sky's strongest */
  depth: number;
  /** How many bands lie across the picture */
  across: number;
  /** And how many down it, which is what leans them */
  down: number;
  /** How fast the bands walk, in bands a second */
  pace: number;
  /** How far a band bends on its way down */
  wobble: number;
  /** 0 for the tint alone, 1 for the full spectrum */
  colour: number;
  /** What the colourless part of it is drawn in */
  tint: string;
  /**
   * How many swells of light there are for one band of colour. Under
   * one, so a swell carries the spectrum through it rather than
   * lighting the same hue every time: tied to the colour's own wave
   * the whole picture comes out one hue, which is a smear rather than
   * a bow
   */
  swell: number;
  /** How hard a swell's edge is: 1 is a breath, 3 is a rib */
  edge: number;
  /** How much it fades toward the bottom, where the ground is nearest */
  crown: number;
  mode: WashMode;
}

export const SHEENS: Partial<Record<Weather, Sheen>> = {
  /**
   * The spectrum, leaning across the picture the way a bow's own
   * bands do, and slow: a rainbow that shimmers quickly is an oil
   * slick
   */
  [Weather.Rainbow]: {
    depth: 0.36,
    across: 3.2,
    down: 1.6,
    pace: 0.05,
    wobble: 0.2,
    colour: 1,
    tint: '#ffffff',
    swell: 0.42,
    edge: 1.3,
    crown: 0.75,
    mode: 'lift',
  },
  /**
   * The same field with the colour drained. The drops a fogbow stands
   * in are too small to split the light, so it comes out white and
   * broad, with barely a blush left at its edges
   */
  [Weather.Fogbow]: {
    depth: 0.28,
    across: 2.4,
    down: 1.2,
    pace: 0.04,
    wobble: 0.16,
    colour: 0.12,
    tint: '#eef2fa',
    swell: 0.42,
    edge: 1.7,
    crown: 0.9,
    mode: 'lift',
  },
  /**
   * Not a bow: a mirage is layered air, so its bands lie flat and
   * stack, and they bend far more than they walk. What it should look
   * like is the country coming apart in strata, which is what heat
   * over a road does
   */
  [Weather.FataMorgana]: {
    depth: 0.22,
    across: 0.12,
    down: 7,
    pace: 0.09,
    wobble: 0.4,
    colour: 0.08,
    tint: '#f7e9cd',
    swell: 1,
    edge: 2.6,
    crown: 0.5,
    mode: 'veil',
  },
};

/** How fine the field is worked out before it is stretched over the picture */
const SHEEN_WIDE = 96;
const SHEEN_TALL = 64;

/** How far the field slides for a radian of camera, in bands */
const SHEEN_TURN = 0.5;

/** A `#rrggbb` tint as three numbers, so the field can mix with it */
function tintOf(colour: string): [number, number, number] {
  const value = Number.parseInt(colour.slice(1), 16);

  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

let sheenSheet: HTMLCanvasElement | null = null;

/**
 * The field, written a pixel at a time. Colour goes in the pixel and
 * the light goes in its alpha, so the sheet is stretched and blended
 * rather than read back
 */
function sheenField(sheen: Sheen, clock: number, yaw: number): HTMLCanvasElement | null {
  const made = sheenSheet ?? document.createElement('canvas');

  made.width = SHEEN_WIDE;
  made.height = SHEEN_TALL;
  sheenSheet = made;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }
  const image = into.createImageData(SHEEN_WIDE, SHEEN_TALL);
  const seconds = clock / 1000;
  const slide = seconds * sheen.pace + yaw * SHEEN_TURN;
  const [tintRed, tintGreen, tintBlue] = tintOf(sheen.tint);
  const turn = Math.PI * 2;
  let at = 0;

  for (let y = 0; y < SHEEN_TALL; y++) {
    const down = y / (SHEEN_TALL - 1);
    const crown = (1 - down) ** sheen.crown;
    // The bend is the row's, not the pixel's: a band curves because
    // its own line moves as it goes down, not because the colour does
    const bend = Math.sin(down * 5.3 + seconds * sheen.pace * 2.1) * sheen.wobble;

    for (let x = 0; x < SHEEN_WIDE; x++) {
      const phase = (x / (SHEEN_WIDE - 1)) * sheen.across + down * sheen.down + slide + bend;
      const light = (0.5 + 0.5 * Math.sin(phase * sheen.swell * turn)) ** sheen.edge * crown;
      // The spectrum as three offset waves, which is a hue wheel with
      // none of the arithmetic of one
      const red = 0.5 + 0.5 * Math.cos(turn * phase);
      const green = 0.5 + 0.5 * Math.cos(turn * (phase - 1 / 3));
      const blue = 0.5 + 0.5 * Math.cos(turn * (phase - 2 / 3));

      image.data[at] = tintRed + (red * 0xff - tintRed) * sheen.colour;
      image.data[at + 1] = tintGreen + (green * 0xff - tintGreen) * sheen.colour;
      image.data[at + 2] = tintBlue + (blue * 0xff - tintBlue) * sheen.colour;
      image.data[at + 3] = light * 0xff;
      at += 4;
    }
  }
  into.putImageData(image, 0, 0);
  return made;
}

export function paintSheen(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  sheen: Sheen,
  clock: number,
  yaw: number,
  strength: number,
): void {
  const field = sheenField(sheen, clock, yaw);

  if (field == null) {
    return;
  }
  context.globalCompositeOperation = MODES[sheen.mode];
  context.globalAlpha = sheen.depth * strength;
  context.drawImage(field, 0, 0, width, height);
  context.globalAlpha = strength;
  context.globalCompositeOperation = 'source-over';
}

export function batchSheen(
  batch: QuadBatch,
  width: number,
  height: number,
  sheen: Sheen,
  clock: number,
  yaw: number,
  strength: number,
): void {
  const field = sheenField(sheen, clock, yaw);

  if (field == null) {
    return;
  }
  batch.invalidate(field);
  batch.quad(
    field,
    { x: 0, y: 0, width: SHEEN_WIDE, height: SHEEN_TALL },
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    sheen.depth * strength,
    undefined,
    'smooth',
    BLENDS[sheen.mode],
  );
}
