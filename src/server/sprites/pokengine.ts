import 'server-only';
import { readCredits, withCredit, writeCredits } from './credits';
import type { Drawing } from './files';
import { overworldDestination, overworldSlug, writeSheet } from './files';
import type { Raster } from './raster';
import { blank, blit, decode, encode } from './raster';
import computeTrim from './trim';

/**
 * A Pokengine community charset into a sheet the board can walk.
 *
 * The format is fixed: three walk frames across — standing, one step,
 * the other step — and four facings down, every cell the same size.
 * Which facing each row is comes with the sheet, so the rows are put
 * into the order [`OWCharSprite`](../../canvas/ow-char-sprite.ts)
 * reads — Down, Left, Right, Up — while packing, and the description
 * carries the walk cycle a three-frame charset plays: step, stand,
 * other step, stand.
 *
 * The saving is the same one every charset gets: the grid stays a
 * grid, and one rectangle — the tightest cell that still holds every
 * frame — is cut out of every cell alike.
 */

/** Walk frames across: stand, one step, the other. */
export const POKENGINE_COLUMNS = 3;

/** The facings, in the order the game's sheets lay them out. */
export const FACINGS = ['down', 'left', 'right', 'up'] as const;

export type Facing = (typeof FACINGS)[number];

/**
 * How a three-frame walk plays: a step, back to standing, the other
 * step, back to standing — a foot lands every other frame
 */
const WALK_CYCLE = [1, 0, 2, 0];

/** How a charset is laid out, what to call it and who drew it. */
export interface PokengineOptions {
  /** What the folder under `sprites/overworld` is called. */
  name: string;
  /** The sheet's own row order, top to bottom. */
  order: Facing[];
  /** Whether the cells are cropped to the tightest one that fits them all. */
  compact: boolean;
  /** The artist, written into the credits page beside the sheet. */
  credit: string;
}

/** The grid, as the description records it. */
export interface PokengineGrid {
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
  /** The column shown while standing still. */
  standFrame: number;
  /** The order the walk frames play in. */
  cycle: number[];
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

export interface PokengineSheet {
  compact: boolean;
  width: number;
  height: number;
  /**
   * The grid the cells sit on. `images` says where the picture is;
   * this says how to cut it up and how to play it
   */
  grid: PokengineGrid;
  images: SheetImage[];
}

/** What the page is told once the sheet is on disk. */
export interface PokengineResult {
  written: string[];
  width: number;
  height: number;
  grid: PokengineGrid;
  drawing: Drawing;
}

/** The name of the one sub-image, which is the whole grid. */
export const GRID_NAME = 'grid';

/**
 * The row order typed into the form: four facings, each named once.
 * Anything else is somebody guessing, and a guessed order walks every
 * character sideways
 */
export function parseOrder(text: string): Facing[] {
  const known = new Set<string>(FACINGS);
  const order = text
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((name): name is Facing => known.has(name));

  if (order.length !== FACINGS.length || new Set(order).size !== FACINGS.length) {
    throw new Error(`The row order needs each of ${FACINGS.join(', ')} exactly once`);
  }
  return order;
}

/**
 * Antialiased edges snapped to pixel art: alpha below half is gone,
 * the rest is solid, and a gone pixel is zeroed whole so the palette
 * the encoder builds carries no invisible colours. Fewer distinct
 * values is also what lets the encoder pick an indexed container
 */
function harden(raster: Raster): void {
  for (let at = 0; at < raster.data.length; at += 4) {
    if (raster.data[at + 3] < 128) {
      raster.data[at] = 0;
      raster.data[at + 1] = 0;
      raster.data[at + 2] = 0;
      raster.data[at + 3] = 0;
    } else {
      raster.data[at + 3] = 255;
    }
  }
}

/**
 * The sheet cut down and its rows put in reading order, with the
 * description of both.
 *
 * Apart from the file system so a test can hand it pixels and read the
 * grid back: the arithmetic is where a frame goes missing or a facing
 * swaps, not the writing
 */
export function packPokengine(
  raster: Raster,
  options: Pick<PokengineOptions, 'order' | 'compact'>,
): { sheet: Raster; data: PokengineSheet } {
  const columns = POKENGINE_COLUMNS;
  const rows = FACINGS.length;

  // A sheet that does not divide is not this format, and shaving the
  // remainder off would lose the last column of it quietly
  if (raster.width % columns !== 0 || raster.height % rows !== 0) {
    throw new Error(
      `${raster.width} × ${raster.height} does not divide into ${columns} × ${rows} cells`,
    );
  }

  // Before the trim, so a soft fringe that snaps away does not hold
  // the crop open
  harden(raster);

  const sourceFrameWidth = raster.width / columns;
  const sourceFrameHeight = raster.height / rows;
  const trim = options.compact
    ? computeTrim(raster, sourceFrameWidth, sourceFrameHeight, columns, rows)
    : { x: 0, y: 0, width: sourceFrameWidth, height: sourceFrameHeight };
  const sheet = blank(trim.width * columns, trim.height * rows);

  for (let row = 0; row < rows; row += 1) {
    // The sheet's own row for the facing this output row is: the rows
    // land in the game's order whatever order they arrived in
    const source = options.order.indexOf(FACINGS[row]);

    for (let column = 0; column < columns; column += 1) {
      blit(
        sheet,
        raster,
        {
          x: column * sourceFrameWidth + trim.x,
          y: source * sourceFrameHeight + trim.y,
          width: trim.width,
          height: trim.height,
        },
        { x: column * trim.width, y: row * trim.height },
      );
    }
  }

  const grid: PokengineGrid = {
    columns,
    rows,
    frameWidth: trim.width,
    frameHeight: trim.height,
    sourceFrameWidth,
    sourceFrameHeight,
    trim: [trim.x, trim.y],
    standFrame: 0,
    cycle: WALK_CYCLE,
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

export default async function processPokengine(
  image: Uint8Array,
  options: PokengineOptions,
): Promise<PokengineResult> {
  const credit = options.credit.trim();

  // Refused before anything is written: a sheet in `public/` with no
  // row in the credits list is exactly what the credits forbid
  if (credit.length === 0) {
    throw new Error('The sheet needs a credit for the credits list');
  }

  // The credited list is built before the sheet is written for the
  // same reason: a failure here leaves nothing half-done
  const credited = withCredit(await readCredits(), overworldSlug(options.name), credit);
  const { sheet, data } = packPokengine(await decode(image), options);
  const drawn = encode(sheet);
  const written = await writeSheet(
    overworldDestination(options.name),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  const listed = await writeCredits(credited);

  return {
    written: [...written.map((file) => file.path), listed],
    width: data.width,
    height: data.height,
    grid: data.grid,
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
  };
}
