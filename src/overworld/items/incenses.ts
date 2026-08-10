import { EventPriority } from '../../core/event-emitter';
import { Items } from '../../data/ids/items';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import createHeldItem from './__create';

/**
 * What a buddy's incense changes about the world it walks through.
 * The rest of them are battle items; these two never see one.
 */

/**
 * What a Luck Incense is worth: everything a raid or a beaten grunt
 * pays, twice over
 */
export const LUCK_INCENSE_BONUS = 2;

/**
 * What a Pure Incense keeps away. It is the mirror of a lure: the
 * window rolls what it rolls, and a player whose buddy is burning one
 * meets fewer of them
 */
export const PURE_INCENSE_QUIET = 2;

/**
 * Luck Incense: the purse comes back doubled
 */
const setupLuckIncense = createHeldItem(Items.LuckIncense, (overworld) => {
  overworld.on(OverworldEvents.CheckGoldReward, EventPriority.Exact, (event) => {
    event.gold *= LUCK_INCENSE_BONUS;
  });
});

/**
 * Pure Incense: fewer pokemon come near. A player who wants to cross
 * a chunk rather than hunt it carries one — and it can never quiet a
 * chunk below nothing
 */
const setupPureIncense = createHeldItem(Items.PureIncense, (overworld) => {
  overworld.on(OverworldEvents.CheckSpawnCount, EventPriority.Exact, (event) => {
    event.count = Math.max(0, event.count - PURE_INCENSE_QUIET);
  });
});

const INCENSES: ((overworld: Overworld) => void)[] = [setupLuckIncense, setupPureIncense];

/**
 * Register every incense effect; each drops out on its own when the
 * buddy is not holding it
 */
export default function setupOverworldIncenses(overworld: Overworld): void {
  for (const setup of INCENSES) {
    setup(overworld);
  }
}
