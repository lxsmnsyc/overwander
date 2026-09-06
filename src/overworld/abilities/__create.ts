import { EventPriority } from '../../core/event-emitter';
import type Abilities from '../../data/ids/abilities';
import type { Types } from '../../data/constants/types';
import { getSpeciesData } from '../../data/species';
import type { Encounter } from '../encounter/shape';
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
export const LURE_SPAWN_BONUS = 3;

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

/**
 * What a buddy that pins things down leaves of the flee roll. Half,
 * the same as a Silver Nanab, so the two stack into a quarter rather
 * than either one settling it: a meeting that can never run is a
 * safari without a throw worth making
 */
export const TRAP_FLEE_FACTOR = 0.5;

/**
 * Arena Trap and Shadow Tag: nothing standing in front of the player
 * gets far, so a failed throw is half as likely to be the last one
 */
export function createTrapAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckFleeChance, EventPriority.Exact, (event) => {
      event.factor *= TRAP_FLEE_FACTOR;
    });
  });
}

/**
 * What a meeting is worth on a throw to a buddy that speaks its own
 * element. Half again, the same as the Catching Charm: it is a
 * pokemon that trusts what is standing beside the player, not one
 * that has stopped being wild
 */
export const KINSHIP_CATCH_BOOST = 1.5;

/**
 * The absorbers: Lightning Rod, Storm Drain and their kind. What they
 * take in from a fight is what they get on with out here, so a meeting
 * of their own element goes in a ball more readily.
 *
 * They lift the throw rather than pinning the meeting down, which is
 * what separates them from Magnet Pull: taking an element in is not
 * the same as holding it in place
 */
export function createKinshipAbility(
  ability: Abilities,
  type: Types,
): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckCatchChance, EventPriority.Exact, (event) => {
      if (isType(event.encounter, type)) {
        event.boost *= KINSHIP_CATCH_BOOST;
      }
    });
  });
}

/**
 * Whether the meeting is of the type the buddy has a hold over
 */
function isType(encounter: Encounter, type: Types): boolean {
  return new Set(getSpeciesData(encounter.species).types).has(type);
}

/**
 * Magnet Pull and its kind: nothing of the type they pull on gets
 * away at all, and everything else walks off as it pleases
 */
export function createPullAbility(ability: Abilities, type: Types): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckFleeChance, EventPriority.Exact, (event) => {
      if (isType(event.encounter, type)) {
        event.factor = 0;
      }
    });
  });
}
