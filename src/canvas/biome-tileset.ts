import {
  AUTOTILE_COUNT,
  SURROUNDED,
  autotileRow,
  withoutDiagonals,
} from '../data/overworld/autotile';
import type { DrawnRole } from '../data/constants/tileset-rip';
import { DRAWN_ROLES } from '../data/constants/tileset-rip';
import type { TerrainRole } from '../data/overworld/terrain';
import { asNumber, asNumberArray, asRecord, asRecordArray, asString } from '../auth/__normalize';

/**
 * A biome's ground, as the board draws it.
 *
 * The file under `sprites/biome/{biome}` holds every terrain the rip
 * had: several kinds of wall, two grounds, water and its sparkle. A
 * board wants three of them, so each is cut out on its own at load.
 * Everything after that is arithmetic: a row for the neighbourhood and
 * a column for which drawing of it.
 *
 * Animation in these games is a palette moving under still pixels. The
 * file carries the palettes as data and each terrain is built once per
 * frame of **its own**, so drawing is picking a canvas rather than
 * recolouring anything. One clock for the board would be wrong: the
 * rips run the water at a different rate from the ground and say so in
 * a caption, so each terrain keeps the beat its palette was given.
 * Where the browser will not let a canvas be read back, a terrain
 * stays on its first frame and simply does not move.
 */

export type { DrawnRole } from '../data/constants/tileset-rip';
export { DRAWN_ROLES } from '../data/constants/tileset-rip';

export interface TerrainBlock {
  name: string;
  role: TerrainRole;
  /** Which tile column of the file this terrain's block starts at. */
  column: number;
  /** Which palette it cycles, or -1 where it never changes. */
  palette: number;
  /** Cases the artist left empty, by their row. */
  missing: number[];
}

export interface TilesetPalette {
  frames: (string | null)[][];
  speed: number;
}

export interface TilesetData {
  biome: number;
  /**
   * Which terrain fills each role the board draws, by name.
   *
   * Decided when the sheet was packed rather than here: a rip carries
   * more grounds than a board uses, and two biomes packed from the
   * same rip differ in exactly this
   */
  draws: Partial<Record<DrawnRole, string>>;
  tile: number;
  width: number;
  height: number;
  variants: number;
  cases: number[];
  terrains: TerrainBlock[];
  palettes: TilesetPalette[];
}

const ROLES: TerrainRole[] = ['wall', 'ground', 'water', 'other'];

function roleOf(value: unknown): TerrainRole {
  return ROLES.find((role) => role === value) ?? 'other';
}

/** One frame of a palette, as the hex strings the file carries. */
function asFrame(value: unknown): (string | null)[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : null))
    : [];
}

/**
 * A fetched `data.json`, read into the shape this class expects.
 *
 * The files are assets rather than input, but they are still JSON
 * arriving over the wire: a tileset with a missing field should draw
 * nothing rather than throw inside a draw call
 */
export function asTilesetData(value: unknown): TilesetData {
  const root = asRecord(value);
  const draws = asRecord(root.draws);
  /** A name, or nothing where the field is missing or empty. */
  const named = (field: unknown): string | undefined => asString(field) || undefined;

  return {
    biome: asNumber(root.biome, -1),
    draws: { wall: named(draws.wall), ground: named(draws.ground), water: named(draws.water) },
    tile: Math.max(1, asNumber(root.tile, 24)),
    width: asNumber(root.width),
    height: asNumber(root.height),
    variants: Math.max(1, asNumber(root.variants, 1)),
    cases: asNumberArray(root.cases),
    terrains: asRecordArray(root.terrains).map((block) => ({
      name: asString(block.name),
      role: roleOf(block.role),
      column: asNumber(block.column),
      palette: asNumber(block.palette, -1),
      missing: asNumberArray(block.missing),
    })),
    palettes: asRecordArray(root.palettes).map((palette) => ({
      frames: Array.isArray(palette.frames) ? palette.frames.map(asFrame) : [],
      speed: Math.max(1, asNumber(palette.speed, 8)),
    })),
  };
}

/** Where a biome's tileset is served from. */
export function biomeTilesetPath(biome: number): string {
  return `/sprites/biome/${Math.trunc(biome)}`;
}

/** `#rrggbb` as the number a pixel's three channels make. */
function rgbOf(hex: string | null): number | null {
  if (hex == null || !/^#[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }
  return Number.parseInt(hex.slice(1), 16);
}

/**
 * Which drawing of a tile a cell gets.
 *
 * Taken from where the cell is rather than rolled, so the ground does
 * not shuffle itself every time the board is painted. The mix is a
 * cheap integer hash: two odd multipliers and a shift, which is enough
 * to keep the variations from lining up into stripes
 */
export function variantAt(x: number, y: number, variants: number): number {
  if (variants <= 1) {
    return 0;
  }
  let mixed = (Math.trunc(x) * 73_856_093) ^ (Math.trunc(y) * 19_349_663);

  mixed = (mixed ^ (mixed >>> 13)) >>> 0;
  return mixed % variants;
}

/** One terrain the board draws, and everything needed to draw it. */
interface Drawn {
  /**
   * The role it was picked for, which is not always its own: a biome
   * may name a column the reader filed as something else
   */
  role: DrawnRole;
  block: TerrainBlock;
  /** The rows it has nothing for, ready to be asked. */
  gaps: Set<number>;
  /** How many frames its palette carries, or one where it has none. */
  count: number;
  /** How many game frames one of those is held for, at sixty a second. */
  speed: number;
  /** The block cut out, then a copy per frame. Empty until loaded. */
  frames: HTMLCanvasElement[];
}

/** A tile, ready to be drawn: which sheet, and where on it. */
export interface TileSpot {
  sheet: CanvasImageSource;
  x: number;
  y: number;
}

/**
 * The terrain that fills a role.
 *
 * A biome may name one, and the name wins: a rip's `abyss` column is
 * filed as neither ground nor wall, and a biome that wants it as its
 * ground should have it. A name nothing answers to falls back to the
 * first terrain of the role, so a table that has drifted from the
 * files draws the ordinary thing rather than nothing at all
 */
function pickTerrain(
  data: TilesetData,
  role: DrawnRole,
  wanted: string | undefined,
): TerrainBlock | undefined {
  const named = wanted == null ? undefined : data.terrains.find((one) => one.name === wanted);

  return named ?? data.terrains.find((one) => one.role === role);
}

export default class BiomeTileset {
  /** How big one tile is, in the file's own pixels. */
  readonly tile: number;

  /** One terrain per role, in the order the board asks for them. */
  private readonly drawn: Drawn[];

  private readonly source: string;

  private sheet: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  constructor(
    source: string,
    readonly data: TilesetData,
    /**
     * Which terrain fills each role. The file says so itself, having
     * been packed for this biome; a caller may say otherwise, which
     * is how a test asks for a tiling nobody packed
     */
    picks: Partial<Record<DrawnRole, string>> = {},
  ) {
    this.source = source;
    this.tile = data.tile;
    this.drawn = [];
    for (const role of DRAWN_ROLES) {
      const block = pickTerrain(data, role, picks[role] ?? data.draws[role]);

      if (block == null) {
        continue;
      }
      const palette = this.paletteOf(block);

      this.drawn.push({
        role,
        block,
        gaps: new Set(block.missing),
        count: Math.max(1, palette?.frames.length ?? 1),
        speed: palette?.speed ?? 8,
        frames: [],
      });
    }
  }

  /**
   * The sheet and its description, fetched together. Which terrains
   * it draws with came with the file, having been decided when it was
   * packed for this biome
   */
  static async fetch(biome: number): Promise<BiomeTileset> {
    const basePath = biomeTilesetPath(biome);
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No tileset for biome ${biome}`);
    }
    return new BiomeTileset(`${basePath}/image.png`, asTilesetData(await response.json()));
  }

  /**
   * The palette a terrain cycles, or nothing where it names none.
   * Routed through here rather than indexed at each call so that a
   * terrain pointing past the end of the list reads as absent rather
   * than as a palette that is not there
   */
  private paletteOf(block: TerrainBlock): TilesetPalette | null {
    return this.data.palettes[block.palette] ?? null;
  }

  /** The terrain a role is drawn from, or nothing where there is none. */
  private terrainFor(role: TerrainRole): Drawn | null {
    return this.drawn.find((one) => one.role === role) ?? null;
  }

  /** What a role is actually being drawn with, for a page to report. */
  drawnAs(role: TerrainRole): string | null {
    return this.terrainFor(role)?.block.name ?? null;
  }

  /** Whether the file had anything to draw this role with. */
  has(role: TerrainRole): boolean {
    return this.terrainFor(role) != null;
  }

  /**
   * How many frames a terrain cycles through, and how long it holds
   * one. A terrain whose palette is missing holds a single frame
   * forever, which is what a still tileset is
   */
  framesFor(role: TerrainRole): number {
    return this.terrainFor(role)?.count ?? 1;
  }

  speedFor(role: TerrainRole): number {
    return this.terrainFor(role)?.speed ?? 8;
  }

  /**
   * Which frame of its own cycle a terrain is showing at this moment.
   * Its own, because the rips run the water faster than the ground and
   * a board that averaged the two would be wrong about both
   */
  frameOf(role: TerrainRole, now: number): number {
    const terrain = this.terrainFor(role);

    if (terrain == null) {
      return 0;
    }
    return Math.floor(now / ((terrain.speed * 1000) / 60)) % terrain.count;
  }

  /**
   * Where a tile sits on its terrain's own sheet, or nothing where
   * this role was never drawn.
   *
   * The neighbourhood the artist skipped falls back to the same shape
   * without its corners, and then to the tile with no edges at all,
   * which is the one every rip has: a hole in the ground reads far
   * worse than a corner that is not quite right
   */
  spot(role: TerrainRole, mask: number, variant: number): { x: number; y: number } | null {
    const terrain = this.terrainFor(role);

    if (terrain == null) {
      return null;
    }
    const wanted = [mask, withoutDiagonals(mask), SURROUNDED].map((one) => autotileRow(one));
    const row = wanted.find((one) => !terrain.gaps.has(one)) ?? wanted[0];
    const variants = this.data.variants;

    return {
      x: (((variant % variants) + variants) % variants) * this.tile,
      y: row * this.tile,
    };
  }

  /**
   * The tile to draw for a cell right now: which canvas, and where on
   * it. Nothing before the sheet has loaded, or for a role the rip
   * never drew
   */
  tileAt(role: TerrainRole, mask: number, variant: number, now: number): TileSpot | null {
    const terrain = this.terrainFor(role);
    const spot = this.spot(role, mask, variant);

    if (terrain == null || spot == null || terrain.frames.length === 0) {
      return null;
    }
    // Wrapped by what was actually built rather than by what the
    // palette promised: a browser that refused the pixel read leaves
    // one frame here, and that one is the answer to every moment
    const frame = this.frameOf(role, now) % terrain.frames.length;

    return { sheet: terrain.frames[frame], x: spot.x, y: spot.y };
  }

  /**
   * The drawing, and the terrains built out of it. Kept, so a chunk
   * drawn again waits on the first load rather than starting another
   */
  async load(): Promise<this> {
    if (this.loading != null) {
      return this.loading;
    }
    this.loading = new Promise<this>((resolve, reject) => {
      const image = new Image();

      image.addEventListener('load', () => {
        this.sheet = image;
        for (const terrain of this.drawn) {
          this.build(terrain);
        }
        resolve(this);
      });
      image.addEventListener('error', () => {
        reject(new Error(`Could not load tileset ${this.source}`));
      });
      image.src = this.source;
    });
    return this.loading;
  }

  /** A canvas the size of one terrain's block. */
  private blank(): HTMLCanvasElement | null {
    const canvas = document.createElement('canvas');

    canvas.width = this.data.variants * this.tile;
    canvas.height = AUTOTILE_COUNT * this.tile;
    return canvas.width > 0 && canvas.height > 0 ? canvas : null;
  }

  /**
   * One terrain cut out of the file, then a copy of it per frame of
   * its palette.
   *
   * Reading the pixels back is what the recolouring needs and what a
   * browser with its fingerprinting guards up refuses. Refused, the
   * terrain keeps the one frame it was cut at, so the ground is still
   * drawn and simply does not move
   */
  private build(terrain: Drawn): void {
    const sheet = this.sheet;
    const first = this.blank();
    const context = first?.getContext('2d');

    if (sheet == null || first == null || context == null) {
      return;
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(
      sheet,
      terrain.block.column * this.tile,
      0,
      first.width,
      first.height,
      0,
      0,
      first.width,
      first.height,
    );
    terrain.frames = [first, ...this.cycled(first, terrain)];
  }

  /** One recoloured copy of a terrain per palette frame after the first. */
  private cycled(first: HTMLCanvasElement, terrain: Drawn): HTMLCanvasElement[] {
    const context = first.getContext('2d');

    if (context == null || terrain.count < 2) {
      return [];
    }

    let pixels: ImageData;

    try {
      pixels = context.getImageData(0, 0, first.width, first.height);
    } catch {
      // A browser guarding against fingerprinting refuses the read
      return [];
    }

    const copies: HTMLCanvasElement[] = [];

    for (let frame = 1; frame < terrain.count; frame += 1) {
      const canvas = this.blank();
      const target = canvas?.getContext('2d');

      if (canvas == null || target == null) {
        break;
      }
      const changed = new ImageData(new Uint8ClampedArray(pixels.data), first.width, first.height);

      recolour(changed, this.swapsFor(terrain.block, frame));
      target.putImageData(changed, 0, 0);
      copies.push(canvas);
    }
    return copies;
  }

  /** What each of a terrain's colours becomes on this palette frame. */
  private swapsFor(block: TerrainBlock, frame: number): Map<number, number> {
    const palette = this.paletteOf(block);

    if (palette == null || palette.frames.length < 2) {
      return new Map();
    }
    return swapsBetween(palette.frames[0], palette.frames[frame % palette.frames.length]);
  }
}

/**
 * What one palette frame does to the colours of the first.
 *
 * A colour is all the atlas keeps of which slot a pixel came from, so
 * two slots that start alike and part company later leave that colour
 * meaning two things. Those are dropped rather than guessed at: a
 * shade that does not move is a shade nobody notices, where a shade
 * moving to the wrong colour is a stripe across the ground
 */
export function swapsBetween(
  first: (string | null)[],
  held: (string | null)[],
): Map<number, number> {
  const swaps = new Map<number, number>();
  const stuck = new Set<number>();

  for (let slot = 0; slot < first.length; slot += 1) {
    const was = rgbOf(first[slot]);

    if (was == null) {
      continue;
    }
    // A slot that goes transparent keeps its colour rather than
    // vanishing: the atlas has no slot to put back
    const now = rgbOf(held[slot]) ?? was;
    const already = swaps.get(was);

    if (already != null && already !== now) {
      stuck.add(was);
      continue;
    }
    swaps.set(was, now);
  }
  for (const colour of stuck) {
    swaps.delete(colour);
  }
  // Nothing to do for a colour that stays as it was
  for (const [was, now] of swaps) {
    if (was === now) {
      swaps.delete(was);
    }
  }
  return swaps;
}

/** One terrain's pixels put through its colour swaps. */
function recolour(pixels: ImageData, swaps: Map<number, number>): void {
  const data = pixels.data;

  if (swaps.size === 0) {
    return;
  }
  for (let y = 0; y < pixels.height; y += 1) {
    const row = y * pixels.width;

    for (let x = 0; x < pixels.width; x += 1) {
      const at = (row + x) * 4;

      if (data[at + 3] === 0) {
        continue;
      }
      const now = swaps.get((data[at] << 16) | (data[at + 1] << 8) | data[at + 2]);

      if (now == null) {
        continue;
      }
      data[at] = (now >>> 16) & 255;
      data[at + 1] = (now >>> 8) & 255;
      data[at + 2] = now & 255;
    }
  }
}
