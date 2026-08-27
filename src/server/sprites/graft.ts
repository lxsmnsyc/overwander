import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { asRecord } from '../../auth/__normalize';
import type { Drawing } from './files';
import { biomeDestination, writeSheet } from './files';
import { decode, encode } from './raster';
import refloor from './refloor';

/**
 * One packed biome's wall, taken from another packed biome.
 *
 * The forest rips draw their walls as trees, which was right when a
 * wall was all a chunk had. It is not right now: the board grows its
 * own trees on the walkable ground, so a forest came out as trees
 * standing in front of a wall of trees. A stone wall from a cave rip
 * puts the trees back on the ground where the world put them.
 *
 * The tiles are copied at pack time rather than borrowed at runtime.
 * A biome's sheet is everything that biome draws, and keeping that
 * true is worth the twenty kilobytes a wall column costs: the board
 * loads one sheet, runs one clock and knows nothing about this.
 *
 * The floor baked around the borrowed wall is repainted in the
 * borrower's own ground by [`refloor`](./refloor.ts), so nothing here
 * reads the column it writes and a sheet can be grafted again.
 */

export interface GraftOptions {
  /** The packed biome the wall is read from. */
  from: number;
  /** The packed biomes whose walls it replaces. */
  biomes: number[];
}

/** What one biome's graft came to. */
export interface Grafted {
  biome: number;
  /** The terrain that was overwritten. */
  was: string;
  drawing: Drawing;
  /** Tiles copied, which is every autotile case of the column. */
  tiles: number;
  /** Pixels of the lender's floor repainted in this biome's ground. */
  ringed: number;
}

export interface GraftResult {
  written: string[];
  /** The wall that was lent, as `biome:terrain`. */
  lent: string;
  grafted: Grafted[];
}

/**
 * Biome ids out of a textarea or a comma-separated line. Anything that
 * is not a number refuses the whole parse rather than quietly grafting
 * a shorter list than was asked for
 */
export function parseBiomes(spec: string): number[] {
  const found: number[] = [];

  for (const said of spec.split(/[\s,]+/)) {
    if (said === '') {
      continue;
    }
    const biome = Number.parseInt(said, 10);

    if (!Number.isInteger(biome) || biome < 0) {
      throw new Error(`Not a biome: "${said}"`);
    }
    found.push(biome);
  }
  return found;
}

interface Block {
  name: string;
  role: string;
  column: number;
  palette: number;
  missing: number[];
}

interface Described {
  biome: number;
  tile: number;
  variants: number;
  width: number;
  height: number;
  /** The neighbourhood each row of the atlas is drawn for. */
  cases: number[];
  terrains: Block[];
  draws?: Record<string, string>;
}

function asBlock(value: unknown): Block {
  const record = asRecord(value);

  return {
    name: typeof record.name === 'string' ? record.name : '',
    role: typeof record.role === 'string' ? record.role : '',
    column: typeof record.column === 'number' ? record.column : 0,
    palette: typeof record.palette === 'number' ? record.palette : -1,
    missing: Array.isArray(record.missing) ? record.missing.map(Number) : [],
  };
}

function asDescribed(value: unknown): Described {
  const record = asRecord(value);
  const number = (found: unknown): number => (typeof found === 'number' ? found : 0);

  return {
    biome: number(record.biome),
    tile: number(record.tile),
    variants: Math.max(1, number(record.variants)),
    width: number(record.width),
    height: number(record.height),
    cases: Array.isArray(record.cases) ? record.cases.map(Number) : [],
    terrains: Array.isArray(record.terrains) ? record.terrains.map(asBlock) : [],
    draws:
      typeof record.draws === 'object' && record.draws != null
        ? (Object.fromEntries(
            Object.entries(record.draws).filter(
              (pair): pair is [string, string] => typeof pair[1] === 'string',
            ),
          ) satisfies Record<string, string>)
        : undefined,
  };
}

/**
 * The terrain a sheet actually draws walls with: whichever the pack was
 * told to draw them with, and otherwise the first wall column the rip
 * had
 */
function wallOf(described: Described): Block | null {
  const named = described.draws?.wall;
  const walls = described.terrains.filter((one) => one.role === 'wall');

  if (named != null) {
    return walls.find((one) => one.name === named) ?? null;
  }
  return walls.at(0) ?? null;
}

/**
 * How much of a wall column may come out as floor before the fill is
 * taken to have leaked into the wall itself
 */
const MOSTLY_FLOOR = 0.5;

async function readBiome(
  biome: number,
): Promise<{ described: Described; pixels: Awaited<ReturnType<typeof decode>>; meta: string }> {
  const where = biomeDestination(biome);
  const image = await readFile(join(process.cwd(), 'public', where.image));
  const meta = await readFile(join(process.cwd(), 'public', String(where.meta)), 'utf8');

  return {
    described: asDescribed(JSON.parse(meta)),
    pixels: await decode(new Uint8Array(image)),
    meta,
  };
}

export default async function graftWall(options: GraftOptions): Promise<GraftResult> {
  if (options.biomes.length === 0) {
    throw new Error('Name at least one biome to graft the wall onto');
  }
  if (options.biomes.includes(options.from)) {
    throw new Error('A biome cannot borrow its own wall');
  }

  const donor = await readBiome(options.from);
  const lend = wallOf(donor.described);

  if (lend == null) {
    throw new Error(`Biome ${options.from} has no wall to lend`);
  }
  // A wall that cycles colours keeps them in its own sheet's palettes,
  // and those are not coming with it
  if (lend.palette !== -1) {
    throw new Error(
      `Biome ${options.from}'s wall cycles palette ${lend.palette}, so it cannot be lent`,
    );
  }
  if (lend.missing.length > 0) {
    throw new Error(
      `Biome ${options.from}'s wall is missing ${lend.missing.length} of its autotile cases`,
    );
  }

  const written: string[] = [];
  const grafted: Grafted[] = [];

  for (const biome of options.biomes) {
    grafted.push(await graftOne(donor, lend, biome, written));
  }
  return { written, lent: `${options.from}:${lend.name}`, grafted };
}

type Donor = Awaited<ReturnType<typeof readBiome>>;

async function graftOne(
  donor: Donor,
  lend: Block,
  biome: number,
  written: string[],
): Promise<Grafted> {
  const target = await readBiome(biome);

  if (donor.described.tile !== target.described.tile) {
    throw new Error(
      `The lender is cut at ${donor.described.tile}px and biome ${biome} at ${target.described.tile}px`,
    );
  }
  if (donor.described.variants !== target.described.variants) {
    throw new Error(
      `The lender draws ${donor.described.variants} of each wall and biome ${biome} draws ${target.described.variants}`,
    );
  }

  const take = wallOf(target.described);

  if (take == null) {
    throw new Error(`Biome ${biome} has no wall to replace`);
  }

  const under = target.described.terrains.find((one) => one.role === 'ground');

  if (under == null) {
    throw new Error(`Biome ${biome} has no ground for the wall to stand on`);
  }
  if (donor.described.cases.length === 0) {
    throw new Error(`Biome ${donor.described.biome}'s description does not say which rows it drew`);
  }

  const soil = donor.described.terrains.find((one) => one.role === 'ground');

  if (soil == null) {
    throw new Error(`Biome ${donor.described.biome} has no ground under the wall it lends`);
  }

  const { tile, variants, cases } = donor.described;
  const covered = cases.length * variants * tile * tile;
  const ringed = refloor({
    donor: { width: donor.pixels.width, height: donor.pixels.height, rgba: donor.pixels.data },
    lends: lend.column,
    soil: soil.column,
    target: { width: target.pixels.width, height: target.pixels.height, rgba: target.pixels.data },
    takes: take.column,
    stands: under.column,
    tile,
    variants,
    cases,
  });

  // Past this the fill has walked out of the floor and into the wall,
  // which would repaint the rock in grass
  if (ringed > covered * MOSTLY_FLOOR) {
    throw new Error(
      `The lender's wall reads as ${Math.round((ringed / covered) * 100)}% floor, so it cannot be lent`,
    );
  }

  // The description travels as it was, bar the one terrain that is now
  // somebody else's. It keeps its name and column so anything naming it
  // still finds it, and says where it came from so the swap is not
  // silent
  const data = asRecord(JSON.parse(target.meta));
  const terrains = Array.isArray(data.terrains) ? data.terrains : [];

  for (const entry of terrains) {
    const block = asRecord(entry);

    if (block.name === take.name && block.role === 'wall') {
      block.palette = -1;
      block.missing = [...lend.missing];
      block.borrowed = donor.described.biome;
    }
  }

  const drawn = encode(target.pixels);
  const files = await writeSheet(
    biomeDestination(biome),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  written.push(...files.map((file) => file.path));
  return {
    biome,
    was: take.name,
    ringed,
    drawing: { ...files[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
    tiles: cases.length * variants,
  };
}
