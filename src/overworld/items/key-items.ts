import { EventPriority } from '../../core/event-emitter';
import { Items } from '../../data/ids/items';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import createHeldItem from './__create';

/**
 * What a buddy's held items change about the world around it. They
 * register the same way abilities do, against the same questions —
 * an item that lifts the shiny odds and an ability that lifts them
 * are the same kind of thing out here
 */

/**
 * What the Shiny Charm is worth when the buddy is carrying it: every
 * encounter sparkles eight times as readily
 */
export const SHINY_CHARM_BOOST = 8;

/**
 * Shiny Charm: held, not used. It never leaves the buddy's grip, and
 * every meeting its owner has is the better for it
 */
const setupShinyCharm = createHeldItem(Items.ShinyCharm, (overworld) => {
  overworld.on(OverworldEvents.CheckEncounterShiny, EventPriority.Exact, (event) => {
    event.boost *= SHINY_CHARM_BOOST;
  });
});

const HELD_ITEMS: ((overworld: Overworld) => void)[] = [setupShinyCharm];

/**
 * Register every field item effect; each drops out on its own when
 * the buddy is not holding it
 */
export default function setupOverworldItems(overworld: Overworld): void {
  for (const setup of HELD_ITEMS) {
    setup(overworld);
  }
}
