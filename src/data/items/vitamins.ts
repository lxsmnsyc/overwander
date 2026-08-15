import { STAT_NAMES, Stats } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { PP_UP_LIMIT } from '../moves';
import { nameToIcon, registerItem } from './__create';

/**
 * The vitamins: ten points of effort in one stat, and gone.
 *
 * They are the wings' opposite number, and the pair of them is
 * deliberate. A wing is three points found on the ground, so training
 * is something a walk turns up a little of; a vitamin is ten points
 * off a shelf, so it is also something gold can buy. Both grant on top
 * of the level's allowance rather than out of it — see
 * [`useEffortItem`](../../server/training.ts) — which is what makes
 * either worth using on a pokemon that has already spent its own
 * pool.
 *
 * What they are not is a way past the ceiling: `MAX_EFFORT_PER_STAT`
 * holds whatever is poured into a stat, and a vitamin that would spill
 * over it is refused rather than partly drunk.
 */
export const VITAMIN_STATS = new Map<Items, Stats>([
  [Items.HPUp, Stats.HP],
  [Items.Protein, Stats.Attack],
  [Items.Iron, Stats.Defense],
  [Items.Calcium, Stats.SpecialAttack],
  [Items.Zinc, Stats.SpecialDefense],
  [Items.Carbos, Stats.Speed],
]);

/**
 * What one vitamin is worth: ten points, which is two and a half
 * levels' worth of allowance handed over in one bottle
 */
export const VITAMIN_EFFORT = 10;

/**
 * What the market charges. Dear on purpose — it is three wings and a
 * third in one bottle, and the only training in the game that gold
 * alone can buy
 */
export const VITAMIN_PRICE = 5000;

const NAMES: { [key in Items]?: string } = {
  [Items.HPUp]: 'HP Up',
  [Items.Protein]: 'Protein',
  [Items.Iron]: 'Iron',
  [Items.Calcium]: 'Calcium',
  [Items.Zinc]: 'Zinc',
  [Items.Carbos]: 'Carbos',
};

export function isVitamin(item: Items): boolean {
  return VITAMIN_STATS.has(item);
}

/**
 * What the PP items cost. Dearer than a vitamin, because what they
 * change is permanent and no berry takes it back: a stat can be
 * trained back down with a bitter berry, a move's points cannot.
 *
 * What a point is worth belongs to the move rather than to the bottle
 * — see `getMovePP` — and a PP Max is simply the whole allowance
 * bought at once, which is why it is one item rather than three
 */
export const PP_UP_PRICE = 9800;

/**
 * Which items add points to a move, and how many each is worth
 */
export const PP_ITEMS = new Map<Items, number>([
  [Items.PPUp, 1],
  [Items.PPMax, PP_UP_LIMIT],
]);

export function isPPItem(item: Items): boolean {
  return PP_ITEMS.has(item);
}

export default function registerVitamins(): void {
  for (const [item, stat] of VITAMIN_STATS) {
    const name = NAMES[item] ?? 'Vitamin';

    registerItem(item, {
      name,
      description: `Adds ${VITAMIN_EFFORT} ${STAT_NAMES[stat]} effort. Spent on use.`,
      type: ItemTypes.Training,
      // Drawn on the medicine sheet, which is what a vitamin is:
      // something a pokemon swallows for what it does to it
      icon: nameToIcon('medicine', name),
      flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: VITAMIN_PRICE,
      sell: VITAMIN_PRICE / 2,
    });
  }

  // The PP items are stocked beside them and cost more, because what
  // they change is permanent and there is no berry that takes it back
  registerItem(Items.PPUp, {
    name: 'PP Up',
    description: 'Shortens one move’s cooldown by a step, for good. Spent on use.',
    type: ItemTypes.Training,
    icon: 'medicine/pp-up',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: PP_UP_PRICE,
    sell: PP_UP_PRICE / 2,
  });
  registerItem(Items.PPMax, {
    name: 'PP Max',
    description: 'Shortens one move’s cooldown as far as it will go, for good. Spent on use.',
    type: ItemTypes.Training,
    icon: 'medicine/pp-max',
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy: PP_UP_PRICE * PP_UP_LIMIT,
    sell: (PP_UP_PRICE * PP_UP_LIMIT) / 2,
  });
}
