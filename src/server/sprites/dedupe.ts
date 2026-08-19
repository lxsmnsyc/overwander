import { createHash } from 'node:crypto';

/**
 * Packing the same picture once.
 *
 * Half of a sheet is a drawing it already holds: a pose held for ten
 * frames, and a left-facing row that is the right-facing one mirrored.
 * Both are found here by comparing pixels — nothing is assumed about
 * which rows mirror which — and what comes out is a list of the
 * distinct pictures plus, for every frame of the grid, which picture it
 * is and whether it is that picture reflected.
 *
 * The comparison is across **every coat at once**. A shiny is the same
 * pokemon in other colours, and two frames that match on the ordinary
 * drawing may differ on the shiny; all four coats share one description,
 * so a pair is only a pair when it is a pair in all of them.
 */

/**
 * Any decoded picture: four bytes a pixel, however it was read. Named
 * apart from `Raster` so this can be run from a script as well as from
 * the processor, which read their pixels through different doors
 */
export interface Pixels {
  width: number;
  height: number;
  data: Buffer;
}

/**
 * Where the frames of one clip are, in whatever they were read from.
 *
 * A sheet already packed steps a whole frame at a time from the top
 * left of its region; an archive steps a whole **source** cell and
 * starts wherever the trim did. One shape covers both
 */
export interface SourceGrid {
  x: number;
  y: number;
  /** How far apart the cells are. */
  pitchX: number;
  pitchY: number;
  /** Where the kept part starts inside a cell. */
  offsetX: number;
  offsetY: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
}

/** A grid over pictures that are already trimmed and packed. */
export function packedGrid(
  x: number,
  y: number,
  frameWidth: number,
  frameHeight: number,
  columns: number,
  rows: number,
): SourceGrid {
  return {
    x,
    y,
    pitchX: frameWidth,
    pitchY: frameHeight,
    offsetX: 0,
    offsetY: 0,
    frameWidth,
    frameHeight,
    columns,
    rows,
  };
}

/** Where one frame sits in whatever it was read from. */
function spotOf(grid: SourceGrid, column: number, row: number): [number, number] {
  return [grid.x + column * grid.pitchX + grid.offsetX, grid.y + row * grid.pitchY + grid.offsetY];
}

/** Where one frame of the grid gets its picture. */
export interface FrameCell {
  cell: number;
  flip: boolean;
}

export interface Deduped {
  /** The distinct pictures, as `[column, row]` in the source grid. */
  cells: [column: number, row: number][];
  /** One a frame, row-major over the grid. */
  frames: FrameCell[];
  /** How the cells are laid out once packed. */
  columns: number;
  rows: number;
}

/** One frame's pixels, and the same pixels mirrored, as digests. */
function digestsOf(
  raster: Pixels,
  left: number,
  top: number,
  width: number,
  height: number,
): [plain: string, mirrored: string] {
  const plain = createHash('sha256');
  const mirrored = createHash('sha256');
  const row = Buffer.alloc(width * 4);
  const back = Buffer.alloc(width * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = ((top + y) * raster.width + left + x) * 4;

      raster.data.copy(row, x * 4, from, from + 4);
      raster.data.copy(back, (width - 1 - x) * 4, from, from + 4);
    }
    plain.update(row);
    mirrored.update(back);
  }
  return [plain.digest('hex'), mirrored.digest('hex')];
}

/**
 * How wide to lay the kept pictures out.
 *
 * Squarish, so a clip of sixteen distinct frames is four by four rather
 * than a strip sixteen long: the packer fits boxes into a rectangle,
 * and a long thin box wastes whatever it is put beside
 */
function shapeOf(count: number, frameWidth: number, frameHeight: number): [number, number] {
  const across = Math.max(1, Math.round(Math.sqrt((count * frameHeight) / frameWidth)));
  const columns = Math.min(count, across);

  return [columns, Math.ceil(count / columns)];
}

/**
 * Works out which frames of one clip are the same picture.
 *
 * `coats` are the drawings to compare — one is enough, four is the
 * honest answer for a pokemon that has four
 */
export default function dedupe(coats: { raster: Pixels; grid: SourceGrid }[]): Deduped {
  const { frameWidth, frameHeight, columns, rows } = coats[0].grid;
  /** Every coat's digest of one frame, joined: the frame's identity. */
  const identity = new Map<string, number>();
  /** The same, mirrored, for spotting a frame drawn the other way round. */
  const reflected = new Map<string, number>();
  const cells: [number, number][] = [];
  const frames: FrameCell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const plain: string[] = [];
      const mirrored: string[] = [];

      for (const coat of coats) {
        const [left, top] = spotOf(coat.grid, column, row);
        const [one, two] = digestsOf(coat.raster, left, top, frameWidth, frameHeight);

        plain.push(one);
        mirrored.push(two);
      }
      const key = plain.join('|');
      const kept = identity.get(key);

      if (kept != null) {
        frames.push({ cell: kept, flip: false });
        continue;
      }
      // A frame nobody has drawn yet, but somebody has drawn backwards
      const facing = reflected.get(key);

      if (facing != null) {
        frames.push({ cell: facing, flip: true });
        continue;
      }
      const at = cells.length;

      cells.push([column, row]);
      identity.set(key, at);
      reflected.set(mirrored.join('|'), at);
      frames.push({ cell: at, flip: false });
    }
  }

  const [across, down] = shapeOf(cells.length, frameWidth, frameHeight);

  return { cells, frames, columns: across, rows: down };
}

/** One rectangle of pixels into another picture. */
function copy(
  target: Pixels,
  source: Pixels,
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number },
): void {
  for (let row = 0; row < from.height; row += 1) {
    const sourceY = from.y + row;
    const targetY = to.y + row;

    if (sourceY >= source.height || targetY >= target.height) {
      continue;
    }
    const width = Math.min(from.width, source.width - from.x, target.width - to.x);

    if (width <= 0) {
      continue;
    }
    const start = (sourceY * source.width + from.x) * 4;

    source.data.copy(target.data, (targetY * target.width + to.x) * 4, start, start + width * 4);
  }
}

/** Copies the kept pictures of one clip into their packed grid. */
export function drawCells(
  target: Pixels,
  source: Pixels,
  grid: SourceGrid,
  to: { x: number; y: number },
  deduped: Deduped,
): void {
  const { frameWidth, frameHeight } = grid;

  for (let at = 0; at < deduped.cells.length; at += 1) {
    const [column, row] = deduped.cells[at];
    const [left, top] = spotOf(grid, column, row);

    copy(
      target,
      source,
      { x: left, y: top, width: frameWidth, height: frameHeight },
      {
        x: to.x + (at % deduped.columns) * frameWidth,
        y: to.y + Math.floor(at / deduped.columns) * frameHeight,
      },
    );
  }
}

/** An empty picture of a given size. */
export function blankPixels(width: number, height: number): Pixels {
  return { width, height, data: Buffer.alloc(Math.max(0, width * height * 4)) };
}
