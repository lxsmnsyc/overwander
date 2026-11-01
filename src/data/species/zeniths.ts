import * as v from 'valibot';
import type { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type Abilities from '../ids/abilities';
import type { Items } from '../ids/items';
import {
  FORMS_PER_SPECIES,
  getBaseFormSpecies,
  speciesDexNumber,
  speciesFormIndex,
} from '../ids/forms';
import { ABILITY_IDS, ITEM_IDS, REGION_IDS, SPECIES_IDS, TYPE_IDS } from '../ids/names';
import { Species } from '../ids/species';
import { baseLocale, currentLocale, type Locale } from '../../i18n/locale';
import { deriveLocalized, extendRecord, idOf, idsOf, splitLocales } from '../yaml';
import { getSpeciesData, registerSpecies, type SpeciesData } from './__create';
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
  /** Its other shapes, for a pokemon that changes shape in a fight */
  forms: ZenithForm[];
}

/**
 * Another shape of a Zenith, worn when a Zenith changes shape the way
 * its pokemon does in a fight: Aegislash's blade, a Castform under the
 * sun. It is reached through the Zenith rather than a shard of its own,
 * and fights 100 above the shape it stands in for
 */
export interface ZenithForm {
  zenith: Species;
  /** The shape of the pokemon this stands in for */
  base: Species;
  /** The Zenith it is a shape of */
  of: Species;
  holder: string;
  stats: Record<Stats, number>;
  types: Types[];
  ability: Abilities;
}

const TEXT_FILES = splitLocales(
  import.meta.glob<unknown>('../text/*/zeniths.yaml', { eager: true, import: 'default' }),
);

const TEXT_FILE = v.record(v.string(), v.string());

/** The key of a Zenith's name in `text/<locale>/zeniths.yaml`, beside the holders */
const NAME_KEY = 'name';

/** Where a name says whose Zenith it is */
const HOLDER_MARK = '{holder}';

/** Each locale's name template, English included */
const NAME_TEMPLATES = readNameTemplates();

function readNameTemplates(): Map<Locale, string> {
  const templates = new Map<Locale, string>();

  for (const file of Object.values(TEXT_FILES.english)) {
    templates.set(baseLocale, readNameTemplate(file, 'text/en/zeniths.yaml'));
  }
  for (const [locale, placed] of TEXT_FILES.overlays) {
    for (const [path, file] of Object.entries(placed)) {
      // A locale may leave its template out and read in English
      if (Object.hasOwn(v.parse(TEXT_FILE, file), NAME_KEY)) {
        templates.set(locale, readNameTemplate(file, path));
      }
    }
  }
  return templates;
}

function readNameTemplate(file: unknown, where: string): string {
  const template = v.parse(TEXT_FILE, file)[NAME_KEY];

  if (template == null || !template.includes(HOLDER_MARK)) {
    throw new Error(`${where}: ${NAME_KEY} must hold ${HOLDER_MARK}`);
  }
  return template;
}

function englishName(holder: string): string {
  return (NAME_TEMPLATES.get(baseLocale) ?? '').replace(HOLDER_MARK, holder);
}

/**
 * Names a Zenith in each locale from its template. English says whose
 * it is in the holder the YAML writes; another locale puts the name its
 * own pokemon has in that locale in the template's place
 */
function nameZenith(zenith: SpeciesData, holder: string, own: SpeciesData): void {
  deriveLocalized(zenith, 'name', () => {
    const locale = currentLocale();
    const template = NAME_TEMPLATES.get(locale) ?? NAME_TEMPLATES.get(baseLocale) ?? '';

    return template.replace(HOLDER_MARK, locale === baseLocale ? holder : own.name);
  });
}

const STATS = v.record(v.string(), v.pipe(v.number(), v.minValue(0)));

/** A shape's types and ability fall back to its own types and the Zenith's ability */
const ZENITH_FORM = v.strictObject({
  base: v.string(),
  stats: STATS,
  types: v.optional(v.array(v.string())),
  ability: v.optional(v.string()),
});

const ZENITH = v.strictObject({
  base: v.string(),
  stats: STATS,
  types: v.array(v.string()),
  ability: v.string(),
  shard: v.string(),
  forms: v.optional(v.record(v.string(), ZENITH_FORM)),
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

  const holders: Record<string, string> = {};

  for (const file of Object.values(TEXT_FILES.english)) {
    Object.assign(holders, v.parse(TEXT_FILE, file));
  }
  delete holders[NAME_KEY];
  const shapes: ZenithShape[] = [];

  for (const [, path, file] of files) {
    for (const [key, entry] of Object.entries(v.parse(v.record(v.string(), ZENITH), file))) {
      const where = `${path}: ${key}`;
      if (!Object.hasOwn(holders, key)) {
        throw new Error(`${where} has no holder in text/en/zeniths.yaml`);
      }
      const zenith = idOf<Species>(SPECIES_IDS, key, where);
      const ability = idOf<Abilities>(ABILITY_IDS, entry.ability, where);
      const forms: ZenithForm[] = [];

      for (const [formKey, form] of Object.entries(entry.forms ?? {})) {
        const at = `${where}.forms.${formKey}`;

        forms.push({
          zenith: idOf(SPECIES_IDS, formKey, at),
          base: idOf(SPECIES_IDS, form.base, at),
          of: zenith,
          holder: holders[key],
          stats: readStats(form.stats, at),
          // Read off the shape when the YAML leaves them out, once species have registered
          types: form.types == null ? [] : idsOf<Types>(TYPE_IDS, form.types, at),
          ability: form.ability == null ? ability : idOf(ABILITY_IDS, form.ability, at),
        });
      }
      shapes.push({
        zenith,
        base: idOf(SPECIES_IDS, entry.base, where),
        holder: holders[key],
        stats: readStats(entry.stats, where),
        types: idsOf<Types>(TYPE_IDS, entry.types, where),
        ability,
        shard: idOf(ITEM_IDS, entry.shard, where),
        forms,
      });
    }
  }
  return shapes;
}

export const ZENITH_SHAPES = readZeniths();

/**
 * The pokemon left without a Zenith although nothing else spoken for
 * them. Ditto's whole kit is becoming something else, and a Zenith
 * set on entry would undo the copy Imposter has just made. Unown is
 * twenty-eight letters of one weak pokemon, and a Zenith of one letter
 * would leave the other twenty-seven asking for theirs
 */
export const NO_ZENITH = new Set<Species>([Species.Ditto, Species.Unown]);

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
/** Each Zenith shape and the Zenith it belongs to, the Zenith itself included */
const ZENITH_OWNER = new Map<Species, ZenithShape>();

for (const shape of ZENITH_SHAPES) {
  ZENITH_BASES.set(shape.zenith, shape.base);
  ZENITH_OF.set(shape.base, shape);
  ZENITH_OWNER.set(shape.zenith, shape);
  for (const form of shape.forms) {
    ZENITH_BASES.set(form.zenith, form.base);
    ZENITH_OWNER.set(form.zenith, shape);
  }
}

/**
 * The species a Zenith (or one of its shapes) is worn over, and any
 * other species as it is. A form change asks this, so a Zenith
 * Aegislash still answers to Aegislash
 */
export function naturalSpecies(species: Species): Species {
  return ZENITH_BASES.get(species) ?? species;
}

/**
 * What a Zenith turns into when its pokemon would turn into `into`:
 * the Zenith itself for its own base shape, the Zenith's shape for one
 * it has, and null where it has none, which leaves the change to land
 * as it would on anybody
 */
export function getZenithForm(current: Species, into: Species): Species | null {
  const owner = ZENITH_OWNER.get(current);

  if (owner == null) {
    return null;
  }
  if (into === owner.base) {
    return owner.zenith;
  }
  for (const form of owner.forms) {
    if (form.base === into) {
      return form.zenith;
    }
  }
  return null;
}

/** Every Zenith shape there is, the main ones left out */
export function listZenithForms(): ZenithForm[] {
  const forms: ZenithForm[] = [];

  for (const shape of ZENITH_SHAPES) {
    forms.push(...shape.forms);
  }
  return forms;
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

/** The Zenith a Zenith or any of its shapes belongs to, or null for everything else */
export function getZenithOwner(species: Species): ZenithShape | null {
  return ZENITH_OWNER.get(species) ?? null;
}

/**
 * The shapes a pokemon is put into for good and keeps, the way a
 * Meteorite rearranges a Deoxys: what it evolves into without leaving
 * its own species
 */
export function listKeptShapes(species: Species): Species[] {
  const kept: Species[] = [];

  for (const road of getSpeciesData(species).evolvesInto ?? []) {
    if (getBaseFormSpecies(road.species) === getBaseFormSpecies(species)) {
      kept.push(road.species);
    }
  }
  return kept;
}

/**
 * Whether a pokemon is as far as its line goes. Turning into a kept
 * shape of itself is not growing up, so a Deoxys is its line's last
 * stage although it has somewhere to go
 */
export function isLastStage(species: Species): boolean {
  for (const road of getSpeciesData(species).evolvesInto ?? []) {
    if (getBaseFormSpecies(road.species) !== getBaseFormSpecies(species)) {
      return false;
    }
  }
  return true;
}

/** Every Zenith there is, in the order the dex meets their pokemon */
export function listZeniths(): Species[] {
  return [...ZENITH_BASES.keys()];
}

/** Registered after every generation, since each one is read off the pokemon it is a Zenith of */
export default function registerZenithSpecies(): void {
  for (const shape of ZENITH_SHAPES) {
    const base = getSpeciesData(shape.base);

    // The Zenith is its pokemon with the changes below, named in each locale
    const zenith = extendRecord(base, {
      name: englishName(shape.holder),
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

    nameZenith(zenith, shape.holder, base);
    registerSpecies(shape.zenith, zenith);
    for (const form of shape.forms) {
      const own = getSpeciesData(form.base);
      const shaped = extendRecord(own, {
        name: englishName(form.holder),
        baseForm: false,
        worn: true,
        stats: { ...form.stats },
        types: form.types.length > 0 ? form.types : own.types,
        abilities: [form.ability],
        hiddenAbilities: [],
        evolvesFrom: undefined,
        evolvesInto: undefined,
        eggSpecies: undefined,
        biomes: [],
      });

      // A shape is named for the pokemon, as its Zenith is
      nameZenith(shaped, form.holder, base);
      registerSpecies(form.zenith, shaped);
    }
  }
}
