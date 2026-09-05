import Weather from '../../data/overworld/weather';

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
}

export const LAMPLIT: Partial<Record<Weather, Lamplit>> = {
  // Pitch black, and black rather than the blue it used to be: a dark
  // day is the one sky whose whole point is that the board is gone
  // except where something is lit, and a night-blue veil at seven
  // eighths left the country legible through it
  [Weather.DarkDay]: { colour: '#000000', depth: 1 },
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

  held.width = MASK_WIDE;
  held.height = down;

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

/** A sky that lights up, and how often. */
