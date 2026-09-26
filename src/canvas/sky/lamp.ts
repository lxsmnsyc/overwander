import Weather from '../../data/overworld/weather';
import type { Painter } from '../gl/quad-batch';

/** The lamps a dark day is lit by, and the mask their light is cut from */
/**
 * A point the dark is kept off, and how far.
 *
 * Noon gone dark is not a wash: a wash over everything hides the
 * things a player is standing there to find. What it is instead is a
 * dark room with lamps in it, and what carries a lamp is whatever the
 * board would have been drawing anyway: a landmark, a pokemon
 * standing on a cell
 */
export interface Lamp {
  x: number;
  y: number;
  /** How far the light reaches across, in drawn pixels */
  reach: number;
  /**
   * How far it reaches down the screen, as a share of `reach`.
   *
   * A pool of light lying on the board is laid back by the same tilt
   * the ground is, so it is an ellipse rather than a circle. One
   * standing on the glass leaves this at 1
   */
  squash?: number;
}

/** A sky that puts the lights out, and how far out. */
interface Lamplit {
  colour: string;
  /** How dark it gets where nothing is lit */
  depth: number;
  /**
   * The colour the whole board is multiplied by first, lamps and all,
   * and how much of it.
   *
   * Without it the light a lamp lets through is noon: a hole cut in a
   * veil shows whatever was under the veil, so a torch in a cave lit
   * the rock as brightly as the sun had. This is what the lamp is
   * lighting *against*
   */
  fill: string;
  fillDepth: number;
  /** What a lamp adds back where it reaches, and how much at its middle */
  glow: string;
  glowStrength: number;
}

export const LAMPLIT: Partial<Record<Weather, Lamplit>> = {
  // Pitch black, and black rather than the blue it used to be: a dark
  // day is the one sky whose whole point is that the board is gone
  // except where something is lit, and a night-blue veil at seven
  // eighths left the country legible through it
  [Weather.DarkDay]: {
    colour: '#000000',
    depth: 1,
    fill: '#2b3350',
    fillDepth: 0.55,
    glow: '#ffd9a6',
    glowStrength: 0.3,
  },
};

/**
 * The dark underground, which is not a sky at all.
 *
 * A cave has no weather over it, so nothing in the table above ever
 * answers for one: this is the veil a cave is drawn under whatever is
 * happening on the surface above it, and it never lifts. Black: what
 * a lamp does not reach underground is not dim, it is unseen
 */
export const CAVERN: Lamplit = {
  colour: '#000000',
  depth: 1,
  // Rock lit by a torch, not by the sun: the fill takes the day out of
  // the stone, and the warm pool is the only light down here
  fill: '#3a3a4e',
  fillDepth: 0.62,
  glow: '#ffc07a',
  glowStrength: 0.38,
};

/**
 * How wide the dark is kept, whatever the window is. A lamp is a soft
 * edge and nothing else, so it survives being drawn small and
 * stretched: a mask the size of the page would be a page repainted
 * every frame
 */
const MASK_WIDE = 320;

let mask: HTMLCanvasElement | null = null;

/**
 * The dark, with a hole burnt in it wherever a lamp stands.
 *
 * Cut rather than drawn: the lamps are taken out of a full sheet with
 * `destination-out`, so two lamps standing close together share one
 * pool of light instead of stacking two into a bright spot
 */
export function lampMask(
  width: number,
  height: number,
  dark: Lamplit,
  lamps: Lamp[],
  strength: number,
): HTMLCanvasElement | null {
  const held = mask ?? document.createElement('canvas');
  const scale = MASK_WIDE / width;
  const down = Math.max(1, Math.round(height * scale));

  // Only when it differs: setting a size reallocates the bitmap even when it is the same
  if (held.width !== MASK_WIDE || held.height !== down) {
    held.width = MASK_WIDE;
    held.height = down;
  }

  const into = held.getContext('2d');

  if (into == null) {
    return null;
  }
  into.clearRect(0, 0, MASK_WIDE, down);
  into.globalAlpha = dark.depth * strength;
  into.fillStyle = dark.colour;
  into.fillRect(0, 0, MASK_WIDE, down);
  into.globalAlpha = 1;
  into.globalCompositeOperation = 'destination-out';
  for (const lamp of lamps) {
    const reach = lamp.reach * scale;

    if (!(reach > 0)) {
      continue;
    }
    const glow = into.createRadialGradient(0, 0, 0, 0, 0, reach);

    // Nearly clear at the lamp and gone by its edge, so what it lights
    // has no rim around it
    glow.addColorStop(0, '#000000f2');
    glow.addColorStop(0.55, '#000000a8');
    glow.addColorStop(1, '#00000000');
    // Squashed about the lamp rather than drawn as an ellipse: the
    // gradient is round, and laying the whole thing back is what puts
    // the pool on the ground instead of on the glass
    into.save();
    into.translate(lamp.x * scale, lamp.y * scale);
    into.scale(1, lamp.squash ?? 1);
    into.fillStyle = glow;
    into.fillRect(-reach, -reach, reach * 2, reach * 2);
    into.restore();
  }
  into.globalCompositeOperation = 'source-over';
  mask = held;
  return held;
}

/** Held apart from the veil's: both are wanted in the same frame */
let pools: HTMLCanvasElement | null = null;

/**
 * The light a lamp puts out, as a sheet of warm pools on nothing.
 *
 * Laid over the veil with `screen`, so it adds rather than uncovers:
 * a hole in the dark only shows whatever was under it, and what makes
 * a torch read as a torch is the colour it throws
 */
export function lampGlow(
  width: number,
  height: number,
  dark: Lamplit,
  lamps: Lamp[],
  strength: number,
): HTMLCanvasElement | null {
  const held = pools ?? document.createElement('canvas');
  const scale = MASK_WIDE / width;
  const down = Math.max(1, Math.round(height * scale));

  if (held.width !== MASK_WIDE || held.height !== down) {
    held.width = MASK_WIDE;
    held.height = down;
  }

  const into = held.getContext('2d');

  if (into == null) {
    return null;
  }
  into.clearRect(0, 0, MASK_WIDE, down);
  // Lighter rather than laid over: two lamps side by side make the
  // ground between them brighter, which is what two lamps do
  into.globalCompositeOperation = 'lighter';
  into.globalAlpha = Math.max(0, Math.min(1, strength));
  for (const lamp of lamps) {
    const reach = lamp.reach * scale;

    if (!(reach > 0)) {
      continue;
    }
    const pool = into.createRadialGradient(0, 0, 0, 0, 0, reach);
    const middle = Math.round(Math.max(0, Math.min(1, dark.glowStrength)) * 255)
      .toString(16)
      .padStart(2, '0');

    // Brightest at the lamp and out by its edge, on the same curve the
    // veil is cut with so the light and the hole agree
    pool.addColorStop(0, `${dark.glow}${middle}`);
    pool.addColorStop(
      0.55,
      `${dark.glow}${Math.round(Number.parseInt(middle, 16) * 0.45)
        .toString(16)
        .padStart(2, '0')}`,
    );
    pool.addColorStop(1, `${dark.glow}00`);
    into.save();
    into.translate(lamp.x * scale, lamp.y * scale);
    into.scale(1, lamp.squash ?? 1);
    into.fillStyle = pool;
    into.fillRect(-reach, -reach, reach * 2, reach * 2);
    into.restore();
  }
  into.globalCompositeOperation = 'source-over';
  into.globalAlpha = 1;
  pools = held;
  return held;
}

/** The whole dark, in the order it is laid: the fill, the veil, the pools */
export function paintLamplit(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dark: Lamplit,
  lamps: Lamp[],
  strength: number,
): void {
  const veil = lampMask(width, height, dark, lamps, strength);
  const glow = lampGlow(width, height, dark, lamps, strength);

  context.save();
  if (dark.fillDepth > 0) {
    context.globalCompositeOperation = 'multiply';
    context.globalAlpha = dark.fillDepth * strength;
    context.fillStyle = dark.fill;
    context.fillRect(0, 0, width, height);
  }
  context.globalAlpha = 1;
  if (veil != null) {
    context.globalCompositeOperation = 'source-over';
    context.drawImage(veil, 0, 0, width, height);
  }
  if (glow != null) {
    context.globalCompositeOperation = 'screen';
    context.drawImage(glow, 0, 0, width, height);
  }
  context.restore();
}

/** The same three passes, written into a batch */
export function batchLamplit(
  batch: Painter,
  width: number,
  height: number,
  dark: Lamplit,
  lamps: Lamp[],
  strength: number,
): boolean {
  const veil = lampMask(width, height, dark, lamps, strength);
  const glow = lampGlow(width, height, dark, lamps, strength);
  const box = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  if (dark.fillDepth > 0) {
    batch.solid(dark.fill, box, dark.fillDepth * strength, 'multiply');
  }
  for (const [sheet, blend] of [
    [veil, 'over'],
    [glow, 'screen'],
  ] as const) {
    if (sheet == null) {
      continue;
    }
    batch.invalidate(sheet);
    batch.quad(
      sheet,
      { x: 0, y: 0, width: sheet.width, height: sheet.height },
      box,
      1,
      undefined,
      'smooth',
      blend,
    );
  }
  return veil != null;
}

/** A sky that lights up, and how often. */
