import { MAX_IV, STAT_ORDER, type Stats, getIV, setIV } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The bottle caps: the only thing in the game that changes what a
 * pokemon was born with.
 *
 * Individual values are rolled once, when the encounter is staged, and
 * nothing afterwards touches them — a player who meets a perfect
 * Dragonite has met it, and one who meets a poor one has to meet
 * another. A cap is the exception, which is why it is found rather
 * than bought and why the good one sits in the same band as the Master
 * Ball: a stash that turns a pokemon someone already raised into the
 * one they wanted is worth walking a long way for.
 *
 * A cap is spent on one pokemon and gone. Neither is ever handed to a
 * pokemon to hold: they are used, not carried.
 */

/** The caps there are */
const BOTTLE_CAPS = new Set<Items>([Items.GoldenBottleCap, Items.BottleCap]);

/**
 * Whether the cap is one of the caps
 */
export function isBottleCap(item: Items): boolean {
  return BOTTLE_CAPS.has(item);
}

/**
 * Whether the player picks the stat the cap goes on. A plain cap
 * polishes one of their choosing; a golden one polishes them all, so
 * there is nothing to ask
 */
export function capAsksForStat(item: Items): boolean {
  return item === Items.BottleCap;
}

/** Which stats a cap polishes, given the one the player chose for a plain cap */
export function capStats(item: Items, chosen: Stats | null): readonly Stats[] {
  if (!capAsksForStat(item)) {
    return STAT_ORDER;
  }
  return chosen == null ? [] : [chosen];
}

/**
 * Whether every stat is already as high as it goes. A cap has nothing
 * to do to a pokemon like this, so both sides refuse the use rather
 * than spending one on nothing
 */
export function isPerfectIVs(ivs: number): boolean {
  for (const stat of STAT_ORDER) {
    if (getIV(ivs, stat) < MAX_IV) {
      return false;
    }
  }
  return true;
}

/**
 * The values a cap leaves behind: each of `stats` raised to `MAX_IV`.
 * Null when none of them had anything to raise, so a cap is never
 * spent on a stat that was already perfect
 */
export function polishIVs(ivs: number, stats: readonly Stats[]): number | null {
  let polished = ivs;

  for (const stat of stats) {
    polished = setIV(polished, stat, MAX_IV);
  }
  return polished === ivs ? null : polished;
}

export default function registerBottleCaps(): void {
  registerItem(Items.GoldenBottleCap, {
    name: 'Golden Bottle Cap',
    description: `Raises every one of a pokemon’s values to ${MAX_IV}. Spent on use.`,
    type: ItemTypes.Training,
    icon: 'other/gold-bottle-cap',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });

  registerItem(Items.BottleCap, {
    name: 'Bottle Cap',
    description: `Raises one value of your choice that is not yet ${MAX_IV} to ${MAX_IV}. Spent on use.`,
    type: ItemTypes.Training,
    icon: 'other/bottle-cap',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
