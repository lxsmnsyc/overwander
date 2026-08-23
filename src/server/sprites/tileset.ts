import 'server-only';
import { AUTOTILE_CASES, AUTOTILE_COUNT, autotileRow } from '../../data/overworld/autotile';
import type { DrawnRole } from '../../data/constants/tileset-rip';
import { DRAWN_ROLES } from '../../data/constants/tileset-rip';
import type { TerrainRole } from '../../data/overworld/terrain';
import { roleFromName } from '../../data/overworld/terrain';
import type { Drawing } from './files';
import { biomeDestination, writeSheet } from './files';
import type { Raster } from './raster';
import { blank, blit, decode, encode } from './raster';
import type { Rect, Table } from './rip';
import {
  MAGENTA,
  backgroundOf,
  blocksOf,
  latticeOf,
  legendWidth,
  packed,
  readLegend,
  readPalette,
  readTable,
} from './rip';

/**
 * A dungeon tileset rip turned into something a board can draw from.
 *
 * The rip is arranged for reading: a legend column saying which
 * neighbourhood each row is for, then a column per terrain holding a
 * few variations of it. What comes out is arranged for lookup instead,
 * one fixed block per terrain with a row per autotile case, so drawing
 * a cell is two multiplications rather than a search.
 *
 * The tiles keep the colours of the palette's first frame, and the
 * other frames are written beside them as data. Animation in these
 * games is a palette cycling under still pixels, and shipping it that
 * way keeps the sheet one frame's worth of bytes.
 */

/** What the caller says about a rip the sheet cannot say itself. */
export interface TilesetOptions {
  /** Which biome's folder this lands in. */
  biome: number;
  /** Terrain columns in order, each naming the palette it cycles. */
  terrains: TerrainSpec[];
  /** How many game frames one palette frame is held for, per palette. */
  speeds: number[];
  /**
   * Which terrain fills each role the board draws, by column name.
   * Nothing means the first terrain of that role
   */
  draws: Partial<Record<DrawnRole, string>>;
}

/** One terrain column of the rip, as the caller describes it. */
export interface TerrainSpec {
  name: string;
  /** Which palette block, counted down the sheet, or -1 for none. */
  palette: number;
}

/** One terrain, as the finished description records it. */
export interface TerrainBlock {
  name: string;
  role: TerrainRole;
  /** Which tile column of the atlas this terrain's block starts at. */
  column: number;
  /** Which palette it cycles, or -1 where it never changes. */
  palette: number;
  /** Autotile cases the artist left empty, by their row in the block. */
  missing: number[];
}

/** A palette as the finished description records it. */
export interface TilesetPalette {
  /** Frames down, slots across. `null` is a transparent slot. */
  frames: (string | null)[][];
  /** How many game frames one of them is held for. */
  speed: number;
}

export interface TilesetSheet {
  biome: number;
  /**
   * Which terrain fills each role, by name.
   *
   * A rip carries more grounds than a board uses, so this is where
   * two biomes packed from the same sheet part company: same table,
   * same tiles, different column called the ground
   */
  draws: Partial<Record<DrawnRole, string>>;
  /** How big one tile is, in the rip's own pixels. */
  tile: number;
  width: number;
  height: number;
  /** Variations across, so a terrain block is this many columns wide. */
  variants: number;
  /**
   * The neighbourhood each row of the atlas is drawn for. Every
   * terrain shares them, which is what lets one row be read across
   */
  cases: number[];
  terrains: TerrainBlock[];
  palettes: TilesetPalette[];
}

export interface TilesetResult {
  written: string[];
  sheet: TilesetSheet;
  drawing: Drawing;
  /** What was found in the rip, so a bad reading is visible. */
  read: {
    table: Rect;
    tile: number;
    /** How many tiles wide the legend is, which is a terrain's group. */
    bands: number;
    columns: number;
    rows: number;
    palettes: number;
    /** How many of the 47 neighbourhoods the rip actually drew. */
    cases: number;
    /** Colours that cannot be cycled, so they are left standing still. */
    stuck: number;
    /** What each role is actually drawn with, named or fallen back to. */
    draws: Record<DrawnRole, string | null>;
  };
}

/**
 * Which terrain fills each role, checked against the columns that
 * were actually named.
 *
 * Refused rather than quietly ignored: a name that answers to nothing
 * would draw the ordinary terrain and look like the sheet was packed
 * right, which is the one failure nobody would go looking for
 */
export function resolveDraws(
  terrains: TerrainSpec[],
  wanted: Partial<Record<DrawnRole, string>>,
): Partial<Record<DrawnRole, string>> {
  const draws: Partial<Record<DrawnRole, string>> = {};

  for (const role of DRAWN_ROLES) {
    const name = wanted[role]?.trim();

    if (name == null || name.length === 0) {
      continue;
    }
    if (!terrains.some((terrain) => terrain.name === name)) {
      throw new Error(`No terrain called "${name}" to draw the ${role} with`);
    }
    draws[role] = name;
  }
  return draws;
}

/**
 * How long each palette holds a frame, as it is typed into the form:
 * numbers separated by spaces, one per palette. The sheets print them
 * as a caption, which is nothing a reader can measure
 */
export function parseSpeeds(spec: string): number[] {
  const speeds = spec
    .trim()
    .split(/\s+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((held) => Number.isFinite(held) && held > 0);

  return speeds.length > 0 ? speeds : [8];
}

/**
 * The terrain list as it is typed into the form: names separated by
 * spaces, each with the palette it cycles after a slash
 */
export function parseTerrains(spec: string): TerrainSpec[] {
  const terrains: TerrainSpec[] = [];

  for (const token of spec.trim().split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const [name, palette] = token.split('/');
    const index = Number.parseInt(palette, 10);

    terrains.push({ name, palette: Number.isFinite(index) ? index : -1 });
  }
  if (terrains.length === 0) {
    throw new Error('The rip needs at least one terrain column');
  }
  return terrains;
}

/** Whether the cell holds nothing: all stand-in, or all one colour. */
function isEmptyCell(
  raster: Raster,
  x: number,
  y: number,
  tile: number,
  background: number,
): boolean {
  for (let down = 0; down < tile; down += 1) {
    for (let across = 0; across < tile; across += 1) {
      const colour = packed(raster, x + across, y + down);

      if (colour !== MAGENTA && colour !== background && (colour & 255) !== 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * The stand-in colour turned into nothing at all.
 *
 * These sheets key magenta out rather than carrying an alpha channel,
 * and it is not only whole cells: a shallow ground is drawn as ripples
 * over magenta, so a tile copied as it stands is a tile with a
 * bright pink ground under it
 */
function keyOut(sheet: Raster, left: number, top: number, tile: number): void {
  for (let y = top; y < top + tile; y += 1) {
    for (let x = left; x < left + tile; x += 1) {
      if (packed(sheet, x, y) === MAGENTA) {
        sheet.data[(y * sheet.width + x) * 4 + 3] = 0;
      }
    }
  }
}

/**
 * How many of a palette's colours cannot be cycled.
 *
 * The atlas is stored in the first frame's colours and the colour is
 * what turns a pixel back into a slot, so two slots that start the
 * same colour and part company later are one colour meaning two
 * things. Those pixels are left standing still rather than guessed at,
 * which costs a shade of movement and nothing else. Counted here only
 * so the page can say it happened
 */
function stuckColours(palette: TilesetPalette): number {
  const first = palette.frames[0] ?? [];
  const bySlot = new Map<string, number>();
  const stuck = new Set<string>();

  for (let slot = 0; slot < first.length; slot += 1) {
    const colour = first[slot];

    if (colour == null) {
      continue;
    }
    const other = bySlot.get(colour);

    if (other == null) {
      bySlot.set(colour, slot);
      continue;
    }
    if (palette.frames.some((frame) => frame[slot] !== frame[other])) {
      stuck.add(colour);
    }
  }
  return stuck.size;
}

/** The rip's palette blocks, top to bottom, ignoring anything else. */
function palettesIn(
  raster: Raster,
  blocks: Rect[],
  table: Rect,
  speeds: number[],
): TilesetPalette[] {
  const found: { top: number; palette: TilesetPalette }[] = [];

  for (const block of blocks) {
    // The table is a grid of solid cells too where a terrain is one
    // flat colour, so it is ruled out by identity rather than by shape
    if (block.x === table.x && block.y === table.y) {
      continue;
    }
    const read = readPalette(raster, block);

    if (read == null) {
      continue;
    }
    found.push({ top: read.bounds.y, palette: { frames: read.frames, speed: 8 } });
  }
  return found
    .sort((one, other) => one.top - other.top)
    .map((entry, at) => ({
      ...entry.palette,
      // Short of a speed apiece, the last one given stands for the rest
      speed: speeds[Math.min(at, speeds.length - 1)] ?? 8,
    }));
}

/**
 * The atlas and its description, apart from the file system so a test
 * can hand it pixels and read the blocks back
 */
export function packTileset(
  raster: Raster,
  options: TilesetOptions,
): { sheet: Raster; data: TilesetSheet; read: TilesetResult['read'] } {
  const background = backgroundOf(raster);
  const blocks = blocksOf(raster, background);

  if (blocks.length === 0) {
    throw new Error('The sheet is blank');
  }
  const bounds = blocks[0];
  const table: Table = readTable(raster, bounds);
  const tile = table.tile;
  // The top band is the header of labels. Where it happens to be a
  // tile tall it cannot be told from a row of tiles by measuring, so
  // the format's own promise that there is one is what drops it
  const rowBands = table.rows[0].size === tile ? table.rows.slice(1) : table.rows;
  const rows = latticeOf(rowBands, tile, bounds.y, bounds.y + bounds.height);
  const all = latticeOf(table.columns, tile, bounds.x, bounds.x + bounds.width);
  const bands = legendWidth(raster, all, rows, tile, background);

  if (bands < 1) {
    throw new Error('The sheet has no legend column, so nothing says which tile is which');
  }
  const columns = all.slice(bands);
  const terrains = options.terrains;
  const group = columns.length / terrains.length;

  if (group !== bands) {
    throw new Error(
      `The table holds ${columns.length / bands} terrains of ${bands} tiles, not the ${terrains.length} named`,
    );
  }

  /**
   * Where each terrain's tiles came from, by the row they are drawn
   * for. A list rather than one cell, because a rip may draw the same
   * neighbourhood more than once and mean the two as alternatives
   */
  const cells = terrains.map(() => new Map<number, { x: number; y: number }[]>());
  const drawn = new Set<number>();

  for (const top of rows) {
    for (let band = 0; band < bands; band += 1) {
      const mask = readLegend(raster, { x: all[band], y: top, width: tile, height: tile });

      if (mask == null) {
        continue;
      }
      const target = autotileRow(mask);

      drawn.add(target);
      for (let terrain = 0; terrain < terrains.length; terrain += 1) {
        const left = columns[terrain * bands + band];

        if (isEmptyCell(raster, left, top, tile, background)) {
          continue;
        }
        const found = cells[terrain].get(target) ?? [];

        found.push({ x: left, y: top });
        cells[terrain].set(target, found);
      }
    }
  }

  const variants = Math.max(
    1,
    ...cells.flatMap((terrain) => [...terrain.values()].map((found) => found.length)),
  );
  // Terrains across and cases down, rather than one tall block each.
  // A board draws three of the ten, and laid out this way those three
  // are three slices of a short sheet instead of three windows into a
  // very tall one
  const sheet = blank(terrains.length * variants * tile, AUTOTILE_COUNT * tile);

  for (let terrain = 0; terrain < terrains.length; terrain += 1) {
    for (const [target, found] of cells[terrain]) {
      for (let variant = 0; variant < variants; variant += 1) {
        // A terrain with one drawing of a tile fills all its columns
        // with it, so a caller may pick any of them without checking
        const from = found[variant % found.length];

        const to = { x: (terrain * variants + variant) * tile, y: target * tile };

        blit(sheet, raster, { x: from.x, y: from.y, width: tile, height: tile }, to);
        keyOut(sheet, to.x, to.y, tile);
      }
    }
  }

  const palettes = palettesIn(raster, blocks, bounds, options.speeds);

  const draws = resolveDraws(terrains, options.draws);
  const data: TilesetSheet = {
    biome: options.biome,
    draws,
    tile,
    width: sheet.width,
    height: sheet.height,
    variants,
    cases: AUTOTILE_CASES,
    terrains: terrains.map((terrain, at) => ({
      name: terrain.name,
      role: roleFromName(terrain.name),
      column: at * variants,
      palette: terrain.palette < palettes.length ? terrain.palette : -1,
      missing: AUTOTILE_CASES.map((_, row) => row).filter((row) => !cells[at].has(row)),
    })),
    palettes,
  };

  return {
    sheet,
    data,
    read: {
      table: bounds,
      tile,
      bands,
      columns: columns.length,
      rows: rows.length,
      palettes: palettes.length,
      cases: drawn.size,
      stuck: palettes.reduce((total, palette) => total + stuckColours(palette), 0),
      // What each role ended up with, named or fallen back to, so the
      // page can say what this biome will actually be drawn in
      draws: drawnWith(data, draws),
    },
  };
}

/** What each role is actually drawn with, once the fallbacks are in. */
function drawnWith(
  data: TilesetSheet,
  draws: Partial<Record<DrawnRole, string>>,
): Record<DrawnRole, string | null> {
  const found = { wall: null, ground: null, water: null } as Record<DrawnRole, string | null>;

  for (const role of DRAWN_ROLES) {
    found[role] =
      draws[role] ?? data.terrains.find((terrain) => terrain.role === role)?.name ?? null;
  }
  return found;
}

export default async function processTileset(
  image: Uint8Array,
  options: TilesetOptions,
): Promise<TilesetResult> {
  const { sheet, data, read } = packTileset(await decode(image), options);
  const drawn = encode(sheet);
  const written = await writeSheet(
    biomeDestination(options.biome),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  return {
    written: written.map((file) => file.path),
    sheet: data,
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
    read,
  };
}
