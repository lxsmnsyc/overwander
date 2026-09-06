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

/**
 * What the Catching Charm is worth: half again on every throw. It is
 * deliberately nothing like the Shiny Charm's eightfold — a shiny is a
 * roll a player cannot influence, while a catch is already theirs to
 * work at with the right ball and a berry, and a charm that made the
 * throw a formality would take the safari with it
 */
export const CATCHING_CHARM_BOOST = 1.5;

/**
 * Catching Charm: held, not used. Every ball its owner throws sits a
 * little truer, whatever it is thrown at and whatever it is thrown
 * with
 */
const setupCatchingCharm = createHeldItem(Items.CatchingCharm, (overworld) => {
  overworld.on(OverworldEvents.CheckCatchChance, EventPriority.Exact, (event) => {
    event.boost *= CATCHING_CHARM_BOOST;
  });
});

const HELD_ITEMS: ((overworld: Overworld) => void)[] = [setupShinyCharm, setupCatchingCharm];

/**
 * Register every field item effect; each drops out on its own when
 * the buddy is not holding it
 */
export default function setupOverworldItems(overworld: Overworld): void {
  for (const setup of HELD_ITEMS) {
    setup(overworld);
  }
}
