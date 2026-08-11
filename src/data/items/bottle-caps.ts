import { MAX_IV, STAT_ORDER, getIV, setIV } from '../constants/stats';
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

/**
 * How many of the six stats each cap polishes. A golden cap covers
 * every stat there is, so it is the count itself rather than a flag —
 * "all of them" is only "as many as exist"
 */
export const BOTTLE_CAPS = new Map<Items, number>([
  [Items.GoldenBottleCap, STAT_ORDER.length],
  [Items.BottleCap, 1],
]);

/**
 * Whether the cap is one of the caps
 */
export function isBottleCap(item: Items): boolean {
  return BOTTLE_CAPS.has(item);
}

/**
 * Whether every stat is already as high as it goes. A cap has nothing
 * to do to a pokemon like this, so both sides refuse the use rather
 * than spending one on nothing
 */
export function isPerfectIVs(ivs: number): boolean {
  return STAT_ORDER.every((stat) => getIV(ivs, stat) >= MAX_IV);
}

/**
 * The values a cap leaves behind: `count` stats picked at random from
 * the ones that are not already perfect and raised to `MAX_IV`.
 *
 * Only imperfect stats are drawn from, so a cap never lands on a stat
 * that was already there and does nothing — the item is spent either
 * way, and a random pick that could waste it would make the ordinary
 * cap worse the closer a pokemon got to perfect.
 *
 * Answers null when there was nothing left to polish
 */
export function polishIVs(ivs: number, count: number, random: () => number): number | null {
  const dull = STAT_ORDER.filter((stat) => getIV(ivs, stat) < MAX_IV);

  if (dull.length === 0) {
    return null;
  }

  let polished = ivs;

  for (let taken = 0; taken < count && dull.length > 0; taken++) {
    const [stat] = dull.splice(Math.floor(random() * dull.length), 1);

    polished = setIV(polished, stat, MAX_IV);
  }
  return polished;
}

export default function registerBottleCaps(): void {
  registerItem(Items.GoldenBottleCap, {
    name: 'Golden Bottle Cap',
    type: ItemTypes.Training,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });

  registerItem(Items.BottleCap, {
    name: 'Bottle Cap',
    type: ItemTypes.Training,
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
