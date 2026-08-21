import { createHash } from 'node:crypto';

/**
 * Packing the same picture once, and only the lit part of it.
 *
 * Half of a sheet is a drawing it already holds: a pose held for ten
 * frames, and a left-facing row that is the right-facing one mirrored.
 * Both are found here by comparing pixels — nothing is assumed about
 * which rows mirror which. Each frame is also cropped to what is drawn
 * in it, which is where most of the sheet goes: a clip's box has to
 * hold its widest lunge, and every other frame of it rattles around
 * inside that box.
 *
 * What comes out is the distinct pictures, plus for every frame of the
 * grid which picture it is, whether it is that picture reflected, and
 * where it sits inside the clip's box.
 *
 * One of these runs for a **whole sheet** rather than for a clip: a
 * pokemon standing still is drawn the same in its Idle, its Charge and
 * the first frame of its Attack, and cropping is what makes those
 * comparable — they were different sizes while each carried its clip's
 * padding.
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

/** A rectangle of pixels, wherever it is measured from. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where one frame of the grid gets its picture, and where it sits. */
export interface FrameCell {
  cell: number;
  flip: boolean;
  /** The picture's corner inside the clip's box, as `[x, y]`. */
  at: [number, number];
}

/** A kept picture: where it is, and which drawing it is read from. */
export interface Picture extends Rect {
  /** Which of the caller's sources holds it. */
  source: number;
}

export interface Deduper {
  /** Every distinct picture found so far, across every clip added. */
  readonly pictures: Picture[];
  /**
   * One clip's frames, in the grid's reading order.
   *
   * `source` says which drawing the clip is read from, and `coats` is
   * which coats that drawing has — two clips only ever share a picture
   * when they were compared across the same coats
   */
  add(coats: { raster: Pixels; grid: SourceGrid }[], source: number, coatKey: string): FrameCell[];
}

/**
 * What is drawn in one frame, across every coat.
 *
 * A shiny may light a pixel the ordinary drawing leaves clear, so the
 * box is the one that holds all of them: they share a description, and
 * a picture cropped per coat would put the coats at different sizes
 */
function contentOf(
  coats: { raster: Pixels; grid: SourceGrid }[],
  column: number,
  row: number,
): Rect | null {
  const { frameWidth, frameHeight } = coats[0].grid;
  let left = frameWidth;
  let top = frameHeight;
  let right = -1;
  let bottom = -1;

  for (const coat of coats) {
    const [fromX, fromY] = spotOf(coat.grid, column, row);

    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        if (coat.raster.data[((fromY + y) * coat.raster.width + fromX + x) * 4 + 3] === 0) {
          continue;
        }
        if (x < left) {
          left = x;
        }
        if (x > right) {
          right = x;
        }
        if (y < top) {
          top = y;
        }
        if (y > bottom) {
          bottom = y;
        }
      }
    }
  }
  return right < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/** One picture's pixels, and the same pixels mirrored, as digests. */
function digestsOf(raster: Pixels, box: Rect): [plain: string, mirrored: string] {
  const plain = createHash('sha256');
  const mirrored = createHash('sha256');
  const row = Buffer.alloc(box.width * 4);
  const back = Buffer.alloc(box.width * 4);

  for (let y = 0; y < box.height; y += 1) {
    for (let x = 0; x < box.width; x += 1) {
      const from = ((box.y + y) * raster.width + box.x + x) * 4;

      raster.data.copy(row, x * 4, from, from + 4);
      raster.data.copy(back, (box.width - 1 - x) * 4, from, from + 4);
    }
    plain.update(row);
    mirrored.update(back);
  }
  return [plain.digest('hex'), mirrored.digest('hex')];
}

/**
 * Something to add a sheet's clips to, one at a time.
 *
 * `trim` crops each frame to what is drawn in it; off, every frame is
 * the whole box, which is what an uncompacted sheet asks for
 */
export default function deduper(trim = true): Deduper {
  /** Every coat's digest of one picture, joined: the picture's identity. */
  const identity = new Map<string, number>();
  /** The same, mirrored, for spotting a picture drawn the other way round. */
  const reflected = new Map<string, number>();
  const pictures: Picture[] = [];

  return {
    pictures,
    add(coats, source, coatKey): FrameCell[] {
      const { frameWidth, frameHeight, columns, rows } = coats[0].grid;
      const frames: FrameCell[] = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const [fromX, fromY] = spotOf(coats[0].grid, column, row);
          // An empty frame still has to be a picture somewhere, so it
          // is the smallest one there is rather than a case of its own
          const content = (trim ? contentOf(coats, column, row) : null) ?? {
            x: 0,
            y: 0,
            width: trim ? 1 : frameWidth,
            height: trim ? 1 : frameHeight,
          };
          // Sized and coated: a picture compared across two coats says
          // nothing about the same picture compared across four
          const stamp = `${coatKey}:${content.width}x${content.height}`;
          const plain: string[] = [stamp];
          const mirrored: string[] = [stamp];

          for (const coat of coats) {
            const [left, top] = spotOf(coat.grid, column, row);
            const [one, two] = digestsOf(coat.raster, {
              ...content,
              x: left + content.x,
              y: top + content.y,
            });

            plain.push(one);
            mirrored.push(two);
          }
          const at: [number, number] = [content.x, content.y];
          const key = plain.join('|');
          const kept = identity.get(key);

          if (kept != null) {
            frames.push({ cell: kept, flip: false, at });
            continue;
          }
          // A picture nobody has drawn yet, but somebody has drawn
          // backwards
          const facing = reflected.get(key);

          if (facing != null) {
            frames.push({ cell: facing, flip: true, at });
            continue;
          }
          const held = pictures.length;

          pictures.push({ ...content, x: fromX + content.x, y: fromY + content.y, source });
          identity.set(key, held);
          reflected.set(mirrored.join('|'), held);
          frames.push({ cell: held, flip: false, at });
        }
      }
      return frames;
    },
  };
}

/** One rectangle of pixels into another picture. */
function copy(target: Pixels, source: Pixels, from: Rect, to: { x: number; y: number }): void {
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

/**
 * Copies the kept pictures onto the sheet, where the packer put them.
 *
 * `from` hands back the drawing a picture is read out of, since a
 * pokemon's clips arrive as one image each. Nothing for a picture this
 * coat was not drawn for, which leaves that picture's corner of the
 * sheet clear
 */
export function drawPictures(
  target: Pixels,
  pictures: Picture[],
  placed: ({ x: number; y: number } | undefined)[],
  from: (source: number) => Pixels | null,
): void {
  for (let at = 0; at < pictures.length; at += 1) {
    const spot = placed[at];
    const source = from(pictures[at].source);

    if (spot == null || source == null) {
      continue;
    }
    copy(target, source, pictures[at], spot);
  }
}

/** An empty picture of a given size. */
export function blankPixels(width: number, height: number): Pixels {
  return { width, height, data: Buffer.alloc(Math.max(0, width * height * 4)) };
}
