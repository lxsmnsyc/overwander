import type { ProjectedPoint } from './board';

/**
 * One tile laid on a cell of the tilted board.
 *
 * A cell is not a rectangle once the board is laid back: its two far
 * corners are closer together than its two near ones. A canvas can
 * only draw an image through an affine transform, which gives a
 * parallelogram, so what is drawn is the parallelogram on the cell's
 * far edge and its left side. Across one cell of a sixteen-wide board
 * the difference from the true quad is well under a pixel.
 *
 * The tile is drawn very slightly larger than the cell. Neighbouring
 * cells are each approximated on their own, so cut exactly to size
 * they leave hairlines of the ground showing between them.
 *
 * `turns` is how far round the camera has been walked, in quarters.
 * The art is drawn for one point of view, so the corner the tile hangs
 * from moves with the camera and its own down keeps pointing at the
 * viewer. The tile picked for the cell is turned to match, which is
 * the caller's half of the same job.
 */

/** How far past its cell a tile is drawn, as a fraction of one. */
const OVERLAP = 0.012;

/**
 * A cell's four corners in the tile's own order: the corner the art
 * hangs from, then across, then the far one, then down. `turns` is how
 * far round the camera has been walked, in quarters
 */
export function tileCorners(corners: ProjectedPoint[], turns = 0): ProjectedPoint[] {
  const step = ((turns % 4) + 4) % 4;

  return [
    corners[(4 - step) % 4],
    corners[(5 - step) % 4],
    corners[(6 - step) % 4],
    corners[(7 - step) % 4],
  ];
}

/**
 * The same four corners grown by `OVERLAP`, which is the quad a tile
 * is actually laid on. Read off the corners themselves rather than off
 * two edges of them, so the far side keeps the narrowing the tilt gives
 * it and the tile lands on the same line the grid is drawn with
 */
export function grownQuad(corners: ProjectedPoint[]): { x: number; y: number }[] {
  const [near, across, far, down] = corners;
  const spot = (u: number, v: number): { x: number; y: number } => ({
    x: (1 - u) * (1 - v) * near.x + u * (1 - v) * across.x + u * v * far.x + (1 - u) * v * down.x,
    y: (1 - u) * (1 - v) * near.y + u * (1 - v) * across.y + u * v * far.y + (1 - u) * v * down.y,
  });
  const low = -OVERLAP;
  const high = 1 + OVERLAP;

  return [spot(low, low), spot(high, low), spot(high, high), spot(low, high)];
}

export default function drawTileQuad(
  context: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  spot: { x: number; y: number },
  tile: number,
  corners: ProjectedPoint[],
  turns = 0,
): void {
  const [far, right, , left] = tileCorners(corners, turns);

  context.save();
  context.transform(right.x - far.x, right.y - far.y, left.x - far.x, left.y - far.y, far.x, far.y);
  context.drawImage(
    sheet,
    spot.x,
    spot.y,
    tile,
    tile,
    -OVERLAP,
    -OVERLAP,
    1 + OVERLAP * 2,
    1 + OVERLAP * 2,
  );
  context.restore();
}
