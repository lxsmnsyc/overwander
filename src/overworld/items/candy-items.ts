import { EventPriority } from '../../core/event-emitter';
import type Families from '../../data/ids/families';
import { Items } from '../../data/ids/items';
import type Overworld from '../core';
import type { CheckCatchCandyEvent } from '../events';
import { OverworldEvents } from '../events';
import createHeldItem from './__create';

/**
 * The two items a buddy carries for candy. Both pay on a catch, both
 * pay one candy, and both pay it half the time — what separates them
 * is **whose** family gets it.
 *
 * An Exp. Share pays the buddy's own line, so it is what a player
 * carries while raising one pokemon: everything they catch feeds it.
 * A Lucky Egg pays the line of whatever was just caught, so it is
 * what a player carries while filling out a dex. A catch holds one
 * item at a time, so carrying one is choosing between those.
 *
 * Neither is touched by the species day. The day already pays four
 * times over on the catch itself; a bonus that multiplied with it
 * would turn one good day into a week of ordinary ones
 */

/**
 * How often either pays: half the catches, on the roll stream the
 * catch's own question runs on
 */
export const CANDY_ITEM_CHANCE = 0.5;

/**
 * How much either pays when it does. One candy is a nudge rather
 * than an income — what makes it worth carrying is that every catch
 * is a chance at it
 */
export const CANDY_ITEM_BONUS = 1;

/**
 * Add to what a family is owed, keeping what is already there: a
 * buddy of the caught pokemon's own line collects from both items at
 * once rather than replacing one with the other
 */
function pay(event: CheckCatchCandyEvent, family: Families): void {
  event.bonus.set(family, (event.bonus.get(family) ?? 0) + CANDY_ITEM_BONUS);
}

/**
 * Exp. Share: what the player catches feeds the one walking beside
 * them
 */
const setupExpShare = createHeldItem(Items.ExpShare, (overworld) => {
  overworld.on(OverworldEvents.CheckCatchCandy, EventPriority.Exact, (event) => {
    // It is the buddy holding it, so there is always a buddy; the
    // check is for the type rather than for the case
    if (event.buddy != null && event.random() < CANDY_ITEM_CHANCE) {
      pay(event, event.buddy);
    }
  });
});

/**
 * Lucky Egg: the catch itself is worth a little more
 */
const setupLuckyEgg = createHeldItem(Items.LuckyEgg, (overworld) => {
  overworld.on(OverworldEvents.CheckCatchCandy, EventPriority.Exact, (event) => {
    if (event.random() < CANDY_ITEM_CHANCE) {
      pay(event, event.caught);
    }
  });
});

const CANDY_ITEMS: ((overworld: Overworld) => void)[] = [setupExpShare, setupLuckyEgg];

/**
 * Register both; each drops out on its own when the buddy is not
 * holding it
 */
export default function setupOverworldCandyItems(overworld: Overworld): void {
  for (const setup of CANDY_ITEMS) {
    setup(overworld);
  }
}
