import 'server-only';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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

/** Where the credits page lives, relative to the working tree. */
const CREDITS_PATH = 'docs/credits.md';

const CREDITS_HEADING = '### Pokengine community';

/**
 * The credits page with this sheet's row upserted into the Pokengine
 * community table, kept sorted so re-packing a sheet updates its row
 * rather than adding a second.
 *
 * Pure, so a test can hand it a page and read the table back: finding
 * the section and keeping the rows straight is the half worth
 * checking, not the file round trip
 */
export function withCredit(page: string, sheet: string, credit: string): string {
  const heading = page.indexOf(CREDITS_HEADING);

  if (heading < 0) {
    throw new Error(`${CREDITS_PATH} has no "${CREDITS_HEADING}" section to credit into`);
  }

  // The section runs to the next heading or the end of the page
  const after = heading + CREDITS_HEADING.length;
  const next = page.slice(after).search(/\n#{2,3} /);
  const end = next < 0 ? page.length : after + next;
  const lines = page.slice(after, end).split('\n');
  const table = lines.findIndex((line) => line.startsWith('|'));

  if (table < 0 || lines.length < table + 2) {
    throw new Error(`The "${CREDITS_HEADING}" section has no table to credit into`);
  }

  // Header and divider stay, and so does anything after the table;
  // only the rows between are rebuilt
  let past = table + 2;

  const rows = new Map<string, string>();

  while (past < lines.length && lines[past].startsWith('|')) {
    const cells = lines[past].split('|').map((cell) => cell.trim());

    if (cells.length >= 3 && cells[1].length > 0) {
      rows.set(cells[1].replace(/`/g, ''), cells[2]);
    }
    past += 1;
  }
  rows.set(sheet, credit);

  const written = [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, artist]) => `| \`${name}\` | ${artist} |`);
  const rebuilt = [...lines.slice(0, table + 2), ...written, ...lines.slice(past)].join('\n');

  return `${page.slice(0, after)}${rebuilt}${page.slice(end)}`;
}

export default async function processPokengine(
  image: Uint8Array,
  options: PokengineOptions,
): Promise<PokengineResult> {
  const credit = options.credit.trim();

  // Refused before anything is written: a sheet in `public/` with no
  // row in the credits page is exactly what the page forbids
  if (credit.length === 0) {
    throw new Error('The sheet needs a credit for the credits page');
  }

  // The credited page is built before the sheet is written for the
  // same reason: a failure here leaves nothing half-done
  const creditsFile = join(process.cwd(), CREDITS_PATH);
  const credited = withCredit(
    await readFile(creditsFile, 'utf8'),
    overworldSlug(options.name),
    credit,
  );
  const { sheet, data } = packPokengine(await decode(image), options);
  const drawn = encode(sheet);
  const written = await writeSheet(
    overworldDestination(options.name),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  await writeFile(creditsFile, credited);

  return {
    written: [...written.map((file) => file.path), CREDITS_PATH],
    width: data.width,
    height: data.height,
    grid: data.grid,
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
  };
}
