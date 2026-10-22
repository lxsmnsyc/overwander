import * as v from 'valibot';
import type { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import type { Items } from '../ids/items';
import { FORMS_PER_SPECIES, speciesDexNumber, speciesFormIndex } from '../ids/forms';
import { ABILITY_IDS, ITEM_IDS, REGION_IDS, SPECIES_IDS, TYPE_IDS } from '../ids/names';
import { Species } from '../ids/species';
import { idOf, idsOf } from '../yaml';
import zenithHolders from '../text/en/zeniths.yaml';
import { getSpeciesData, registerSpecies } from './__create';
import { readStats } from './yaml';

/**
 * The Zeniths: this engine's own answer to a Mega, for a pokemon that
 * has none. A final stage holding its Zenith Shard fights at its peak,
 * 100 points above its own base stat total, wearing an ability it
 * cannot otherwise reach and sometimes a type it does not have.
 *
 * A pokemon with a Mega, or with a shape some other held item puts it
 * in, has no Zenith: one held transformation per pokemon. Like a Mega,
 * each is worn rather than met, and everything it does not change is
 * read off the pokemon it is a Zenith of, so these register after
 * every generation. Their numbers are `zeniths/<region>.yaml` and who
 * each is for `text/en/zeniths.yaml`. The battle side is
 * `src/battle/gimmicks/zenith.ts`.
 */

export interface ZenithShape {
  zenith: Species;
  base: Species;
  /** Who it is for, written out since items register apart from species */
  holder: string;
  stats: Record<Stats, number>;
  types: Types[];
  /** Worn on top of the catch's own, and never one the line can be born with */
  ability: Abilities;
  /** The shard held to reach it */
  shard: Items;
}

const ZENITH = v.object({
  base: v.string(),
  stats: v.record(v.string(), v.pipe(v.number(), v.minValue(0))),
  types: v.array(v.string()),
  ability: v.string(),
  shard: v.string(),
});

/** Each region's file in region order, and its Zeniths in the order it writes them */
function readZeniths(): ZenithShape[] {
  const files: [region: number, path: string, file: unknown][] = [];

  for (const [path, file] of Object.entries(
    import.meta.glob<unknown>('./zeniths/*.yaml', { eager: true, import: 'default' }),
  )) {
    const name = /([a-z]+)\.yaml$/.exec(path)?.[1] ?? '';

    files.push([idOf(REGION_IDS, name.charAt(0).toUpperCase() + name.slice(1), path), path, file]);
  }
  files.sort(([one], [two]) => one - two);

  const holders = v.parse(v.record(v.string(), v.string()), zenithHolders);
  const shapes: ZenithShape[] = [];

  for (const [, path, file] of files) {
    for (const [key, entry] of Object.entries(v.parse(v.record(v.string(), ZENITH), file))) {
      const where = `${path}: ${key}`;
      if (!Object.hasOwn(holders, key)) {
        throw new Error(`${where} has no holder in text/en/zeniths.yaml`);
      }
      shapes.push({
        zenith: idOf(SPECIES_IDS, key, where),
        base: idOf(SPECIES_IDS, entry.base, where),
        holder: holders[key],
        stats: readStats(entry.stats, where),
        types: idsOf<Types>(TYPE_IDS, entry.types, where),
        ability: idOf(ABILITY_IDS, entry.ability, where),
        shard: idOf(ITEM_IDS, entry.shard, where),
      });
    }
  }
  return shapes;
}

export const ZENITH_SHAPES = readZeniths();

/**
 * The pokemon left without a Zenith although nothing else spoken for
 * them. Ditto's whole kit is becoming something else, and a Zenith
 * set on entry would undo the copy Imposter has just made
 */
export const NO_ZENITH = new Set<Species>([Species.Ditto]);

/** What marks an item id as a Zenith Shard */
export const ZENITH_SHARD_BAND = 2000000;

/**
 * The shard id a Zenith should have: the band, the dex number times
 * 100, and 01 for the species' own Zenith (slot 99), 02 for the next
 * one down, and so on
 */
export function zenithShardId(zenith: Species): number {
  return (
    ZENITH_SHARD_BAND +
    speciesDexNumber(zenith) * FORMS_PER_SPECIES +
    (FORMS_PER_SPECIES - speciesFormIndex(zenith))
  );
}

/** What a Zenith adds to the base stat total of the pokemon it is a Zenith of */
export const ZENITH_BONUS = 100;

const ZENITH_BASES = new Map<Species, Species>();
const ZENITH_OF = new Map<Species, ZenithShape>();

for (const shape of ZENITH_SHAPES) {
  ZENITH_BASES.set(shape.zenith, shape.base);
  ZENITH_OF.set(shape.base, shape);
}

/** Whether this is a Zenith rather than an ordinary pokemon */
export function isZenithSpecies(species: Species): boolean {
  return ZENITH_BASES.has(species);
}

/** The pokemon this Zenith is a Zenith of, or null for everything else */
export function getZenithBase(species: Species): Species | null {
  return ZENITH_BASES.get(species) ?? null;
}

/** The Zenith this pokemon reaches, or null for one that has none */
export function getZenithShape(base: Species): ZenithShape | null {
  return ZENITH_OF.get(base) ?? null;
}

/** Every Zenith there is, in the order the dex meets their pokemon */
export function listZeniths(): Species[] {
  return [...ZENITH_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Zenith of */
export default function registerZenithSpecies(): void {
  for (const shape of ZENITH_SHAPES) {
    const base = getSpeciesData(shape.base);

    registerSpecies(shape.zenith, {
      ...base,
      name: `Zenith ${shape.holder}`,
      baseForm: false,
      worn: true,
      stats: { ...shape.stats },
      types: shape.types,
      abilities: [shape.ability],
      hiddenAbilities: [],
      // Put on in a fight rather than grown into, so it stands in no
      // line and nothing stages it
      evolvesFrom: undefined,
      evolvesInto: undefined,
      eggSpecies: undefined,
      biomes: [],
    });
  }
}
