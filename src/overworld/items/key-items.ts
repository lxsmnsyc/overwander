import { EventPriority } from '../../core/event-emitter';
import { CAVE_LAMP_CELLS } from '../../data/overworld/cave';
import { Items } from '../../data/ids/items';
import { FLAME_BODY_FACTOR } from '../abilities/gen-1';
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

/**
 * What the Exp Charm pays on a catch: one candy of the caught
 * pokemon's family. It is the Exp. Share's and the Lucky Egg's amount,
 * paid on every catch instead of half of them, because the charm is a
 * rare find and a buddy holds one item at a time, so carrying it
 * means giving up the other two. There is no experience here to
 * multiply, which is what the mainline charm acts on
 */
export const EXP_CHARM_BONUS = 1;

/**
 * Exp Charm: held, not used. Every catch pays one more candy of the
 * family it came from, and none to the buddy's own. The species day
 * does not multiply it, the same as the other two candy items
 */
const setupExpCharm = createHeldItem(Items.ExpCharm, (overworld) => {
  overworld.on(OverworldEvents.CheckCatchCandy, EventPriority.Exact, (event) => {
    event.bonus.set(event.caught, (event.bonus.get(event.caught) ?? 0) + EXP_CHARM_BONUS);
  });
});

/**
 * What the Oval Charm leaves of an egg's steps: the Flame Body's own
 * half. There is no Day Care for the mainline charm to quicken, so it
 * warms an egg picked up beside the buddy, the way Flame Body does
 */
export const OVAL_CHARM_FACTOR = FLAME_BODY_FACTOR;

/**
 * Oval Charm: held, not used. An egg picked up while the buddy
 * carries it needs half the steps, whatever the buddy is.
 *
 * It takes the **smaller** of what the steps already are and half the
 * base, rather than halving again, so a Flame Body buddy carrying it
 * is warmed once and not twice. It runs after the abilities for that
 * reason: whichever of the two ran first, the answer is the same
 */
const setupOvalCharm = createHeldItem(Items.OvalCharm, (overworld) => {
  overworld.on(OverworldEvents.CheckEggSteps, EventPriority.Post, (event) => {
    event.steps = Math.min(event.steps, event.base * OVAL_CHARM_FACTOR);
  });
});

/**
 * Explorer Kit: held, not used. Underground it is what the player
 * sees by.
 *
 * Written as the **greater** of what is already there rather than as
 * an override, so it cannot stack with a buddy that lights the way
 * itself and cannot be undone by one either. Two sources of one
 * effect is a thing this game avoids; where there have to be two,
 * they answer to the same number and the brighter wins
 */
const setupExplorerKit = createHeldItem(Items.ExplorerKit, (overworld) => {
  overworld.on(OverworldEvents.CheckLampReach, EventPriority.Exact, (event) => {
    event.reach = Math.max(event.reach, CAVE_LAMP_CELLS);
  });
});

const HELD_ITEMS: ((overworld: Overworld) => void)[] = [
  setupShinyCharm,
  setupCatchingCharm,
  setupExpCharm,
  setupOvalCharm,
  setupExplorerKit,
];

/**
 * Register every field item effect; each drops out on its own when
 * the buddy is not holding it
 */
export default function setupOverworldItems(overworld: Overworld): void {
  for (const setup of HELD_ITEMS) {
    setup(overworld);
  }
}
