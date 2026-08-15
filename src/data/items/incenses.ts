import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The incenses: held smokes, each one a small edge somewhere.
 *
 * Five of them are type boosters by another name — an Odd Incense
 * does for Psychic exactly what a Twisted Spoon does — and the other
 * four each touch something else entirely: how easily their holder is
 * hit, how late it acts, how much a reward pays, how crowded the
 * world around it is.
 *
 * The battle side lives in
 * [`src/battle/items/incenses.ts`](../../battle/items/incenses.ts) and
 * [`src/battle/items/type-boosters.ts`](../../battle/items/type-boosters.ts);
 * what a buddy's incense changes about the overworld lives in
 * [`src/overworld/items/incenses.ts`](../../overworld/items/incenses.ts).
 */

/**
 * The incenses that lift a type, and the type each lifts. Two of them
 * lift Water: the sea and the waves are the same water
 */
export const INCENSE_TYPES = new Map<Items, Types>([
  [Items.OddIncense, Types.Psychic],
  [Items.RockIncense, Types.Rock],
  [Items.RoseIncense, Types.Grass],
  [Items.SeaIncense, Types.Water],
  [Items.WaveIncense, Types.Water],
]);

/**
 * The incenses that do something other than lift a type
 */
export const FIELD_INCENSES = new Set<Items>([
  Items.FullIncense,
  Items.LaxIncense,
  Items.LuckIncense,
  Items.PureIncense,
]);

/**
 * What each of the four that do not lift a type is for
 */
const FIELD_DESCRIPTIONS: { [key in Items]?: string } = {
  [Items.FullIncense]: 'Its holder winds up a bracket slower than it otherwise would.',
  [Items.LaxIncense]: 'Anything aimed at its holder is 5% likelier to miss.',
  [Items.LuckIncense]: 'Twice the gold from any fight its holder is in.',
  [Items.PureIncense]: 'Three fewer wild spawns around the buddy carrying it.',
};

const NAMES: { [key in Items]?: string } = {
  [Items.FullIncense]: 'Full Incense',
  [Items.LaxIncense]: 'Lax Incense',
  [Items.LuckIncense]: 'Luck Incense',
  [Items.OddIncense]: 'Odd Incense',
  [Items.PureIncense]: 'Pure Incense',
  [Items.RockIncense]: 'Rock Incense',
  [Items.RoseIncense]: 'Rose Incense',
  [Items.SeaIncense]: 'Sea Incense',
  [Items.WaveIncense]: 'Wave Incense',
};

/**
 * An incense costs less than the plain item it stands beside: a Sea
 * Incense and a Mystic Water do the same thing, and the incense is
 * the cheaper way to it
 */
export const INCENSE_PRICE = 3000;

const INCENSE_RESALE = 0.5;

/**
 * Every incense, for callers that only care that it is one
 */
export const INCENSES: Items[] = [...INCENSE_TYPES.keys(), ...FIELD_INCENSES];

/**
 * Register the incenses. All of them are held and none is spent: an
 * incense burns for as long as its holder carries it
 */
function describeIncense(item: Items): string {
  const type = INCENSE_TYPES.get(item);

  return type == null
    ? (FIELD_DESCRIPTIONS[item] ?? '')
    : `${TYPE_NAMES[type]} moves hit 1.2x for as long as it is held.`;
}

export default function registerIncenses(): void {
  for (const item of INCENSES) {
    registerItem(item, {
      name: NAMES[item] ?? `Item #${item}`,
      type: ItemTypes.Held,
      description: describeIncense(item),
      // The `incense` sheet names them by the word in front of the
      // word "Incense": a Sea Incense is `sea`
      icon: `incense/${(NAMES[item] ?? '').split(' ')[0].toLowerCase()}`,
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: INCENSE_PRICE,
      sell: INCENSE_PRICE * INCENSE_RESALE,
    });
  }
}
