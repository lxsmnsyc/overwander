import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { Genders } from '../../data/ids/species';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import { createBuddyAbility, createLureAbility } from './__create';

/**
 * The field abilities: what a pokemon changes about the world by
 * walking beside a player rather than by fighting.
 *
 * Each is written once here and registers itself against the
 * questions it has an opinion about. Nothing that stages a spawn or
 * an encounter names an ability, so adding one is adding a listener
 * and nothing else.
 */

/**
 * How often a Synchronize buddy passes its nature on
 */
export const SYNCHRONIZE_CHANCE = 0.5;

/**
 * Synchronize: half the encounters a player meets share the nature of
 * the pokemon at their side
 */
const setupSynchronize = createBuddyAbility(Abilities.Synchronize, (overworld) => {
  overworld.on(OverworldEvents.CheckEncounterNature, EventPriority.Exact, (event) => {
    const buddy = event.overworld.buddy;

    if (buddy != null && event.random() < SYNCHRONIZE_CHANCE) {
      event.nature = buddy.nature;
    }
  });
});

/**
 * How often a Cute Charm buddy draws out the opposite gender
 */
export const CUTE_CHARM_CHANCE = 2 / 3;

/**
 * Cute Charm: two draws in three, what comes out is the opposite of
 * what the buddy is. A genderless species — on either side — has
 * nothing to charm, so the encounter keeps the gender its ratio
 * rolled
 */
const setupCuteCharm = createBuddyAbility(Abilities.CuteCharm, (overworld) => {
  overworld.on(OverworldEvents.CheckEncounterGender, EventPriority.Exact, (event) => {
    const buddy = event.overworld.buddy;

    if (
      buddy == null ||
      buddy.gender === Genders.Genderless ||
      event.gender === Genders.Genderless
    ) {
      return;
    }
    if (event.random() < CUTE_CHARM_CHANCE) {
      event.gender = buddy.gender === Genders.Male ? Genders.Female : Genders.Male;
    }
  });
});

/**
 * What a Flame Body buddy takes off the walk an egg needs. Half is
 * the mainline's own figure, and it is applied to the requirement
 * rather than to the steps, so it is settled once instead of being
 * asked again every few paces
 */
export const FLAME_BODY_FACTOR = 0.5;

/**
 * Flame Body: an egg picked up beside something warm has less far to
 * go.
 *
 * It reads the buddy at the moment the egg is found, because that is
 * the only moment there is one to read — walking an egg means carrying
 * the egg as the buddy, so nothing is beside the player afterwards.
 * The answer is frozen onto the egg's `hatchSteps`, which is the same
 * field a shadow egg has already doubled
 */
const setupFlameBody = createBuddyAbility(Abilities.FlameBody, (overworld) => {
  overworld.on(OverworldEvents.CheckEggSteps, EventPriority.Exact, (event) => {
    event.steps *= FLAME_BODY_FACTOR;
  });
});

/**
 * How far a Pickup buddy walks between one find and the next
 */
export const PICKUP_STEP_INTERVAL = 512;

/**
 * Pickup: a buddy that keeps its eyes on the ground turns something
 * up every so often.
 *
 * It counts the marks the walk crossed rather than the steps in the
 * report, so a player who reports in small handfuls finds exactly as
 * much as one who reports in large ones — and what is walked past a
 * mark is kept, the way the friendship a walk buys is
 */
const setupPickup = createBuddyAbility(Abilities.Pickup, (overworld) => {
  overworld.on(OverworldEvents.CheckWalkPickup, EventPriority.Exact, (event) => {
    event.found +=
      Math.floor(event.to / PICKUP_STEP_INTERVAL) - Math.floor(event.from / PICKUP_STEP_INTERVAL);
  });
});

/**
 * The lures, which draw two more pokemon into a chunk, the two
 * abilities that decide what an encounter comes out as, and the two
 * that pay a walk rather than a meeting
 */
const FIELD_ABILITIES: ((overworld: Overworld) => void)[] = [
  createLureAbility(Abilities.ArenaTrap),
  createLureAbility(Abilities.Illuminate),
  createLureAbility(Abilities.NoGuard),

  setupSynchronize,
  setupCuteCharm,
  setupFlameBody,
  setupPickup,
];

/**
 * Register every field ability against the overworld; each one drops
 * out on its own when the buddy does not have it
 */
export default function setupOverworldAbilities(overworld: Overworld): void {
  for (const setup of FIELD_ABILITIES) {
    setup(overworld);
  }
}
