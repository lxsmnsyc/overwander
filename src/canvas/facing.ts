import type { SpriteDirection } from './sprite-sheet';

/**
 * Which way a sprite has to look to be looking at something else.
 *
 * A sheet carries eight rows, so a direction is one of eight octants
 * rather than an angle, and this is the rounding between the two. It
 * lives apart from the canvas that uses it because the y axis of a
 * canvas grows **downward** — `down` is a larger y, not a smaller one
 * — which is exactly the kind of thing that is wrong for a week
 * before anybody notices, and is worth a test of its own
 */

const TAU = Math.PI * 2;

/**
 * The eight ways of facing, in the order the octants come round from
 * due east — which is the order `atan2` counts them in a coordinate
 * system whose y grows downward
 */
const FACING_BY_OCTANT: SpriteDirection[] = [
  'Right',
  'DownRight',
  'Down',
  'DownLeft',
  'Left',
  'UpLeft',
  'Up',
  'UpRight',
];

export default function facingToward(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): SpriteDirection {
  const octant = Math.round(Math.atan2(toY - fromY, toX - fromX) / (TAU / 8));

  return FACING_BY_OCTANT[(octant + 8) % 8];
}
