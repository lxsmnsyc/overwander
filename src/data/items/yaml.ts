import * as v from 'valibot';
import type { Stages, Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import type { ItemTypes, Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import {
  ITEM_FLAG_IDS,
  ITEM_IDS,
  ITEM_TYPE_IDS,
  MOVE_IDS,
  NATURE_IDS,
  SPECIES_IDS,
  STAGE_IDS,
  STATUS_IDS,
  STAT_IDS,
  TYPE_IDS,
} from '../ids/names';
import type Natures from '../ids/natures';
import type { Species } from '../ids/species';
import type { Statuses } from '../ids/status';
import { flagsOf, idOf, idsOf } from '../yaml';
import type { ItemData } from './__create';

/**
 * The items, read out of their YAML.
 *
 * Each family is a file in two folders, keyed by item:
 *
 * - `records/` is what the item is: its type, its picture, its flags,
 *   what it costs, and the one thing it names where it names one (the
 *   type a gem lifts, the Mega a stone opens)
 * - `text/<locale>/items/` holds each name, and the description where
 *   it is written out. A family whose lines follow its own tables (a
 *   gem names its type, a drink the health it gives back) keeps the
 *   sentences under `templates:` and leaves the description out; the
 *   family's code picks a sentence and fills it in
 *
 * What an item does with what it names is code: the family's own file
 * here, and `src/battle/items/` or `src/overworld/items/` for the rest
 */

const NAME = v.string();
const NAMES = v.array(NAME);
const COUNT = v.pipe(v.number(), v.minValue(0));

const RECORD = v.strictObject({
  type: NAME,
  icon: v.string(),
  flags: v.optional(v.array(NAME), []),
  buy: v.optional(COUNT, 0),
  sell: v.optional(COUNT, 0),
  // What the item names, each read by its family's own code
  mega: v.optional(NAME),
  forms: v.optional(NAMES),
  'z-type': v.optional(NAME),
  'z-move': v.optional(NAME),
  holders: v.optional(NAMES),
  move: v.optional(NAME),
  species: v.optional(NAME),
  pairs: v.optional(v.record(NAME, NAME)),
  lifts: v.optional(NAME),
  'move-type': v.optional(NAME),
  tera: v.optional(NAME),
  stat: v.optional(NAME),
  fills: v.optional(NAME),
  nature: v.optional(NAME),
  calls: v.optional(NAME),
  stage: v.optional(NAME),
  restore: v.optional(v.union([v.literal('full'), COUNT])),
  cures: v.optional(v.union([v.literal('all'), NAMES])),
  revives: v.optional(COUNT),
  bitter: v.optional(COUNT),
});

const RECORDS_FILE = v.record(NAME, v.unknown());

/** What a record names, every name turned into its id */
export interface ItemRecord {
  /** The Mega a stone opens */
  mega?: Species;
  /** The Megas a stone opens for the species' other forms */
  forms?: Species[];
  /** The type whose damaging moves a type crystal turns */
  zType?: Types;
  /** The Z-Move a crystal turns a move into */
  zMove?: Moves;
  /** Who may use a signature crystal, every form included */
  holders?: Species[];
  /** The one move a signature crystal turns */
  move?: Moves;
  /** What a whole fossil brings back */
  species?: Species;
  /** What a top half brings back beside each bottom, in order */
  pairs?: [bottom: Items, species: Species][];
  /** The type whose moves a gem, plate, incense or booster lifts */
  lifts?: Types;
  /** The type a Drive or Memory gives Techno Blast or Multi-Attack */
  moveType?: Types;
  /** A Tera Shard's type */
  tera?: Types;
  /** The stat a vitamin, wing or power item works on */
  stat?: Stats;
  /** The stat a Max vitamin or wing fills */
  fills?: Stats;
  /** The nature a mint leaves behind */
  nature?: Natures;
  /** The mythical a raid item calls */
  calls?: Species;
  /** The stage an X item puts back up */
  stage?: Stages;
  /** Health a medicine gives back, or `full` for the whole pool */
  restore?: number | 'full';
  /** What a medicine takes off, or `all` for every status */
  cures?: Statuses[] | 'all';
  /** The share of the pool a revive brings a fainted pokemon back at */
  revives?: number;
  /** How many mouthfuls of herbal bitterness it costs */
  bitter?: number;
}

/** A name looked up in its table, or undefined where the record leaves it out */
function optionalId<T>(
  table: Readonly<Record<string, T>>,
  name: string | undefined,
  where: string,
): T | undefined {
  return name == null ? undefined : idOf(table, name, where);
}

function optionalIds<T>(
  table: Readonly<Record<string, T>>,
  names: string[] | undefined,
  where: string,
): T[] | undefined {
  return names == null ? undefined : idsOf(table, names, where);
}

/** The named fields of one record, every name checked */
function readNamed(read: v.InferOutput<typeof RECORD>, where: string): ItemRecord {
  let pairs: ItemRecord['pairs'];

  if (read.pairs != null) {
    pairs = [];
    for (const [bottom, species] of Object.entries(read.pairs)) {
      pairs.push([
        idOf<Items>(ITEM_IDS, bottom, where),
        idOf<Species>(SPECIES_IDS, species, where),
      ]);
    }
  }
  return {
    mega: optionalId<Species>(SPECIES_IDS, read.mega, where),
    forms: optionalIds<Species>(SPECIES_IDS, read.forms, where),
    zType: optionalId<Types>(TYPE_IDS, read['z-type'], where),
    zMove: optionalId<Moves>(MOVE_IDS, read['z-move'], where),
    holders: optionalIds<Species>(SPECIES_IDS, read.holders, where),
    move: optionalId<Moves>(MOVE_IDS, read.move, where),
    species: optionalId<Species>(SPECIES_IDS, read.species, where),
    pairs,
    lifts: optionalId<Types>(TYPE_IDS, read.lifts, where),
    moveType: optionalId<Types>(TYPE_IDS, read['move-type'], where),
    tera: optionalId<Types>(TYPE_IDS, read.tera, where),
    stat: optionalId<Stats>(STAT_IDS, read.stat, where),
    fills: optionalId<Stats>(STAT_IDS, read.fills, where),
    nature: optionalId<Natures>(NATURE_IDS, read.nature, where),
    calls: optionalId<Species>(SPECIES_IDS, read.calls, where),
    stage: optionalId<Stages>(STAGE_IDS, read.stage, where),
    restore: read.restore,
    cures: read.cures === 'all' ? 'all' : optionalIds<Statuses>(STATUS_IDS, read.cures, where),
    revives: read.revives,
    bitter: read.bitter,
  };
}

/**
 * One family's records, read straight from its file, for the tables
 * its own code builds out of what each item names. In the order the
 * file writes them, which is the order those tables keep
 */
export function readFamilyRecords(family: string, file: unknown): Map<Items, ItemRecord> {
  const records = new Map<Items, ItemRecord>();

  for (const [name, record] of Object.entries(v.parse(RECORDS_FILE, file))) {
    const where = `${family}: ${name}`;

    records.set(idOf<Items>(ITEM_IDS, name, where), readNamed(v.parse(RECORD, record), where));
  }
  return records;
}

/** The items of a family whose record writes `field`, each to what it names */
export function recordField<K extends keyof ItemRecord>(
  family: string,
  file: unknown,
  field: K,
): Map<Items, NonNullable<ItemRecord[K]>> {
  const found = new Map<Items, NonNullable<ItemRecord[K]>>();

  for (const [item, record] of readFamilyRecords(family, file)) {
    const value = record[field];

    if (value != null) {
      found.set(item, value);
    }
  }
  return found;
}

const TEXT = v.strictObject({ name: v.string(), description: v.optional(v.string()) });

/** The key a text file keeps its family's sentences under */
export const TEMPLATES_KEY = 'templates';

const TEXT_FILE = v.record(NAME, v.unknown());

/** A file's family: its name without the folder or the extension */
function familyOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, -'.yaml'.length);
}

/** Every item file, as the build hands them over */
export interface ItemFiles {
  records: Record<string, unknown>;
  text: Record<string, unknown>;
}

/** One item as its files write it */
export interface WrittenItem {
  family: string;
  item: Items;
  /** The description is the empty string where the family's code writes it */
  data: ItemData;
}

/** What one family's text file holds */
export interface FamilyText {
  templates: Map<string, string>;
  items: Map<string, v.InferOutput<typeof TEXT>>;
}

function readText(files: Record<string, unknown>): Map<string, FamilyText> {
  const families = new Map<string, FamilyText>();

  for (const [path, file] of Object.entries(files)) {
    const text: FamilyText = { templates: new Map(), items: new Map() };

    for (const [key, value] of Object.entries(v.parse(TEXT_FILE, file))) {
      if (key === TEMPLATES_KEY) {
        for (const [name, template] of Object.entries(v.parse(v.record(NAME, v.string()), value))) {
          text.templates.set(name, template);
        }
      } else {
        text.items.set(key, v.parse(TEXT, value));
      }
    }
    families.set(familyOf(path), text);
  }
  return families;
}

/**
 * Every item the files describe, family by family in `order` and in
 * the order each file writes them, which is the order a shelf lists
 * them in. The text files' templates come back beside them
 */
export function readItems(
  files: ItemFiles,
  order: readonly string[],
): { items: WrittenItem[]; text: Map<string, FamilyText> } {
  const text = readText(files.text);
  const records = new Map<string, Record<string, unknown>>();

  for (const [path, file] of Object.entries(files.records)) {
    records.set(familyOf(path), v.parse(RECORDS_FILE, file));
  }
  for (const family of records.keys()) {
    if (!order.includes(family)) {
      throw new Error(`records/${family}.yaml is not in the family order`);
    }
  }

  const items: WrittenItem[] = [];
  const seen = new Set<Items>();

  for (const family of order) {
    const written = records.get(family) ?? {};
    const words = text.get(family);

    for (const [name, record] of Object.entries(written)) {
      const where = `${family}: ${name}`;
      const item = idOf<Items>(ITEM_IDS, name, where);
      const said = words?.items.get(name);

      if (said == null) {
        throw new Error(`${where} has no name`);
      }
      if (seen.has(item)) {
        throw new Error(`${where} is written twice`);
      }
      seen.add(item);

      const read = v.parse(RECORD, record);

      // Checked here as well, so a misspelt name fails the load
      readNamed(read, where);

      items.push({
        family,
        item,
        data: {
          name: said.name,
          description: said.description ?? '',
          type: idOf<ItemTypes>(ITEM_TYPE_IDS, read.type, where),
          icon: read.icon,
          flags: flagsOf(ITEM_FLAG_IDS, read.flags, where),
          buy: read.buy,
          sell: read.sell,
        },
      });
    }
    for (const name of words?.items.keys() ?? []) {
      if (!Object.hasOwn(written, name)) {
        throw new Error(`${family}: ${name} has a name but no record`);
      }
    }
  }
  return { items, text };
}
