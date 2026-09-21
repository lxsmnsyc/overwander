/**
 * The arrival of a legendary or a mythical, painted in code.
 *
 * Deliberately nothing like the shiny sparkle beside it: a shiny is
 * glints thrown off a coat, and this is the air itself gathering. Light
 * is drawn in to the pokemon, goes off in a flash, and leaves a ring
 * rolling out along the ground. Nothing climbs, since a beam standing
 * over one on the board reads as a landmark rather than as a pokemon.
 *
 * Everything is a share of `HERALD_FRAME` times the scale it is drawn
 * at, so the announcement is the same size whatever is standing there.
 * Every shape carries a dark edge, so a pale colour reads on sand.
 */

/** The sprite size every herald is drawn for, in sheet pixels */
export const HERALD_FRAME = 72;

/** How long one runs for, in milliseconds */
export const HERALD_BURST_LIFE = 2600;

/** The share of that spent drawing light in, and the share the flash holds for */
const GATHER = 0.42;
const FLASH = 0.12;

/** How many motes are drawn in, and how far out they start, as a share of the picture */
const MOTES = 12;
const MOTE_REACH = 0.85;

/** How wide a mote is at its widest, as a share of the picture */
const MOTE_SIZE = 0.035;

/** How far the ground ring rolls out, and how flat it lies */
const RING_REACH = 0.95;
const RING_SQUASH = 0.38;

/** Where the middle of it sits above the point it stands on, as a share of the picture */
const MIDDLE = -0.45;

/** The line round every shape */
const EDGE = 'rgba(24, 12, 44, 0.55)';

/** The smallest a mote is ever drawn, in pixels, for a board zoomed far out */
const MIN_MOTE = 1.5;

/** Where one mote comes in from, and when, from the seed and its number */
function heraldMote(seed: number, mote: number): { angle: number; delay: number; reach: number } {
  const mixed = Math.imul(seed + 1, 2_246_822_519) ^ Math.imul(mote + 1, 374_761_393);
  const turn = (Math.abs(mixed) >>> 5) % 1000;
  const far = (Math.abs(Math.imul(mixed, 668_265_263)) >>> 7) % 1000;

  return {
    angle: (turn / 1000) * Math.PI * 2,
    // Staggered over the gathering, so they arrive in a stream
    delay: (mote / MOTES) * GATHER * 0.6,
    reach: MOTE_REACH * (0.7 + (far / 1000) * 0.3),
  };
}

/** Eases out, so what leaves the middle leaves fast and settles */
function easeOut(share: number): number {
  return 1 - (1 - share) ** 3;
}

/**
 * Draw the arrival over the pokemon it belongs to.
 *
 * `x` and `y` are the point it stands on, `scale` how many canvas
 * pixels a sheet pixel covers, and `age` how long it has been running:
 * past `HERALD_BURST_LIFE` nothing is drawn, which is what makes this
 * something that happens once. `colour` is what kind it is announcing
 */
export default function drawHerald(
  context: CanvasRenderingContext2D,
  seed: number,
  age: number,
  x: number,
  y: number,
  scale: number,
  colour: string,
): void {
  if (age < 0 || age > HERALD_BURST_LIFE) {
    return;
  }

  const share = age / HERALD_BURST_LIFE;
  const width = HERALD_FRAME * scale;
  const middleY = y + MIDDLE * width;

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  // The light drawn in: motes falling toward it from every side, each
  // a line rather than a dot, so what they are doing is legible
  if (share < GATHER + FLASH) {
    for (let mote = 0; mote < MOTES; mote++) {
      const { angle, delay, reach } = heraldMote(seed, mote);
      const lived = (share - delay) / (GATHER - delay);

      if (lived < 0 || lived > 1) {
        continue;
      }
      const from = reach * (1 - lived);
      const to = Math.max(0, from - 0.12 * (1 - lived));
      const cos = Math.cos(angle);
      const sin = Math.sin(angle) * RING_SQUASH * 2;
      const size = Math.max(MIN_MOTE, width * MOTE_SIZE * (0.4 + lived * 0.6));

      context.globalAlpha = Math.min(1, lived * 3) * (1 - lived * 0.3);
      context.strokeStyle = EDGE;
      context.lineWidth = size * 2;
      context.beginPath();
      context.moveTo(x + cos * from * width, middleY + sin * from * width);
      context.lineTo(x + cos * to * width, middleY + sin * to * width);
      context.stroke();
      context.strokeStyle = colour;
      context.lineWidth = size;
      context.stroke();
    }
  }

  // The flash: a core of light where they all arrived
  if (share > GATHER - 0.08 && share < GATHER + FLASH * 2) {
    const lit = 1 - Math.abs(share - GATHER) / (FLASH * 2);
    const radius = width * 0.22 * lit;

    if (radius > 0) {
      const glow = context.createRadialGradient(x, middleY, 0, x, middleY, radius * 2.4);

      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.35, colour);
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      context.globalAlpha = lit;
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, middleY, radius * 2.4, 0, Math.PI * 2);
      context.fill();
    }
  }

  // And the ring it leaves, rolling out along the ground it stands on
  if (share > GATHER) {
    const rolled = (share - GATHER) / (1 - GATHER);
    const out = easeOut(rolled);
    const fade = (1 - rolled) ** 1.5;
    const across = Math.max(1, width * RING_REACH * out);
    const thick = Math.max(1, width * 0.05 * fade);

    context.globalAlpha = fade;
    context.strokeStyle = EDGE;
    context.lineWidth = thick * 2;
    context.beginPath();
    context.ellipse(x, y, across, across * RING_SQUASH, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = colour;
    context.lineWidth = thick;
    context.stroke();

    // A second, narrower one behind it, so the ground reads as struck
    // once rather than as ringed
    const behind = easeOut(Math.max(0, rolled - 0.18) / 0.82);

    if (behind > 0) {
      context.globalAlpha = fade * 0.6;
      context.lineWidth = thick * 0.8;
      context.beginPath();
      context.ellipse(
        x,
        y,
        Math.max(1, across * behind),
        Math.max(1, across * behind * RING_SQUASH),
        0,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }
  }
  context.restore();
}
