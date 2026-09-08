import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import { floorOf, paletteOf } from '../src/server/sprites/refloor.ts';

/**
 * The paths, laid one to a country.
 *
 * A town's streets used to be a wash of flat colour over whatever the
 * ground was, because no rip carries a path. This makes one: a
 * **beaten track**, drawn as a terrain of its own so a street tiles
 * and turns corners the way water does against a shore.
 *
 * Three sheets go into every tile. The **shape** is one biome's water
 * column, whose 47 neighbourhoods are already drawn as an organic
 * blob with a rim: the water's own outline is the path's. The
 * **surface** is another biome's ground, borrowed because a path is
 * bare earth and no country has earth of its own. The **rim** is the
 * biome's own ground, darkened, so the track reads as worn into that
 * country rather than laid on top of it. Everything else in the tile
 * is left clear, since a path is drawn over the ground rather than
 * instead of it.
 *
 * ```bash
 * pnpm paths
 * ```
 *
 * Run `pnpm compact-sprites` afterwards to record the sheets.
 */

const ROOT = 'public/sprites/biome';

/** What the terrain is called in every sheet that has one. */
const PATH = 'path';

/**
 * The open seas, which get none: a path is walked, and there is
 * nothing to walk on out there. Repeated from `OPEN_SEAS` in
 * [`biome.ts`](../src/data/ids/biome.ts), which cannot be imported
 * into a script: it is a `const enum`, which node refuses
 */
const OPEN_SEAS = new Set([0, 1, 2, 23, 29]);

/**
 * Which biome's water column lends the outline. One for all of them,
 * so every country's streets are the same shape, and this one because
 * its shore is drawn as a clean blob rather than as a reef
 */
const SHAPE = 11;

/**
 * The earth a path is surfaced in, and the one used where a biome's
 * own ground is already that colour. Both are grounds a rip drew: the
 * steppe's beaten dirt, and the mountain's grey grit
 */
const DIRT = 21;
const GRIT = 17;

/**
 * How near a biome's ground may be to the dirt, as a channel distance
 * between the two averaged, before a path stops reading as one on it.
 * Averaged rather than compared pixel for pixel: what decides whether
 * a track shows is the colour of the ground, not its dappling
 */
const TOO_ALIKE = 34;

/** How much of the biome's own ground is left at the path's rim. */
const WORN = 0.72;

type Described = Record<string, unknown>;

function isRecord(value: unknown): value is Described {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberAt(record: Described, key: string): number {
  const found = record[key];

  if (typeof found !== 'number') {
    throw new Error(`A tileset description has no ${key}`);
  }
  return found;
}

interface Sheet {
  described: Described;
  terrains: Described[];
  image: Image;
  tile: number;
  variants: number;
  cases: number[];
  /** The row every terrain draws with no edges at all. */
  plain: number;
}

function read(biome: number): Sheet {
  const parsed: unknown = JSON.parse(readFileSync(join(ROOT, String(biome), 'data.json'), 'utf8'));

  if (!isRecord(parsed) || !Array.isArray(parsed.terrains)) {
    throw new Error(`Biome ${biome} has no tileset description`);
  }
  const cases = Array.isArray(parsed.cases) ? parsed.cases.map(Number) : [];

  return {
    described: parsed,
    terrains: parsed.terrains.filter(isRecord),
    image: decode(readFileSync(join(ROOT, String(biome), 'image.png'))),
    tile: numberAt(parsed, 'tile'),
    variants: numberAt(parsed, 'variants'),
    cases,
    plain: Math.max(0, cases.indexOf(255)),
  };
}

/** The terrain a sheet fills a role with: the one it names, else the first. */
function terrainOf(sheet: Sheet, role: string): Described {
  const draws = isRecord(sheet.described.draws) ? sheet.described.draws : {};
  const named = sheet.terrains.find((one) => one.name === draws[role]);
  const found = named ?? sheet.terrains.find((one) => one.role === role);

  if (found == null) {
    throw new Error(`A tileset has no ${role}`);
  }
  return found;
}

function columnOf(terrain: Described): number {
  return numberAt(terrain, 'column');
}

/** One pixel of a sheet, as the offset into its pixels. */
function spotOf(sheet: Sheet, column: number, row: number, x: number, y: number): number {
  return ((row * sheet.tile + y) * sheet.image.width + column * sheet.tile + x) * 4;
}

/** What one ground averages out to, which is the colour it reads as. */
function averageOf(sheet: Sheet, column: number): [number, number, number] {
  const total = [0, 0, 0];

  for (let y = 0; y < sheet.tile; y += 1) {
    for (let x = 0; x < sheet.tile; x += 1) {
      const at = spotOf(sheet, column, sheet.plain, x, y);

      for (let channel = 0; channel < 3; channel += 1) {
        total[channel] += sheet.image.rgba[at + channel];
      }
    }
  }
  const pixels = sheet.tile * sheet.tile;

  return [total[0] / pixels, total[1] / pixels, total[2] / pixels];
}

/** How far apart two grounds look, as a channel distance. */
function unlike(one: Sheet, oneColumn: number, two: Sheet, twoColumn: number): number {
  const here = averageOf(one, oneColumn);
  const there = averageOf(two, twoColumn);

  return (
    (Math.abs(here[0] - there[0]) + Math.abs(here[1] - there[1]) + Math.abs(here[2] - there[2])) / 3
  );
}

/**
 * The path's own pixels in one case of the lender's water column, as a
 * flag per pixel.
 *
 * Read as the water rather than as the shore: the flood fill finds the
 * ground round the outside, which is what the water is not
 */
function shapeOf(lender: Sheet, water: number, soil: Set<number>, row: number): boolean[] {
  const floor = floorOf(
    lender.image,
    lender.tile,
    water * lender.tile,
    row * lender.tile,
    lender.cases[row],
    soil,
  );

  return floor.map((one) => !one);
}

/** Whether a pixel outside the path touches it, which is where the rim goes. */
function beside(shape: boolean[], tile: number, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const at = (y + dy) * tile + x + dx;

      if (x + dx >= 0 && x + dx < tile && y + dy >= 0 && y + dy < tile && shape[at]) {
        return true;
      }
    }
  }
  return false;
}

/** The sheet with room for one more terrain, and where that room is. */
function widened(sheet: Sheet, name: string): number {
  const held = sheet.terrains.find((one) => one.name === name);

  if (held != null) {
    return columnOf(held);
  }
  const column = Math.round(sheet.image.width / sheet.tile);
  const grown: Image = {
    width: sheet.image.width + sheet.variants * sheet.tile,
    height: sheet.image.height,
    rgba: Buffer.alloc((sheet.image.width + sheet.variants * sheet.tile) * sheet.image.height * 4),
  };

  for (let y = 0; y < sheet.image.height; y += 1) {
    const from = y * sheet.image.width * 4;

    sheet.image.rgba.copy(grown.rgba, y * grown.width * 4, from, from + sheet.image.width * 4);
  }
  sheet.image = grown;
  sheet.described.width = grown.width;
  sheet.terrains.push({ name, role: PATH, column, palette: -1, missing: [] });
  sheet.described.terrains = sheet.terrains;
  return column;
}

const lender = read(SHAPE);
const water = columnOf(terrainOf(lender, 'water'));
const lentSoil = paletteOf(
  lender.image,
  lender.tile,
  columnOf(terrainOf(lender, 'ground')) * lender.tile,
  lender.variants,
);
const shapes = lender.cases.map((_, row) => shapeOf(lender, water, lentSoil, row));
const dirt = read(DIRT);
const grit = read(GRIT);
const dirtColumn = columnOf(terrainOf(dirt, 'ground'));
const gritColumn = columnOf(terrainOf(grit, 'ground'));

/**
 * One country's path, laid over its own ground and written out.
 *
 * The surface is the steppe's dirt unless the country is already that
 * colour, and then it is the mountain's grit: a track has to be told
 * from the ground it crosses before it is anything else
 */
function pave(biome: number): void {
  const sheet = read(biome);
  const ground = columnOf(terrainOf(sheet, 'ground'));
  const alike = unlike(sheet, ground, dirt, dirtColumn) < TOO_ALIKE;
  const earth = alike ? grit : dirt;
  const earthColumn = alike ? gritColumn : dirtColumn;
  const column = widened(sheet, PATH);
  const path = sheet.terrains.find((one) => one.name === PATH);

  if (path == null) {
    throw new Error(`Biome ${biome} has no path terrain to write`);
  }
  let laid = 0;

  for (let row = 0; row < sheet.cases.length; row += 1) {
    const shape = shapes[row] ?? [];

    for (let variant = 0; variant < sheet.variants; variant += 1) {
      for (let y = 0; y < sheet.tile; y += 1) {
        for (let x = 0; x < sheet.tile; x += 1) {
          const onto = spotOf(sheet, column + variant, row, x, y);
          const inside = shape[y * sheet.tile + x];

          if (!inside && !beside(shape, sheet.tile, x, y)) {
            sheet.image.rgba.fill(0, onto, onto + 4);
            continue;
          }
          // Inside is borrowed earth, sampled where it sits in its own
          // tile so a street runs on across the cells it crosses.
          // Outside but touching is the country's own ground worn down
          const from = inside
            ? spotOf(earth, earthColumn, earth.plain, x % earth.tile, y % earth.tile)
            : spotOf(sheet, ground, sheet.plain, x, y);
          const source = inside ? earth.image : sheet.image;
          const shade = inside ? 1 : WORN;

          for (let channel = 0; channel < 3; channel += 1) {
            sheet.image.rgba[onto + channel] = Math.round(source.rgba[from + channel] * shade);
          }
          sheet.image.rgba[onto + 3] = source.rgba[from + 3];
          laid += 1;
        }
      }
    }
  }
  path.borrowed = alike ? GRIT : DIRT;
  path.shaped = SHAPE;
  writeFileSync(join(ROOT, String(biome), 'image.png'), encodeSmallest(sheet.image).bytes);
  writeFileSync(
    join(ROOT, String(biome), 'data.json'),
    `${JSON.stringify(sheet.described, null, 2)}\n`,
  );
  console.log(
    `${biome}: path at column ${column}, ${alike ? 'grit' : 'dirt'} from ${alike ? GRIT : DIRT}, ${laid} pixels laid`,
  );
}

for (const biome of readdirSync(ROOT)
  .map(Number)
  .filter((one) => Number.isInteger(one) && !OPEN_SEAS.has(one))
  .sort((one, two) => one - two)) {
  pave(biome);
}
