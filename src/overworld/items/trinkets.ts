import { EventPriority } from '../../core/event-emitter';
import { Items } from '../../data/ids/items';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import createHeldItem from './__create';

/**
 * What a buddy's trinkets change about the world it walks through.
 *
 * Both of these have an incense that does the same thing — a Luck
 * Incense pays what the coin pays, a Pure Incense keeps away what the
 * tag keeps away — which is how the mainline has them too. They are
 * the same edge sold twice, and a player carries whichever one they
 * happened to find.
 */

/**
 * What an Amulet Coin is worth: everything a raid or a beaten grunt
 * pays, three times over.
 *
 * The Luck Incense pays double and sits on a shelf for three thousand
 * gold. The coin is dug out of the ground and pays half again as much
 * as that, which is the whole difference between the two: one is what
 * a player buys when they want the edge, the other is what they carry
 * because the ground gave it to them
 */
export const AMULET_COIN_BONUS = 3;

/**
 * How much of a window a Cleanse Tag keeps at arm's length. It is the
 * mirror of a lure: the window rolls what it rolls, and a player whose
 * buddy is wearing one meets fewer of them
 */
export const CLEANSE_TAG_QUIET = 3;

/**
 * Amulet Coin: the purse comes back doubled
 */
const setupAmuletCoin = createHeldItem(Items.AmuletCoin, (overworld) => {
  overworld.on(OverworldEvents.CheckGoldReward, EventPriority.Exact, (event) => {
    event.gold *= AMULET_COIN_BONUS;
  });
});

/**
 * Cleanse Tag: fewer pokemon come near, and never fewer than none
 */
const setupCleanseTag = createHeldItem(Items.CleanseTag, (overworld) => {
  overworld.on(OverworldEvents.CheckSpawnCount, EventPriority.Exact, (event) => {
    event.count = Math.max(0, event.count - CLEANSE_TAG_QUIET);
  });
});

const TRINKETS: ((overworld: Overworld) => void)[] = [setupAmuletCoin, setupCleanseTag];

/**
 * Register every trinket effect; each drops out on its own when the
 * buddy is not carrying it
 */
export default function setupOverworldTrinkets(overworld: Overworld): void {
  for (const setup of TRINKETS) {
    setup(overworld);
  }
}
