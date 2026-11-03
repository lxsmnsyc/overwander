import * as v from 'valibot';
import type { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import { ABILITY_IDS, SPECIES_IDS, TYPE_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { type Locale, currentLocale } from '../../i18n/locale';
import { extendRecord, idOf, idsOf, readLocaleText } from '../yaml';
import { getSpeciesData, registerSpecies } from './__create';
import { readStats } from './yaml';

/**
 * The Megas: the shape a pokemon holding its Mega Stone takes in a
 * fight. Each is worn rather than met, so it is never spawned, caught
 * or bred, and the dex fills it in the day its own pokemon is met.
 *
 * Everything a Mega does not change is read off the pokemon it is a
 * Mega of, which is why these are registered after every generation.
 * Their numbers are `megas/gen-N.yaml` and their names
 * `text/en/megas.yaml`. The battle side is `src/battle/gimmicks/mega.ts`.
 */

interface MegaShape {
  /** The name the Mega is written under in its files */
  key: string;
  mega: Species;
  base: Species;
  name: string;
  stats: Record<Stats, number>;
  types: Types[];
  /** The mainline's, worn on top of the catch's own unless a filler stands in */
  ability: Abilities;
  /** Worn instead where the line already reaches the mainline's */
  filler?: Abilities;
  height: number;
  weight: number;
}

const COUNT = v.pipe(v.number(), v.minValue(0));

const MEGA = v.strictObject({
  base: v.string(),
  stats: v.record(v.string(), COUNT),
  types: v.array(v.string()),
  ability: v.string(),
  filler: v.optional(v.string()),
  height: COUNT,
  weight: COUNT,
});

/** What each locale calls each Mega where it writes the name out, by the name the files key it by */
const MEGA_NAMES = readLocaleText(
  import.meta.glob('../text/*/megas.yaml', { eager: true, import: 'default' }),
  'text/<locale>/megas.yaml',
);

/** The templates a locale makes the rest of its Mega names from */
const MEGA_TEMPLATES = readLocaleText(
  import.meta.glob('../text/*/mega-names.yaml', { eager: true, import: 'default' }),
  'text/<locale>/mega-names.yaml',
);

/** The letter a Mega with more than one form is told apart by */
const LETTERED = /Mega([XYZ])$/;

/**
 * A Mega's name in a locale: the one that locale writes, or else its
 * own template filled in with the name the pokemon has there. A locale
 * with neither reads the English name
 */
function nameMega(shape: MegaShape, locale: Locale): string {
  const written = MEGA_NAMES.translated.get(shape.key)?.get(locale);

  if (written != null) {
    return written;
  }

  const name = MEGA_TEMPLATES.translated.get('name')?.get(locale);

  if (name == null) {
    return shape.name;
  }

  const base = name.replace('{base}', getSpeciesData(shape.base).name);
  const letter = LETTERED.exec(shape.key)?.[1];
  const variant = MEGA_TEMPLATES.translated.get('variant')?.get(locale);

  return letter == null || variant == null
    ? base
    : variant.replace('{name}', base).replace('{letter}', letter);
}

/** Each generation's file in turn, and its Megas in the order it writes them */
function readMegas(): MegaShape[] {
  const files = Object.entries(
    import.meta.glob<unknown>('./megas/*.yaml', { eager: true, import: 'default' }),
  );
  const generation = (path: string): number => {
    const found = /gen-(\d+)\.yaml$/.exec(path);

    if (found == null) {
      throw new Error(`${path}: a Megas file is named for its generation, as gen-6.yaml`);
    }
    return Number(found[1]);
  };

  files.sort(([one], [two]) => generation(one) - generation(two));

  const shapes: MegaShape[] = [];

  for (const [path, file] of files) {
    for (const [key, entry] of Object.entries(v.parse(v.record(v.string(), MEGA), file))) {
      const where = `${path}: ${key}`;
      const name = MEGA_NAMES.english.get(key);

      if (name == null) {
        throw new Error(`${where} has no name in text/en/megas.yaml`);
      }
      const shape: MegaShape = {
        key,
        mega: idOf(SPECIES_IDS, key, where),
        base: idOf(SPECIES_IDS, entry.base, where),
        name,
        stats: readStats(entry.stats, where),
        types: idsOf<Types>(TYPE_IDS, entry.types, where),
        ability: idOf(ABILITY_IDS, entry.ability, where),
        height: entry.height,
        weight: entry.weight,
      };

      if (entry.filler != null) {
        shape.filler = idOf(ABILITY_IDS, entry.filler, where);
      }
      shapes.push(shape);
    }
  }
  return shapes;
}

const MEGA_SHAPES = readMegas();

/** Each Mega and the pokemon it is a Mega of */
const MEGA_BASES = new Map<Species, Species>();

for (const shape of MEGA_SHAPES) {
  MEGA_BASES.set(shape.mega, shape.base);
}

/** Whether this is a Mega rather than an ordinary pokemon */
export function isMegaSpecies(species: Species): boolean {
  return MEGA_BASES.has(species);
}

/** The pokemon this Mega is a Mega of, or null for everything else */
export function getMegaBase(species: Species): Species | null {
  return MEGA_BASES.get(species) ?? null;
}

/** Every Mega there is, a generation's file at a time and each file in dex order */
export function listMegas(): Species[] {
  return [...MEGA_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Mega of */
export default function registerMegaSpecies(): void {
  for (const shape of MEGA_SHAPES) {
    const base = getSpeciesData(shape.base);

    const mega = extendRecord(base, {
      name: shape.name,
      baseForm: false,
      worn: true,
      height: shape.height,
      weight: shape.weight,
      stats: { ...shape.stats },
      types: shape.types,
      abilities: [shape.filler ?? shape.ability],
      hiddenAbilities: [],
      // Put on in a fight rather than grown into, so it stands in no
      // line and nothing stages it
      evolvesFrom: undefined,
      evolvesInto: undefined,
      eggSpecies: undefined,
      biomes: [],
      // Nobody meets one in the wild, and it is no rank of its own:
      // a Mega Mewtwo is staged by nothing
      heldItems: undefined,
      eggCycles: undefined,
      rank: undefined,
      awaiting: undefined,
    });

    // Named in the player's locale each time it is read
    Object.defineProperty(mega, 'name', {
      configurable: true,
      enumerable: true,
      get: () => nameMega(shape, currentLocale()),
    });
    registerSpecies(shape.mega, mega);
  }
}
