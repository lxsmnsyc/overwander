import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import refloor from '../src/server/sprites/refloor.ts';

/**
 * Every borrowed wall laid down again.
 *
 * Which biome lent which is already on disk: a grafted wall carries a
 * `borrowed` in its terrain block. Nothing here is a decision, so a
 * change to how a wall meets the ground is a run of this rather than a
 * dozen trips through the sprite processor.
 */

const ROOT = 'public/sprites/biome';

/**
 * How much of a wall column may come out as floor before the lender is
 * taken to be drawing pits rather than outcrops
 */
const MOSTLY_FLOOR = 0.5;

type Described = Record<string, unknown>;

function isRecord(value: unknown): value is Described {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A number the description must carry, since the graft is arithmetic. */
function numberAt(record: Described, key: string): number {
  const found = record[key];

  if (typeof found !== 'number') {
    throw new Error(`A tileset description has no ${key}`);
  }
  return found;
}

interface Sheet {
  /** The parsed description, kept whole so it can be written back. */
  described: Described;
  terrains: Described[];
  image: Image;
}

function read(biome: number): Sheet {
  const parsed: unknown = JSON.parse(readFileSync(join(ROOT, String(biome), 'data.json'), 'utf8'));

  if (!isRecord(parsed) || !Array.isArray(parsed.terrains)) {
    throw new Error(`Biome ${biome} has no tileset description`);
  }
  return {
    described: parsed,
    terrains: parsed.terrains.filter(isRecord),
    image: decode(readFileSync(join(ROOT, String(biome), 'image.png'))),
  };
}

/** The wall a sheet draws with: the one it names, else its first. */
function wallOf(sheet: Sheet): Described | undefined {
  const named = isRecord(sheet.described.draws) ? sheet.described.draws.wall : undefined;
  const walls = sheet.terrains.filter((one) => one.role === 'wall');

  return walls.find((one) => one.name === named) ?? walls.at(0);
}

const biomes = readdirSync(ROOT)
  .map(Number)
  .filter((one) => Number.isInteger(one))
  .sort((one, other) => one - other);

for (const biome of biomes) {
  const target = read(biome);
  const takes = wallOf(target);
  const stands = target.terrains.find((one) => one.role === 'ground');
  const lender = takes?.borrowed;

  if (takes == null || stands == null || typeof lender !== 'number') {
    continue;
  }
  const donor = read(lender);
  const lends = wallOf(donor);
  const soil = donor.terrains.find((one) => one.role === 'ground');

  if (lends == null || soil == null) {
    throw new Error(`Biome ${lender} has no wall to lend biome ${biome}`);
  }
  const tile = numberAt(donor.described, 'tile');
  const variants = numberAt(donor.described, 'variants');
  const cases = Array.isArray(donor.described.cases) ? donor.described.cases.map(Number) : [];
  const repainted = refloor({
    donor: donor.image,
    lends: numberAt(lends, 'column'),
    soil: numberAt(soil, 'column'),
    target: target.image,
    takes: numberAt(takes, 'column'),
    stands: numberAt(stands, 'column'),
    tile,
    variants,
    cases,
  });
  const covered = cases.length * variants * tile * tile;

  // A rip whose wall is a pit rather than an outcrop is mostly floor,
  // and grafting it repaints the rim instead of the ground
  if (repainted > covered * MOSTLY_FLOOR) {
    throw new Error(
      `Biome ${lender}'s wall reads as ${Math.round((repainted / covered) * 100)}% floor, so it cannot be lent`,
    );
  }

  takes.palette = -1;
  takes.missing = Array.isArray(lends.missing) ? lends.missing.map(Number) : [];
  writeFileSync(join(ROOT, String(biome), 'image.png'), encodeSmallest(target.image).bytes);
  writeFileSync(
    join(ROOT, String(biome), 'data.json'),
    `${JSON.stringify(target.described, null, 2)}\n`,
  );
  console.log(`${biome} <- ${lender}: ${repainted} pixels of floor repainted`);
}
