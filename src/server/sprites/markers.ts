import type { Raster } from './raster';

/**
 * The anchors a PMD archive paints beside its frames.
 *
 * Every animation ships three images: the drawing, a `-Shadow` image
 * whose blob marks where the shadow sits, and an `-Offsets` image where
 * a single pixel marks each anchor: black the head, green the body,
 * red and blue the two hands. Reading them is how the game knows where
 * to hang a held item or land a hit.
 */

/** Where the rows of a PMD sheet point, in the order they are drawn. */
export const SPRITE_DIRECTIONS = [
  'Down',
  'DownRight',
  'Right',
  'UpRight',
  'Up',
  'UpLeft',
  'Left',
  'DownLeft',
] as const;

export type SpriteDirection = (typeof SPRITE_DIRECTIONS)[number];

export type Point = [x: number, y: number];

type Match = (red: number, green: number, blue: number, alpha: number) => boolean;

/** Half of full, which is all a pure channel has to clear. */
const CHANNEL = 128;

// A shadow image marks its blob and nothing else, so its colour says
// nothing worth reading
const SHADOW: Match = (_red, _green, _blue, alpha) => alpha > 0;
// Black, and the only mark that is: the head follows the facing, so it
// is the one that moves across the frame as the sprite turns
const HEAD: Match = (red, green, blue, alpha) =>
  alpha > 0 && red <= CHANNEL && green <= CHANNEL && blue <= CHANNEL;
const CENTER: Match = (red, green, blue, alpha) =>
  alpha > 0 && green > CHANNEL && red <= CHANNEL && blue <= CHANNEL;
// The two hands, named from the screen rather than from the pokemon: in
// a frame facing the viewer red sits on the left of it and blue on the
// right, which are the pokemon's own right and left
const LEFT: Match = (red, green, blue, alpha) =>
  alpha > 0 && red > CHANNEL && green <= CHANNEL && blue <= CHANNEL;
const RIGHT: Match = (red, green, blue, alpha) =>
  alpha > 0 && blue > CHANNEL && red <= CHANNEL && green <= CHANNEL;

/**
 * The middle of every matching pixel in one cell, relative to that
 * cell's top-left corner, or nothing where the frame carries no such
 * mark. Averaged rather than taken from the first hit, since a marker
 * is a small blob rather than a single pixel
 */
function findMarker(
  raster: Raster | null,
  cellX: number,
  cellY: number,
  width: number,
  height: number,
  match: Match,
): Point | null {
  if (raster == null) {
    return null;
  }
  let totalX = 0;
  let totalY = 0;
  let count = 0;
  const maxY = Math.min(cellY + height, raster.height);
  const maxX = Math.min(cellX + width, raster.width);

  for (let y = cellY; y < maxY; y += 1) {
    for (let x = cellX; x < maxX; x += 1) {
      const at = (y * raster.width + x) * 4;

      if (match(raster.data[at], raster.data[at + 1], raster.data[at + 2], raster.data[at + 3])) {
        totalX += x - cellX;
        totalY += y - cellY;
        count += 1;
      }
    }
  }
  return count === 0 ? null : [Math.round(totalX / count), Math.round(totalY / count)];
}

export interface FrameMarkers {
  shadow: Point | null;
  center: Point | null;
  head: Point | null;
  left: Point | null;
  right: Point | null;
}

/**
 * Every anchor of one frame, moved onto the trimmed frame.
 *
 * Read from the untrimmed cell and then rebased, so a shadow that sits
 * below the feet lands on a negative coordinate rather than being lost
 * with the padding it was drawn in
 */
export default function markersFor(
  shadow: Raster | null,
  offsets: Raster | null,
  cell: { x: number; y: number; width: number; height: number },
  trim: Point,
): FrameMarkers {
  const find = (raster: Raster | null, match: Match): Point | null => {
    const point = findMarker(raster, cell.x, cell.y, cell.width, cell.height, match);

    return point == null ? null : [point[0] - trim[0], point[1] - trim[1]];
  };

  return {
    shadow: find(shadow, SHADOW),
    center: find(offsets, CENTER),
    head: find(offsets, HEAD),
    left: find(offsets, LEFT),
    right: find(offsets, RIGHT),
  };
}
