import { PICTURE_SPAN, projectAir } from '../board';
import { type Fall, SALTS, scatterOf } from './fall';

/** One falling thing, in front of the camera and in the world */
/**
 * How far past the screen the fall is spread, on the reference screen.
 *
 * Only far enough to hide a drop's own trail: the positions wrap, so
 * nothing has to be drawn off the edge in order to arrive from it. The
 * longest trail any sky draws is a breeze's, at about eighty pixels.
 *
 * It is not free room. The count is a density over the whole stripe,
 * so a margin twice as wide is nearly twice as many drops, and every
 * one of the extra ones is drawn where nobody can see it
 */
const MARGIN = 128;

/**
 * The screen every fall is described for.
 *
 * A density is drops per square pixel, so left alone a fall costs what
 * the window is worth: the same blizzard is 1,900 flakes on a laptop
 * and 22,000 on a 4K monitor, each of them a ninth the size of the
 * board they are falling on. Both are wrong. The board is fitted to
 * the window, so a bigger window is the same board drawn larger, and
 * the sky over it should be the same sky drawn larger too
 */
const REFERENCE = 960 * 540;

/**
 * How much of a fall's own density is actually drawn.
 *
 * The tables describe a sky flat against the glass, where every drop
 * costs the same and none of them overlap. Standing in the world they
 * pile up down the near half of the volume and read far heavier than
 * the same number ever did on the lens, so the whole set is drawn back
 * to this. It is a number rather than eleven smaller ones because it
 * is one decision, and the tables still read as each sky's own
 */
const SKY_DENSITY = 0.4;

/**
 * How much larger than the reference this window is, along one side.
 *
 * Clamped at both ends: below it a drop thins to a hairline nobody can
 * see, and above it the count is allowed to grow again rather than a
 * raindrop being drawn four pixels wide
 */
const ZOOM_RANGE = [0.75, 2.5];

export function zoomFor(width: number, height: number): number {
  const raw = Math.sqrt((width * height) / REFERENCE);

  return Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], raw));
}

/**
 * Where every drop of a fall is this moment, handed one at a time to
 * whoever is drawing them. `tip` is where the drop ends, which is
 * where it started for a fall of round drops.
 *
 * A function of its own so the stroked pass and the batched one ask
 * the same arithmetic the same question. Two copies of this would be
 * two skies that drift apart by a pixel with nobody able to say which
 */
export function eachDrop(
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
  visit: (x: number, y: number, tipX: number, tipY: number) => void,
): void {
  const seconds = clock / 1000;
  const margin = MARGIN * zoom;
  const across = width + margin * 2;
  const down = height + margin;
  // Counted on the reference screen rather than this one, so the sky
  // costs the same whatever the window is: the drops are made larger
  // instead of more numerous
  const count = Math.round(
    (fall.density * SKY_DENSITY * across * down) / (zoom * zoom) / 1_000_000,
  );
  const length = fall.length * zoom;

  // A round drop is a segment going nowhere under a round cap, which
  // is a circle of the cap's own width — so the cap carries the
  // diameter where an arc carried the radius
  const noise = scatterOf(count);
  // Lifted out of the loop: both are the same for every drop, and a
  // fall this wide is a hot enough loop to care
  const fallen = seconds * fall.speed * zoom;
  const blown = seconds * fall.drift * zoom;
  // Along the way it is actually travelling, so a drop blown sideways
  // leans the way the wind is blowing it
  const lean = fall.drift / fall.speed;

  for (let at = 0; at < count; at++) {
    const of = at * SALTS;
    // Its own pace, so the fall reads as many things falling rather
    // than one sheet sliding
    const pace = 0.75 + noise[of + 2] * 0.5;
    const y = ((noise[of] * down + fallen * pace) % down) - margin;
    const x = ((noise[of + 1] * across + blown * pace) % across) - margin + noise[of + 3] * zoom;

    visit(x, y, x - length * lean, y - length);
  }
}

/**
 * Where the board is on screen, and which way round it is.
 *
 * The picture's box is what `fitPicture` already answers with, and the
 * yaw is the camera the player has walked round. Handed in, the sky is
 * drawn as weather standing in the world; left out, it is drawn flat
 * against the glass the way it always was — which is what the weather
 * demo, having no board to stand in, still wants
 */
export interface SkyCamera {
  yaw: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How wide the volume of weather is and how high it reaches, in board
 * widths. It has to be a good deal larger than the board: the volume
 * is fixed in the world, so it must cover the frame whichever way the
 * camera is facing
 */
const VOLUME_SPAN = 4.6;
const VOLUME_HEAD = 1.5;

/**
 * How many more drops go in it than a flat sky asks for. Most of the
 * volume is off screen at any one moment, and the ones that are not
 * are thinned again by depth, so the count has to start higher to
 * arrive at the same weather
 */
const VOLUME_FILL = 4.3;

/**
 * The depth at which every drop is kept, and how gently the rest leave.
 *
 * A slab of world at arm's length projects onto more screen than the
 * same slab at the horizon, so a density even in the world piles up
 * into a mat along the far edge. Keeping a share proportional to the
 * scale squared evens it out — and the ones it drops were costing full
 * price to draw a third of a pixel. The band is what stops a drop
 * blinking as the camera turns it past the line
 */
const NEAR = 1.6;
const THIN_BAND = 0.18;

/**
 * How much longer a streak is drawn than its own length.
 *
 * A streak that is mostly vertical keeps only `cos(pitch)` of itself
 * seen from up here, so a fall drawn true to scale reads lighter than
 * the flat version of the same sky
 */
const STREAK = 1.5;

/** Where one drop is in the world, and which way it is travelling */
export interface WorldDrop {
  u: number;
  v: number;
  h: number;
  /** The other end of its streak, back along the way it came */
  tailU: number;
  tailH: number;
}

/**
 * Where one drop of a fall stands in the world at this moment.
 *
 * Exported for the one property worth guarding: **it takes no yaw**.
 * A drop's place is `seconds * speed` rather than a step added each
 * frame, so anything that moves with the camera and gets into this
 * arithmetic rewrites the whole history of the fall every frame — and
 * the board's fit, which swells and shrinks four times a turn, is
 * exactly such a thing. `perBoard` is how many pixels a board width is
 * worth, taken from the picture's own width, which the yaw never
 * touches
 */
export function worldDropAt(
  fall: Fall,
  index: number,
  seconds: number,
  perBoard: number,
): WorldDrop {
  const noise = scatterOf(index + 1);
  const of = index * SALTS;
  const pace = 0.75 + noise[of + 2] * 0.5;
  const speed = fall.speed / perBoard;
  const drift = fall.drift / perBoard;
  const length = (fall.length / perBoard) * STREAK;
  /**
   * The way it is actually travelling, as a unit vector. The flat sky
   * leans a streak by `drift / speed` and gets away with it because
   * the streak is a handful of pixels either way; in the world that
   * ratio is the whole length, and a breeze at sixty parts sideways to
   * five down drew a streak eleven board widths long
   */
  const along = Math.hypot(drift, speed) || 1;
  const edge = (VOLUME_SPAN - 1) / 2;
  const h = VOLUME_HEAD - ((noise[of] * VOLUME_HEAD + seconds * speed * pace) % VOLUME_HEAD);

  return {
    u: ((noise[of + 1] * VOLUME_SPAN + seconds * drift * pace) % VOLUME_SPAN) - edge,
    v: noise[of + 3] * VOLUME_SPAN - edge,
    h,
    tailU:
      ((noise[of + 1] * VOLUME_SPAN + seconds * drift * pace) % VOLUME_SPAN) -
      edge -
      (drift / along) * length,
    tailH: h + (speed / along) * length,
  };
}

/**
 * Whether a drop this far off is drawn at all, and how strongly.
 *
 * A slab of world at arm's length projects onto more screen than the
 * same slab at the horizon, so a density even in the world piles up
 * into a mat along the far edge. Keeping a share proportional to the
 * scale squared evens it out, and the ones it drops were costing full
 * price to draw a third of a pixel. `queued` is the drop's own place
 * in the queue, so the same drops thin out frame after frame rather
 * than the whole field flickering
 */
export function thinningAt(scale: number, queued: number): number {
  const room = Math.min(1, (scale / NEAR) * (scale / NEAR));

  return Math.min(1, (room - queued) / THIN_BAND);
}

/**
 * Where every drop of a fall is this moment, as a thing standing in
 * the world rather than on the glass.
 *
 * A drop is `(u, v, h)` in board widths and its place is a pure
 * function of its own number and the clock, exactly as the flat one
 * is. What it must never be a function of is the board's fit: that
 * swells and shrinks four times a turn, and since a drop's place is
 * `seconds * speed` rather than a step added each frame, a speed that
 * moved with the camera would rewrite the whole history of the fall
 * every frame. Pixels become board widths through the picture's own
 * width, which the yaw cannot touch
 */
export function eachWorldDrop(
  width: number,
  height: number,
  camera: SkyCamera,
  fall: Fall,
  clock: number,
  zoom: number,
  visit: (x: number, y: number, tipX: number, tipY: number, scale: number, weight: number) => void,
): void {
  const seconds = clock / 1000;
  const margin = MARGIN * zoom;
  const across = width + margin * 2;
  const down = height + margin;
  const count = Math.round(
    (fall.density * SKY_DENSITY * VOLUME_FILL * across * down) / (zoom * zoom) / 1_000_000,
  );
  const noise = scatterOf(count);

  // How many pixels one board width is worth. Free of the fit, and so
  // free of the yaw
  const perBoard = camera.width / PICTURE_SPAN;
  const radius = VOLUME_SPAN / 2;

  for (let at = 0; at < count; at++) {
    const drop = worldDropAt(fall, at, seconds, perBoard);

    // A square of world turned under the camera puts its corners in
    // frame and takes them out again four times a turn, which reads as
    // the weather thickening and thinning. A disc has no corners
    if ((drop.u - 0.5) * (drop.u - 0.5) + (drop.v - 0.5) * (drop.v - 0.5) > radius * radius) {
      continue;
    }

    const head = projectAir({ u: drop.u, v: drop.v }, drop.h, camera.yaw);

    if (head.scale <= 0.02) {
      continue;
    }

    const weight = thinningAt(head.scale, noise[at * SALTS + 4]);

    if (weight <= 0) {
      continue;
    }

    const x = camera.x + head.x * camera.width;
    const y = camera.y + head.y * camera.height;

    if (x < -margin || x > width + margin || y < -margin || y > height + margin) {
      continue;
    }

    const tail = projectAir({ u: drop.tailU, v: drop.v }, drop.tailH, camera.yaw);

    visit(
      x,
      y,
      camera.x + tail.x * camera.width,
      camera.y + tail.y * camera.height,
      head.scale,
      weight,
    );
  }
}

export function paintFall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
  camera?: SkyCamera,
): void {
  const dots = fall.length <= 0;
  const thickness = (dots ? fall.thickness * 2 : fall.thickness) * zoom;

  context.strokeStyle = fall.colour;
  // Round only where the cap *is* the drop. On a line it rounds two
  // ends nobody can resolve at a pixel wide, and a round cap is a
  // circle to work out at each end of every drop in the sky
  context.lineCap = dots ? 'round' : 'butt';

  if (camera == null) {
    context.lineWidth = thickness;
    context.beginPath();
    eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
      context.moveTo(x, y);
      // A hair rather than nothing at all: a subpath of zero length is
      // meant to paint its cap and does, but a hair is the same circle
      // and asks nobody to be sure
      context.lineTo(dots ? x + 0.01 : tipX, dots ? y : tipY);
    });
    context.stroke();
    return;
  }

  /**
   * A drop in the world is drawn at the size of the ground under it,
   * so the pen changes per drop and the whole fall cannot be one path.
   * Both are rounded into steps and the path is broken only when the
   * step changes, which puts the sky back into a few dozen strokes
   * rather than one per drop
   */
  let pen = -1;
  let ink = -1;

  context.beginPath();
  eachWorldDrop(width, height, camera, fall, clock, zoom, (x, y, tipX, tipY, scale, weight) => {
    const wide = Math.round(Math.max(0.4, thickness * scale) * 4) / 4;
    const alpha = Math.round(weight * 8) / 8;

    if (wide !== pen || alpha !== ink) {
      context.stroke();
      context.beginPath();
      context.lineWidth = wide;
      context.globalAlpha = Math.max(0.05, alpha);
      pen = wide;
      ink = alpha;
    }
    context.moveTo(x, y);
    context.lineTo(dots ? x + 0.01 : tipX, dots ? y : tipY);
  });
  context.stroke();
  context.globalAlpha = 1;
}
