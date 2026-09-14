/**
 * The sparkle a shiny throws the first time it is seen.
 *
 * A shiny is a **recolour**, and some of them are a shade off the
 * ordinary coat, so a player who does not know the palette would walk
 * straight past one. The first sight of a shiny bursts a ring and rays
 * of light out of its middle and then scatters glints over it, once: it
 * is an announcement rather than something a shiny wears.
 *
 * Everything here is a **share of the sprite** rather than a number of
 * pixels, so the same sparkle reads on a pokemon two dozen pixels tall
 * across a chunk and on the same pokemon blown up four times in a
 * dialog. Every shape carries a dark edge, so it reads on sand and on a
 * dark page alike.
 */

/** How long a sparkle runs for, in milliseconds */
export const SPARKLE_LIFE = 1400;

/** How long the opening burst of ring and rays lasts */
export const SPARKLE_BURST = 480;

/** How long one glint lasts. They are staggered over the rest of the sparkle */
export const SPARKLE_STAR_LIFE = 560;

/** How many glints one sparkle throws */
export const SPARKLE_STARS = 9;

/** How many rays the burst throws, long and short in turn */
export const SPARKLE_RAYS = 8;

/** How big a glint is at its widest, as a share of the sprite's own width */
export const SPARKLE_STAR_SIZE = 0.3;

/** How far the long rays and the ring reach from the middle, as a share of the sprite's width */
export const SPARKLE_RAY_REACH = 0.62;
export const SPARKLE_RING_REACH = 0.55;

/** Where the burst comes from, as a share of the sprite's height above the point it stands on */
export const SPARKLE_MIDDLE = -0.5;

/**
 * The smallest a glint is ever drawn, in pixels. A pokemon standing
 * across the board is a couple of dozen pixels tall, and a glint sized
 * purely as a share of that would be a lit pixel and nothing more
 */
const SPARKLE_MIN_STAR = 2;

/** How far a glint drifts upward over its life, as a share of the sprite's height */
export const SPARKLE_RISE = 0.12;

/**
 * How far to either side of the sprite the glints are thrown, as a
 * share of its width. A glint sits on the outline as often as on the
 * middle, so they spread a little past the picture
 */
export const SPARKLE_SPREAD = 1.4;

export const SPARKLE_COLORS = {
  /** Warm rather than white, so the light reads as a glint off the coat */
  fill: '#fff2a8',
  /** The core of every shape, brighter than its tint */
  core: '#ffffff',
  /** The line round every shape, so a pale glint still shows on sand */
  edge: 'rgba(90, 60, 0, 0.6)',
} as const;

/** The tints the glints take in turn: gold, white and a cold blue */
export const SPARKLE_TINTS = ['#fff2a8', '#ffffff', '#c8f4ff'] as const;

export interface SparkleOptions {
  /**
   * How far to either side of the sprite the glints may fall, as a
   * share of its width. Anything drawing into a box cut to the picture
   * wants less than the default, or the outermost ones are clipped
   */
  spread?: number;
}

/**
 * Where one glint sits and when it lights, worked out from the
 * sparkle's seed and the glint's number.
 *
 * Derived rather than rolled: two players looking at the same shiny
 * should see the same glints, and a sparkle that re-rolled on every
 * frame would shimmer rather than sparkle
 */
export function sparkleStar(
  seed: number,
  star: number,
  spread: number,
): { x: number; y: number; delay: number } {
  const mixed = Math.imul(seed + 1, 374_761_393) ^ Math.imul(star + 1, 2_246_822_519);
  const across = (Math.abs(mixed) >>> 5) % 1000;
  const height = (Math.abs(Math.imul(mixed, 668_265_263)) >>> 7) % 1000;
  // The glints open as the burst is dying, one after another
  const start = SPARKLE_BURST * 0.3;

  return {
    x: ((across / 1000) * spread - spread / 2) / 2,
    // Up the body rather than around the feet, since that is where the
    // light would catch
    y: -0.15 - (height / 1000) * 0.75,
    delay: start + (star / SPARKLE_STARS) * (SPARKLE_LIFE - SPARKLE_STAR_LIFE - start),
  };
}

/** Eases out, so the burst leaves fast and settles */
function easeOut(share: number): number {
  return 1 - (1 - share) ** 3;
}

/**
 * One glint: a four-pointed star with a shorter cross turned between
 * its points and a white core, turned by `spin`
 */
function drawGlint(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  spin: number,
  tint: string,
): void {
  const point = (size: number): void => {
    context.beginPath();
    context.moveTo(0, -size);
    context.quadraticCurveTo(0, 0, size, 0);
    context.quadraticCurveTo(0, 0, 0, size);
    context.quadraticCurveTo(0, 0, -size, 0);
    context.quadraticCurveTo(0, 0, 0, -size);
    context.closePath();
  };

  context.save();
  context.translate(x, y);
  context.rotate(spin + Math.PI / 4);
  point(radius * 0.55);
  context.fillStyle = SPARKLE_COLORS.core;
  context.fill();
  context.stroke();
  context.rotate(-Math.PI / 4);
  point(radius);
  context.fillStyle = tint;
  context.fill();
  context.stroke();
  context.fillStyle = SPARKLE_COLORS.core;
  context.beginPath();
  context.arc(0, 0, Math.max(0.5, radius * 0.14), 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * Draw a shiny's sparkle over the sprite it belongs to.
 *
 * `x` and `y` are the point the pokemon stands on, and `frame` is the
 * sheet's own frame size before the scale. `age` is how long the
 * sparkle has been running: past `SPARKLE_LIFE` nothing is drawn, which
 * is what makes this something that happens once. `seed` decides where
 * the glints fall and only has to be stable
 */
export default function drawSparkle(
  context: CanvasRenderingContext2D,
  seed: number,
  age: number,
  x: number,
  y: number,
  frame: { width: number; height: number },
  scale: number,
  options: SparkleOptions = {},
): void {
  if (age < 0 || age > SPARKLE_LIFE) {
    return;
  }

  const width = frame.width * scale;
  const height = frame.height * scale;
  const spread = options.spread ?? SPARKLE_SPREAD;
  const middleX = x;
  const middleY = y + SPARKLE_MIDDLE * height;

  context.save();
  context.lineCap = 'round';

  // The burst: rays thrown out of the middle and a ring going out
  // behind them, each a dark line with the light drawn over it
  if (age < SPARKLE_BURST) {
    const share = age / SPARKLE_BURST;
    const out = easeOut(share);
    const fade = 1 - share;
    const thick = Math.max(1, width * 0.04 * fade);

    for (let ray = 0; ray < SPARKLE_RAYS; ray += 1) {
      // Off the axes, so the burst never reads as a crosshair
      const angle = ((ray + 0.5) / SPARKLE_RAYS) * Math.PI * 2;
      const reach = width * SPARKLE_RAY_REACH * (ray % 2 === 0 ? 1 : 0.6);
      // A streak flying out, rather than a line drawn from the middle
      const from = reach * (0.3 + 0.45 * out);
      const to = reach * (0.45 + 0.55 * out);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      context.globalAlpha = fade;
      context.strokeStyle = SPARKLE_COLORS.edge;
      context.lineWidth = thick * 2.2;
      context.beginPath();
      context.moveTo(middleX + cos * from, middleY + sin * from);
      context.lineTo(middleX + cos * to, middleY + sin * to);
      context.stroke();
      context.strokeStyle = ray % 2 === 0 ? SPARKLE_COLORS.core : SPARKLE_COLORS.fill;
      context.lineWidth = thick;
      context.stroke();
    }

    const ring = Math.max(1, width * SPARKLE_RING_REACH * out);

    context.globalAlpha = fade;
    context.strokeStyle = SPARKLE_COLORS.edge;
    context.lineWidth = thick * 1.8;
    context.beginPath();
    context.arc(middleX, middleY, ring, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = SPARKLE_COLORS.fill;
    context.lineWidth = thick * 0.8;
    context.stroke();
  }

  // The glints, lit one after another over the body
  context.strokeStyle = SPARKLE_COLORS.edge;
  context.lineWidth = 1;

  for (let star = 0; star < SPARKLE_STARS; star++) {
    const { x: across, y: up, delay } = sparkleStar(seed, star, spread);
    const lived = (age - delay) / SPARKLE_STAR_LIFE;

    if (lived < 0 || lived > 1) {
      continue;
    }

    // Up and back down: a glint opens, holds for an instant at its
    // widest, and is gone, turning a little as it does
    const swell = Math.sin(lived * Math.PI);

    context.globalAlpha = swell;
    drawGlint(
      context,
      x + across * width,
      y + up * height - lived * height * SPARKLE_RISE,
      Math.max(SPARKLE_MIN_STAR, swell * width * SPARKLE_STAR_SIZE),
      (lived - 0.5) * 0.7 * (star % 2 === 0 ? 1 : -1),
      SPARKLE_TINTS[star % SPARKLE_TINTS.length],
    );
  }
  context.restore();
}
