import { GROUND_SQUASH } from './tilt';
import type { QuadSheet, QuadSource } from './gl/quad-batch';

/**
 * Where a picture is cut from and where it lands.
 *
 * Every sprite on this board finishes as one `drawImage`: a rectangle
 * of a sheet, into a rectangle of the page. A class that can answer
 * with those two rectangles can be drawn either way, and the two ways
 * cannot drift apart because `draw` is written in terms of this too.
 */
export interface SpriteQuad {
  sheet: QuadSheet;
  source: QuadSource;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Whether it is drawn mirrored, which the batch does with its corners */
  flip?: boolean;
}

/**
 * The four corners of a quad's box, in ring order, mirrored where the
 * picture is. Handed straight to the batch
 */
export function cornersOf(placed: SpriteQuad): { x: number; y: number }[] {
  const right = placed.left + placed.width;
  const bottom = placed.top + placed.height;
  const [near, far] = placed.flip === true ? [right, placed.left] : [placed.left, right];

  return [
    { x: near, y: placed.top },
    { x: far, y: placed.top },
    { x: far, y: bottom },
    { x: near, y: bottom },
  ];
}

/**
 * The patch of ground a thing throws, as an ellipse: where it sits,
 * how far it reaches each way, and which way it is turned.
 *
 * Reported rather than drawn so the same numbers can be filled with a
 * path or stamped as a turned quad. `angle` is the way the light threw
 * it, which is nothing at all when the sun is down
 */
export interface ShadowPatch {
  x: number;
  y: number;
  /**
   * Where the thing actually stands, which is the near end of the
   * patch rather than its middle. What a silhouette is thrown from
   */
  footX: number;
  footY: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  colour: string;
  alpha: number;
}

/**
 * The four corners of the box a shadow patch fills, turned with it.
 * A round picture stamped on these is the ellipse the path would fill
 */
export function shadowCorners(patch: ShadowPatch): { x: number; y: number }[] {
  const cos = Math.cos(patch.angle);
  const sin = Math.sin(patch.angle);
  const corner = (across: number, down: number): { x: number; y: number } => ({
    x: patch.x + across * patch.radiusX * cos - down * patch.radiusY * sin,
    y: patch.y + across * patch.radiusX * sin + down * patch.radiusY * cos,
  });

  return [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
}

/**
 * How far a shadow settles down the board as it is thrown, as a share
 * of how far it reaches. The board's own squash: a shadow lies on the
 * ground, so it lies the way the ground does.
 *
 * Without it the picture folds onto the very edge it stands on at the
 * hours when the light runs square across the screen. A bearing that
 * is level has no up-and-down left to lay anything down with, and the
 * board being laid back under the camera is not something the sun can
 * say
 */
const SETTLE = GROUND_SQUASH;

/**
 * The least a shadow ever settles, as the same share. Small: it only
 * has anything to say for a shadow thrown almost straight at the
 * camera, which is the one bearing where the settle would otherwise be
 * cancelled out
 */
const LEAST = 0.08;

/**
 * The four corners a sprite's own picture lands on when the light
 * throws it flat onto the ground.
 *
 * A skew rather than a turn. The edge under the feet stays square to
 * the picture and where the picture put it, so a shadow is always
 * joined to the thing that cast it; only the far edge leans, and it
 * leans the way the light throws it. A shadow whose near edge swung
 * with the sun comes away from its own feet, which reads as a second
 * thing lying on the floor.
 *
 * Which pose is laid down is the caller's: the light sees the side of
 * whatever it shines on, so a shadow thrown east is cut from the
 * eastward pose. That is what carries the direction, and it is why
 * this only has to lean the picture over
 */
export function castCorners(
  placed: Pick<SpriteQuad, 'top' | 'width' | 'flip'>,
  patch: Pick<ShadowPatch, 'footX' | 'footY'>,
  cast: { dx: number; dy: number; length: number },
): { x: number; y: number }[] {
  const half = placed.width / 2;
  const high = Math.max(0, patch.footY - placed.top);
  const reach = cast.length * high;
  const [near, far] =
    placed.flip === true
      ? [patch.footX + half, patch.footX - half]
      : [patch.footX - half, patch.footX + half];
  const leanX = cast.dx * reach;
  // Kept clear of the edge it stands on. The drop and the settle are
  // opposite signs of the same measurement, so on their own they meet
  // and cancel at whichever bearing makes them equal, and the shadow
  // has no height left at all there
  const leanY = Math.min(cast.dy * reach - SETTLE * reach, -LEAST * reach);

  return [
    { x: near + leanX, y: patch.footY + leanY },
    { x: far + leanX, y: patch.footY + leanY },
    { x: far, y: patch.footY },
    { x: near, y: patch.footY },
  ];
}
