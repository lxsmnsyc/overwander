import { GROUND_DEPTH } from './tilt';
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
 * The four corners a sprite's own picture lands on when the light
 * throws it flat onto the ground.
 *
 * The far edge is thrown exactly where the light says. The near edge
 * is held square to the light, snapped to the nearest quarter turn,
 * so the picture keeps its own rows and columns instead of being
 * drawn at an angle.
 *
 * The snap is what stops a shadow disappearing. Held horizontal at
 * every bearing, the picture has no height left wherever the light
 * runs square across the screen: a sprite is a flat billboard, and
 * the shadow of a flat thing edge-on to the light is a line. True,
 * invisible, and twice a camera turn. Past halfway the picture is
 * laid on its side instead, and it is the pose that carries the
 * direction from there.
 *
 * The spread is worked out in the ground's own directions and laid
 * back afterwards, so the picture is foreshortened exactly as much as
 * the ground it is lying on.
 *
 * Which pose is laid down is the caller's: the light sees the side of
 * whatever it shines on, so a shadow thrown east is cut from the
 * eastward pose
 */
export function castCorners(
  placed: Pick<SpriteQuad, 'top' | 'width' | 'flip'>,
  patch: Pick<ShadowPatch, 'footX' | 'footY'>,
  cast: { dx: number; dy: number; length: number },
): { x: number; y: number }[] {
  const half = (placed.width / 2) * (placed.flip === true ? -1 : 1);
  const high = Math.max(0, patch.footY - placed.top);
  const reach = cast.length * high;
  // How far the throw runs away from the camera before the board lays
  // it back, which is what the spread has to be square to
  const depth = cast.dy / GROUND_DEPTH;
  const alongX = cast.dx * reach;
  const alongY = cast.dy * reach;
  // Square to the throw on the **ground**, then snapped to whichever
  // quarter turn it is nearer, and only then laid back: a spread
  // worked out on the screen would be foreshortened by the wrong
  // amount everywhere but the two bearings it agrees at
  const sideways = Math.abs(depth) < Math.abs(cast.dx);
  const acrossX = sideways ? 0 : -Math.sign(depth || 1) * half;
  const acrossY = sideways ? Math.sign(cast.dx) * GROUND_DEPTH * half : 0;

  return [
    { x: patch.footX + alongX - acrossX, y: patch.footY + alongY - acrossY },
    { x: patch.footX + alongX + acrossX, y: patch.footY + alongY + acrossY },
    { x: patch.footX + acrossX, y: patch.footY + acrossY },
    { x: patch.footX - acrossX, y: patch.footY - acrossY },
  ];
}
