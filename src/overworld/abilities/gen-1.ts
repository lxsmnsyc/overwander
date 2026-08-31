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
 * How far a player sees in the dark with an Illuminate buddy at their
 * side, in cells. It replaces what they would see alone rather than
 * multiplying it, so the reach is one number wherever it is read
 */
export const ILLUMINATE_LAMP_CELLS = 3;

/**
 * Illuminate, out here, is a lantern as well as a lure: under a sky
 * that has put the lights out, what the player can see of the board
 * around them reaches this much further.
 *
 * It is registered apart from its lure rather than folded into it,
 * because the two are answers to different questions and the lure is
 * shared with two other abilities
 */
const setupIlluminate = createBuddyAbility(Abilities.Illuminate, (overworld) => {
  overworld.on(OverworldEvents.CheckLampReach, EventPriority.Exact, (event) => {
    event.reach = ILLUMINATE_LAMP_CELLS;
  });
});

/**
 * What Stench keeps away, in spawns. It is an ability the mainline
 * uses to halve the encounter rate, and out here it is the Pure
 * Incense worn rather than carried
 */
export const STENCH_QUIET = 2;

/**
 * Stench: fewer come near, and never fewer than none
 */
const setupStench = createBuddyAbility(Abilities.Stench, (overworld) => {
  overworld.on(OverworldEvents.CheckSpawnCount, EventPriority.Exact, (event) => {
    event.count = Math.max(0, event.count - STENCH_QUIET);
  });
});

/**
 * How many levels a wary buddy keeps off the bottom of a band, and a
 * fierce one adds to the top.
 *
 * They are separate rules rather than one shifted band: a player
 * walking with both keeps the weak away *and* draws the strong out,
 * which is the pair working together rather than cancelling
 */
export const LEVEL_FLOOR_LIFT = 3;
export const LEVEL_CEILING_LIFT = 3;

/**
 * Keen Eye and Intimidate: what is far below the buddy does not come
 * out at all, so the bottom of the band lifts
 */
function createWaryAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckEncounterLevels, EventPriority.Exact, (event) => {
      event.lowest += LEVEL_FLOOR_LIFT;
    });
  });
}

/**
 * Hustle, Pressure and Vital Spirit: what a chunk fields at its
 * strongest comes out stronger still
 */
function createFierceAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckEncounterLevels, EventPriority.Exact, (event) => {
      event.highest += LEVEL_CEILING_LIFT;
    });
  });
}

/**
 * What Compound Eyes is worth: the two rare held-item slots turn up
 * this much more often. The common one is left alone, since it is
 * already half of every meeting and widening it would hand something
 * over every time without making the thing worth finding any likelier
 */
export const COMPOUND_EYES_HELD_BOOST = 2.5;

/**
 * Compound Eyes: it sees what a pokemon is carrying, so the meetings
 * worth searching turn up oftener. A rare slot goes from a hundredth
 * of them to a fortieth
 */
const setupCompoundEyes = createBuddyAbility(Abilities.CompoundEyes, (overworld) => {
  overworld.on(OverworldEvents.CheckEncounterHeld, EventPriority.Exact, (event) => {
    event.boost *= COMPOUND_EYES_HELD_BOOST;
  });
});

/**
 * Frisk: what is standing in front of the player is read before
 * anything is thrown at it, so a meeting worth a ball for what it is
 * carrying can be told from one that is not
 */
const setupFrisk = createBuddyAbility(Abilities.Frisk, (overworld) => {
  overworld.on(OverworldEvents.CheckRevealsHeld, EventPriority.Exact, (event) => {
    event.shown = true;
  });
});

/**
 * The lures, which draw `LURE_SPAWN_BONUS` more pokemon into a chunk,
 * the two abilities that decide what an encounter comes out as, and
 * the two that pay a walk rather than a meeting
 */
const FIELD_ABILITIES: ((overworld: Overworld) => void)[] = [
  createLureAbility(Abilities.ArenaTrap),
  createLureAbility(Abilities.Illuminate),
  createLureAbility(Abilities.NoGuard),

  setupIlluminate,
  setupStench,

  createWaryAbility(Abilities.KeenEye),
  createWaryAbility(Abilities.Intimidate),

  createFierceAbility(Abilities.Hustle),
  createFierceAbility(Abilities.Pressure),
  createFierceAbility(Abilities.VitalSpirit),

  setupCompoundEyes,
  setupFrisk,

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
