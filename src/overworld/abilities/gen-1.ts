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
 * The lures, which draw two more pokemon into a chunk, and the two
 * abilities that decide what an encounter comes out as
 */
const FIELD_ABILITIES: ((overworld: Overworld) => void)[] = [
  createLureAbility(Abilities.ArenaTrap),
  createLureAbility(Abilities.Illuminate),
  createLureAbility(Abilities.NoGuard),

  setupSynchronize,
  setupCuteCharm,
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
