import 'server-only';
import type { Drawing } from './files';
import { overworldDestination, writeSheet } from './files';
import type { Raster } from './raster';
import { blank, blit, decode, encode } from './raster';
import computeTrim from './trim';

/**
 * A character sheet, cropped without breaking its grid.
 *
 * A charset is one grid and nothing else: walk frames across, facings
 * down, every cell the same size. That uniformity is the whole of how
 * [`OWCharSprite`](../../canvas/ow-char-sprite.ts) draws — a row and a
 * column are multiplied by the cell size, so there is no lookup and no
 * per-frame rectangle to read. Packing the cells the way loose images
 * are packed would save more bytes and take that away.
 *
 * So the grid stays a grid, and the saving comes from **one rectangle
 * for all of it**: the tightest cell that still holds every frame, cut
 * out of every cell alike. The sheets these come from leave a margin
 * around the character for a taller pose that this one never uses, and
 * that margin is most of the file.
 */

/** How a charset is laid out, and what to call it. */
export interface OverworldOptions {
  /** What the folder under `sprites/overworld` is called. */
  name: string;
  /** Walk frames across. */
  columns: number;
  /** Facings down. */
  rows: number;
  /** Whether the cells are cropped to the tightest one that fits them all. */
  compact: boolean;
}

/** The grid, as the description records it. */
export interface OverworldGrid {
  columns: number;
  rows: number;
  /** The cell as it is stored, which is the cropped one on a compact sheet. */
  frameWidth: number;
  frameHeight: number;
  /** The cell it was cut from. */
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  /** Where the kept part starts inside that cell. */
  trim: [x: number, y: number];
}

/** One sub-image, the same shape an item sheet's entries have. */
interface SheetImage {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  trim: [x: number, y: number];
}

export interface OverworldSheet {
  compact: boolean;
  width: number;
  height: number;
  /**
   * The grid the cells sit on. `images` says where the picture is;
   * this says how to cut it up, which a sheet of one picture cannot
   */
  grid: OverworldGrid;
  images: SheetImage[];
}

/** What the page is told once the sheet is on disk. */
export interface OverworldResult {
  written: string[];
  width: number;
  height: number;
  grid: OverworldGrid;
  drawing: Drawing;
}

/** The name of the one sub-image, which is the whole grid. */
export const GRID_NAME = 'grid';

/**
 * The sheet cut down, and the description of what was cut.
 *
 * Apart from the file system so a test can hand it pixels and read the
 * grid back, which is the half worth checking: the arithmetic is where
 * a frame goes missing, not the writing
 */
export function packGrid(
  raster: Raster,
  options: Pick<OverworldOptions, 'columns' | 'rows' | 'compact'>,
): { sheet: Raster; data: OverworldSheet } {
  const columns = Math.trunc(options.columns);
  const rows = Math.trunc(options.rows);

  if (columns < 1 || rows < 1) {
    throw new Error('A charset needs at least one frame and one facing');
  }
  // A grid that does not divide the image is a grid somebody has
  // guessed wrong, and shaving the remainder off would lose the last
  // column of every sheet quietly
  if (raster.width % columns !== 0 || raster.height % rows !== 0) {
    throw new Error(
      `${raster.width} × ${raster.height} does not divide into ${columns} × ${rows} cells`,
    );
  }

  const sourceFrameWidth = raster.width / columns;
  const sourceFrameHeight = raster.height / rows;
  const trim = options.compact
    ? computeTrim(raster, sourceFrameWidth, sourceFrameHeight, columns, rows)
    : { x: 0, y: 0, width: sourceFrameWidth, height: sourceFrameHeight };
  const sheet = blank(trim.width * columns, trim.height * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      blit(
        sheet,
        raster,
        {
          x: column * sourceFrameWidth + trim.x,
          y: row * sourceFrameHeight + trim.y,
          width: trim.width,
          height: trim.height,
        },
        { x: column * trim.width, y: row * trim.height },
      );
    }
  }

  const grid: OverworldGrid = {
    columns,
    rows,
    frameWidth: trim.width,
    frameHeight: trim.height,
    sourceFrameWidth,
    sourceFrameHeight,
    trim: [trim.x, trim.y],
  };

  return {
    sheet,
    data: {
      compact: options.compact,
      width: sheet.width,
      height: sheet.height,
      grid,
      // One entry, because the grid is one picture: the class takes the
      // largest sub-image as the grid unless it is told a name
      images: [
        {
          name: GRID_NAME,
          x: 0,
          y: 0,
          width: sheet.width,
          height: sheet.height,
          sourceWidth: raster.width,
          sourceHeight: raster.height,
          trim: [trim.x, trim.y],
        },
      ],
    },
  };
}

export default async function processOverworld(
  image: Uint8Array,
  options: OverworldOptions,
): Promise<OverworldResult> {
  const { sheet, data } = packGrid(await decode(image), options);
  const drawn = encode(sheet);
  const written = await writeSheet(
    overworldDestination(options.name),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  return {
    written: written.map((file) => file.path),
    width: data.width,
    height: data.height,
    grid: data.grid,
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
  };
}
