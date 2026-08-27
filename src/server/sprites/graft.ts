import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { asRecord } from '../../auth/__normalize';
import type { Drawing } from './files';
import { biomeDestination, writeSheet } from './files';
import { decode, encode } from './raster';

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
  /** Pixels of the lender's floor repainted in this biome's. */
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

/** Every colour one terrain column draws, and how much of it. */
function coloursOf(
  pixels: Awaited<ReturnType<typeof decode>>,
  described: Described,
  block: Block,
): Map<number, number> {
  const found = new Map<number, number>();
  const left = block.column * described.tile;
  const across = described.variants * described.tile;

  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < across; x += 1) {
      const off = (y * pixels.width + left + x) * 4;

      if (pixels.data[off + 3] === 0) {
        continue;
      }
      const key = (pixels.data[off] << 16) | (pixels.data[off + 1] << 8) | pixels.data[off + 2];

      found.set(key, (found.get(key) ?? 0) + 1);
    }
  }
  return found;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function toHsl(colour: number): Hsl {
  const r = ((colour >> 16) & 0xff) / 255;
  const g = ((colour >> 8) & 0xff) / 255;
  const b = (colour & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const span = max - min;

  if (span === 0) {
    return { h: 0, s: 0, l };
  }
  const s = l > 0.5 ? span / (2 - max - min) : span / (max + min);
  const sixth = ((): number => {
    if (max === r) {
      return (g - b) / span + (g < b ? 6 : 0);
    }
    return max === g ? (b - r) / span + 2 : (r - g) / span + 4;
  })();

  return { h: sixth / 6, s, l };
}

function toRgb({ h, s, l }: Hsl): number {
  if (s === 0) {
    const flat = Math.round(l * 255);

    return (flat << 16) | (flat << 8) | flat;
  }
  const second = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const first = 2 * l - second;
  const channel = (shift: number): number => {
    const at = (h + shift + 1) % 1;

    if (at < 1 / 6) {
      return first + (second - first) * 6 * at;
    }
    if (at < 1 / 2) {
      return second;
    }
    if (at < 2 / 3) {
      return first + (second - first) * (2 / 3 - at) * 6;
    }
    return first;
  };

  return (
    (Math.round(channel(1 / 3) * 255) << 16) |
    (Math.round(channel(0) * 255) << 8) |
    Math.round(channel(-1 / 3) * 255)
  );
}

/**
 * What the lender's floor becomes in the borrower's sheet.
 *
 * A wall's outer ring is drawn over the floor it stands on, so a
 * borrowed wall arrives ringed in the lender's ground and reads as a
 * cut-out laid on the grass.
 *
 * The ring is **tinted** rather than matched colour for colour. A
 * biome's floor is not one hue — a grass tile carries its dirt and its
 * highlights — so pairing the two palettes off by brightness lands the
 * ring on whichever colour happens to sit at that rank, and a green
 * field gets a brown rim. Taking the hue of the floor's commonest
 * colour and keeping each ring pixel's own lightness keeps the shading
 * the artist drew and puts it in this biome's colour
 */
function floorSwaps(
  donorGround: Map<number, number>,
  targetGround: Map<number, number>,
): Map<number, number> {
  const swaps = new Map<number, number>();
  let ground = -1;
  let most = 0;

  for (const [colour, count] of targetGround) {
    if (count > most) {
      most = count;
      ground = colour;
    }
  }
  if (ground < 0 || donorGround.size === 0) {
    return swaps;
  }

  const wanted = toHsl(ground);

  for (const colour of donorGround.keys()) {
    const was = toHsl(colour);

    swaps.set(colour, toRgb({ h: wanted.h, s: Math.max(wanted.s, was.s * 0.5), l: was.l }));
  }
  return swaps;
}

/**
 * How much of a wall may be floor-coloured before it cannot be lent.
 * Past this the ring is not a ring: the wall is drawn in its own floor's
 * palette and recolouring would repaint the whole of it
 */
const MOSTLY_FLOOR = 0.4;

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
  const lentGround = donor.described.terrains.find((one) => one.role === 'ground');
  const swaps =
    under == null || lentGround == null
      ? new Map<number, number>()
      : floorSwaps(
          coloursOf(donor.pixels, donor.described, lentGround),
          coloursOf(target.pixels, target.described, under),
        );

  const { tile, variants } = target.described;
  const across = variants * tile;
  const rows = Math.floor(target.described.height / tile);
  const fromLeft = lend.column * tile;
  const toLeft = take.column * tile;
  let ringed = 0;
  let lit = 0;

  for (let y = 0; y < rows * tile; y += 1) {
    for (let x = 0; x < across; x += 1) {
      const at = (y * donor.pixels.width + fromLeft + x) * 4;
      const to = (y * target.pixels.width + toLeft + x) * 4;
      const alpha = donor.pixels.data[at + 3];
      const key =
        (donor.pixels.data[at] << 16) |
        (donor.pixels.data[at + 1] << 8) |
        donor.pixels.data[at + 2];
      const swapped = alpha === 0 ? undefined : swaps.get(key);

      if (alpha > 0) {
        lit += 1;
      }
      if (swapped == null) {
        target.pixels.data[to] = donor.pixels.data[at];
        target.pixels.data[to + 1] = donor.pixels.data[at + 1];
        target.pixels.data[to + 2] = donor.pixels.data[at + 2];
      } else {
        target.pixels.data[to] = (swapped >> 16) & 0xff;
        target.pixels.data[to + 1] = (swapped >> 8) & 0xff;
        target.pixels.data[to + 2] = swapped & 0xff;
        ringed += 1;
      }
      target.pixels.data[to + 3] = alpha;
    }
  }
  if (lit > 0 && ringed / lit > MOSTLY_FLOOR) {
    throw new Error(
      `The lender's wall is ${Math.round((ringed / lit) * 100)}% floor colour, so recolouring its ring would repaint the wall`,
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
    tiles: rows * variants,
  };
}
