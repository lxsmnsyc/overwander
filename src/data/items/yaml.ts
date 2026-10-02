import * as v from 'valibot';
import type { ItemTypes, Items } from '../ids/items';
import { ITEM_FLAG_IDS, ITEM_IDS, ITEM_TYPE_IDS } from '../ids/names';
import { flagsOf, idOf } from '../yaml';
import type { ItemData } from './__create';

/**
 * The items, read out of their YAML.
 *
 * Each family is a file in two folders, keyed by item:
 *
 * - `records/` is what the item is: its type, its picture, its flags
 *   and what it costs
 * - `text/<locale>/items/` holds each name, and the description where
 *   it is written out. A family whose lines follow its own tables (a
 *   gem names its type, a drink the health it gives back) keeps the
 *   sentences under `templates:` and leaves the description out; the
 *   family's code picks a sentence and fills it in
 *
 * What an item does is code: the family's own file here for the
 * tables, and `src/battle/items/` or `src/overworld/items/` for the
 * rest
 */

const NAME = v.string();
const COUNT = v.pipe(v.number(), v.minValue(0));

const RECORD = v.object({
  type: NAME,
  icon: v.string(),
  flags: v.optional(v.array(NAME), []),
  buy: v.optional(COUNT, 0),
  sell: v.optional(COUNT, 0),
});

const TEXT = v.object({ name: v.string(), description: v.optional(v.string()) });

/** The key a text file keeps its family's sentences under */
export const TEMPLATES_KEY = 'templates';

const RECORDS_FILE = v.record(NAME, v.unknown());

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
