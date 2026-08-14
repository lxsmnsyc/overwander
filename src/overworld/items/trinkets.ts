import { EventPriority } from '../../core/event-emitter';
import { Items } from '../../data/ids/items';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import createHeldItem from './__create';

/**
 * What a buddy's trinkets change about the world it walks through.
 * Each has an incense that does the same thing for less, which is the
 * mainline's own arrangement.
 */

/**
 * What a raid or a beaten grunt pays a buddy wearing the coin. Half
 * again as much as the Luck Incense, because the incense is bought
 * and the coin has to be found
 */
export const AMULET_COIN_BONUS = 3;

/**
 * How much of a window a Cleanse Tag keeps at arm's length. The
 * mirror of a lure: the window rolls what it rolls, and the player
 * wearing one meets fewer of them
 */
export const CLEANSE_TAG_QUIET = 3;

const setupAmuletCoin = createHeldItem(Items.AmuletCoin, (overworld) => {
  overworld.on(OverworldEvents.CheckGoldReward, EventPriority.Exact, (event) => {
    event.gold *= AMULET_COIN_BONUS;
  });
});

// Never fewer than none
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
