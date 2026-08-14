/**
 * The stars a shiny throws the first time it is seen.
 *
 * A shiny is a **recolour**, and some of them are a shade off the
 * ordinary coat — a player who does not know the palette would walk
 * straight past one. So the first sight of a shiny throws a handful of
 * stars over it and then stops: it is an announcement rather than
 * something a shiny wears, and a pokemon that glittered permanently
 * would be scenery within a minute.
 *
 * Everything here is a **share of the sprite** rather than a number of
 * pixels, so the same sparkle reads on a pokemon two dozen pixels tall
 * standing across a chunk and on the same pokemon blown up four times
 * in a dialog. The one exception is the smallest a star may be drawn,
 * which is what keeps a distant one from being a lit pixel.
 */

/**
 * How long a sparkle runs for, in milliseconds. Long enough to be
 * caught out of the corner of an eye, short enough to be over before a
 * player has walked two cells
 */
export const SPARKLE_LIFE = 1100;

/**
 * How long one star of it lasts. They are staggered across the whole
 * of the sparkle, so the last one is fading as the sparkle ends
 */
const SPARKLE_STAR_LIFE = 520;

/**
 * How many stars one sparkle throws
 */
const SPARKLE_STARS = 7;

/**
 * How big a star is at its widest, as a share of the sprite's own
 * width
 */
const SPARKLE_STAR_SIZE = 0.34;

/**
 * The smallest a star is ever drawn, in pixels. A pokemon standing
 * across the board is a couple of dozen pixels tall, and a star sized
 * purely as a share of that would be a lit pixel and nothing more
 */
const SPARKLE_MIN_STAR = 2;

/**
 * How far a star drifts upward over its life, as a share of the
 * sprite's height
 */
const SPARKLE_RISE = 0.12;

/**
 * How far to either side of the sprite the stars are thrown, as a
 * share of its width. A glint sits on the outline as often as on the
 * middle, so they spread a little past the picture — a caller drawing
 * into a box cut to the sprite passes a narrower one
 */
const SPARKLE_SPREAD = 1.4;

export const SPARKLE_COLORS = {
  /**
   * Warm rather than white, so the stars read as a glint off the coat
   * instead of as snow
   */
  fill: '#fff2a8',
  /**
   * The line round one. What a sparkle is drawn over is whatever the
   * biome is, and a pale star on sand is a star nobody sees
   */
  edge: 'rgba(90, 60, 0, 0.55)',
} as const;

export interface SparkleOptions {
  /**
   * How far to either side of the sprite the stars may fall, as a
   * share of its width. Anything drawing into a box cut to the picture
   * wants less than the default, or the outermost stars are clipped
   */
  spread?: number;
}

/**
 * Where one star sits and when it lights, worked out from the sparkle's
 * seed and the star's number.
 *
 * Derived rather than rolled, the same way a spawn's facing is: two
 * players looking at the same shiny should see the same glint, and a
 * sparkle that re-rolled on every frame would shimmer rather than
 * sparkle
 */
function sparkleStar(
  seed: number,
  star: number,
  spread: number,
): { x: number; y: number; delay: number } {
  const mixed = Math.imul(seed + 1, 374_761_393) ^ Math.imul(star + 1, 2_246_822_519);
  const across = (Math.abs(mixed) >>> 5) % 1000;
  const height = (Math.abs(Math.imul(mixed, 668_265_263)) >>> 7) % 1000;

  return {
    x: ((across / 1000) * spread - spread / 2) / 2,
    // Up the body rather than around the feet, since that is where the
    // light would catch
    y: -0.15 - (height / 1000) * 0.75,
    // Spread across the sparkle so they light one after another
    delay: (star / SPARKLE_STARS) * (SPARKLE_LIFE - SPARKLE_STAR_LIFE),
  };
}

/**
 * One four-pointed star: a diamond with its sides pulled in, which is
 * the shape a glint has been drawn as for as long as anything has been
 * drawn sparkling
 */
function drawSparkleStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.quadraticCurveTo(x, y, x, y + radius);
  context.quadraticCurveTo(x, y, x - radius, y);
  context.quadraticCurveTo(x, y, x, y - radius);
  context.fill();
  context.stroke();
}

/**
 * Draw a shiny's sparkle over the sprite it belongs to.
 *
 * `x` and `y` are the point the pokemon stands on — the same point it
 * was drawn at — and `frame` is the sheet's own frame size, before the
 * scale. `age` is how long the sparkle has been running: past
 * `SPARKLE_LIFE` nothing is drawn at all, which is what makes this
 * something that happens once.
 *
 * `seed` decides where the stars fall. Anything with a cell to name
 * passes that; anything showing one pokemon on its own can pass the
 * species, since it only has to be stable
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

  context.save();
  context.fillStyle = SPARKLE_COLORS.fill;
  context.strokeStyle = SPARKLE_COLORS.edge;
  context.lineWidth = 1;

  for (let star = 0; star < SPARKLE_STARS; star++) {
    const { x: across, y: up, delay } = sparkleStar(seed, star, spread);
    const lived = (age - delay) / SPARKLE_STAR_LIFE;

    if (lived < 0 || lived > 1) {
      continue;
    }

    // Up and back down: a star opens, holds for an instant at its
    // widest, and is gone
    const swell = Math.sin(lived * Math.PI);

    context.globalAlpha = swell;
    drawSparkleStar(
      context,
      x + across * width,
      y + up * height - lived * height * SPARKLE_RISE,
      Math.max(SPARKLE_MIN_STAR, swell * width * SPARKLE_STAR_SIZE),
    );
  }
  context.restore();
}
