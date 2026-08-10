import { EventPriority } from '../../core/event-emitter';
import type Abilities from '../../data/ids/abilities';
import type Overworld from '../core';
import { OverworldEvents } from '../events';

/**
 * A field ability registers itself only when the buddy actually has
 * it. The battle engine watches abilities come and go on units; a
 * buddy's set is fixed for the life of an overworld instance, so the
 * check happens once, at registration
 */
export function createBuddyAbility(
  ability: Abilities,
  setup: (overworld: Overworld) => void,
): (overworld: Overworld) => void {
  return (overworld: Overworld): void => {
    if (overworld.hasAbility(ability)) {
      setup(overworld);
    }
  };
}

/**
 * How many extra spawns a lure is worth
 */
export const LURE_SPAWN_BONUS = 2;

/**
 * Arena Trap, Illuminate and No Guard all do one thing out here:
 * more turns up. The window rolls the extras for every chunk, so the
 * lure decides who can see them rather than whether they exist
 */
export function createLureAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckSpawnCount, EventPriority.Exact, (event) => {
      event.count = event.base + LURE_SPAWN_BONUS;
    });
  });
}
