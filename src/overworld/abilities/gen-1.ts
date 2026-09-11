import { EventPriority } from '../../core/event-emitter';
import Abilities from '../../data/ids/abilities';
import { Genders } from '../../data/ids/species';
import { Types } from '../../data/constants/types';
import { SHADOW_CATCH_FACTOR } from '../safari';
import type Overworld from '../core';
import { OverworldEvents } from '../events';
import {
  createBuddyAbility,
  createKinshipAbility,
  createLureAbility,
  createPullAbility,
  createTrapAbility,
} from './__create';

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
 * What a warm buddy takes off the walk an egg needs. Half is
 * the mainline's own figure, and it is applied to the requirement
 * rather than to the steps, so it is settled once instead of being
 * asked again every few paces
 */
export const FLAME_BODY_FACTOR = 0.5;

/**
 * Flame Body and Magma Armor: an egg picked up beside something warm
 * has less far to go.
 *
 * It reads the buddy at the moment the egg is found, because that is
 * the only moment there is one to read: walking an egg means carrying
 * the egg as the buddy, so nothing is beside the player afterwards.
 * The answer is frozen onto the egg's `hatchSteps`, which is the same
 * field a shadow egg has already doubled
 */
function createWarmAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckEggSteps, EventPriority.Exact, (event) => {
      event.steps *= FLAME_BODY_FACTOR;
    });
  });
}

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
 * What a purified buddy gives back of what a closed heart takes. Half
 * of it: a shadow is still a shadow, and the pokemon that walked out
 * of one is the one thing in the world that has done it before.
 *
 * Halfway between giving nothing back and undoing the penalty
 * outright, so it follows `SHADOW_CATCH_FACTOR` wherever that goes.
 * It was written as `1 / SHADOW_CATCH_FACTOR / 2`, which is the same
 * number only while a shadow is a third as catchable; the day that
 * became a half, this quietly became 1 and the ability stopped doing
 * anything
 */
export const PURIFIED_SHADOW_RELIEF = (1 + 1 / SHADOW_CATCH_FACTOR) / 2;

/**
 * Purified: a shadow throws truer for somebody who has already been
 * brought back from one. Nothing changes for anything else met
 */
const setupPurified = createBuddyAbility(Abilities.Purified, (overworld) => {
  overworld.on(OverworldEvents.CheckCatchChance, EventPriority.Exact, (event) => {
    if (event.encounter.shadow) {
      event.boost *= PURIFIED_SHADOW_RELIEF;
    }
  });
});

/**
 * How far a Honey Gather buddy walks between one bush and the next.
 * Shorter than Pickup's stretch, since what it comes back with is one
 * pool rather than the whole ladder of the world's finds
 */
export const HONEY_STEP_INTERVAL = 384;

/**
 * Honey Gather: it comes back from the hedges with something. What it
 * brings is what grows rather than what was dropped, so it is counted
 * apart from a Pickup buddy's finds
 */
const setupHoneyGather = createBuddyAbility(Abilities.HoneyGather, (overworld) => {
  overworld.on(OverworldEvents.CheckWalkPickup, EventPriority.Exact, (event) => {
    event.gathered +=
      Math.floor(event.to / HONEY_STEP_INTERVAL) - Math.floor(event.from / HONEY_STEP_INTERVAL);
  });
});

/**
 * How much further a Gluttony buddy carries a bagful of treats. It
 * lifts the ceiling rather than the treat: a berry is worth what a
 * berry is worth, and what changes is that the encounter is still
 * listening after the point where anything else would have stopped
 */
export const GLUTTONY_FEAST = 1.5;

/**
 * Gluttony: it eats past where the rest stop, so a player willing to
 * spend the bag gets further with it
 */
const setupGluttony = createBuddyAbility(Abilities.Gluttony, (overworld) => {
  overworld.on(OverworldEvents.CheckTreats, EventPriority.Exact, (event) => {
    event.cap *= GLUTTONY_FEAST;
  });
});

/**
 * Harvest: the treat grows back. What was fed goes on working through
 * the throw that missed, and the meeting will still take a fresh one
 * on top, so a Nanab's calm lasts the session rather than one ball
 */
const setupHarvest = createBuddyAbility(Abilities.Harvest, (overworld) => {
  overworld.on(OverworldEvents.CheckTreats, EventPriority.Exact, (event) => {
    event.keeps = true;
  });
});

/**
 * What Super Luck adds to how often a throw comes out critical. It
 * multiplies a chance that is small to begin with and capped after, so
 * it is a better eye rather than a different game
 */
export const KEEN_CRITICAL_BOOST = 2;

/**
 * Super Luck: the throw that holds on the first shake comes along
 * twice as often. It is the mainline's raised critical ratio, and it
 * changes how often rather than how well
 */
const setupSuperLuck = createBuddyAbility(Abilities.SuperLuck, (overworld) => {
  overworld.on(OverworldEvents.CheckCriticalCatch, EventPriority.Exact, (event) => {
    event.boost *= KEEN_CRITICAL_BOOST;
  });
});

/**
 * How many chances a Sniper buddy gives the one shake a critical
 * throw gets. Two aims, the better deciding, which is the mainline's
 * heavier critical hit said in the terms a ball has
 */
export const SNIPER_AIMS = 2;

/**
 * Sniper: critical throws come no oftener, and the ones that come are
 * far likelier to hold. It is the other half of Super Luck rather than
 * a second copy of it, so a player walking with either knows which
 * they are walking with
 */
const setupSniper = createBuddyAbility(Abilities.Sniper, (overworld) => {
  overworld.on(OverworldEvents.CheckCriticalCatch, EventPriority.Exact, (event) => {
    event.aims = SNIPER_AIMS;
  });
});

/**
 * Trace: what the pokemon standing there can do is read off it before
 * a ball is thrown.
 *
 * It is the last thing about a meeting that a catch used to be the
 * only way to learn, and it is the one that decides whether this
 * particular Rattata is worth keeping: two of a species are the same
 * pokemon until their abilities differ
 */
const setupTrace = createBuddyAbility(Abilities.Trace, (overworld) => {
  overworld.on(OverworldEvents.CheckRevealsAbility, EventPriority.Exact, (event) => {
    event.shown = true;
  });
});

/**
 * Pickpocket: a pokemon that got away did not get away with what it
 * was holding. It is the one thing that pays for a flight, and it
 * pays nothing where the meeting was carrying nothing
 */
const setupPickpocket = createBuddyAbility(Abilities.Pickpocket, (overworld) => {
  overworld.on(OverworldEvents.CheckPockets, EventPriority.Exact, (event) => {
    event.taken = true;
  });
});

/**
 * Forewarn and Anticipation: how ready the thing in front of the
 * player is to bolt is known before the first ball, so a meeting worth
 * a Nanab can be told from one worth throwing straight at.
 *
 * Both read the meeting rather than the fight, and out here that is
 * the one thing there is to read, so they answer alike
 */
function createReadingAbility(ability: Abilities): (overworld: Overworld) => void {
  return createBuddyAbility(ability, (overworld) => {
    overworld.on(OverworldEvents.CheckRevealsFlight, EventPriority.Exact, (event) => {
      event.shown = true;
    });
  });
}

/**
 * The lures, which draw `LURE_SPAWN_BONUS` more pokemon into a chunk,
 * the two that hold a meeting still, the two abilities that decide
 * what an encounter comes out as, and the two that pay a walk rather
 * than a meeting
 */
const FIELD_ABILITIES: ((overworld: Overworld) => void)[] = [
  createLureAbility(Abilities.ArenaTrap),
  createLureAbility(Abilities.Illuminate),
  createLureAbility(Abilities.NoGuard),

  createTrapAbility(Abilities.ArenaTrap),
  createTrapAbility(Abilities.ShadowTag),
  createPullAbility(Abilities.MagnetPull, Types.Steel),

  createKinshipAbility(Abilities.LightningRod, Types.Electric),
  createKinshipAbility(Abilities.MotorDrive, Types.Electric),
  createKinshipAbility(Abilities.VoltAbsorb, Types.Electric),
  createKinshipAbility(Abilities.StormDrain, Types.Water),
  createKinshipAbility(Abilities.WaterAbsorb, Types.Water),
  createKinshipAbility(Abilities.SapSipper, Types.Grass),
  createKinshipAbility(Abilities.FlashFire, Types.Fire),

  setupPurified,
  setupGluttony,
  setupHarvest,
  setupHoneyGather,

  setupIlluminate,
  setupStench,

  createWaryAbility(Abilities.KeenEye),
  createWaryAbility(Abilities.Intimidate),

  createFierceAbility(Abilities.Hustle),
  createFierceAbility(Abilities.Pressure),
  createFierceAbility(Abilities.VitalSpirit),

  setupCompoundEyes,
  setupFrisk,
  createReadingAbility(Abilities.Forewarn),
  createReadingAbility(Abilities.Anticipation),
  setupTrace,

  setupPickpocket,

  setupSuperLuck,
  setupSniper,

  setupSynchronize,
  setupCuteCharm,
  createWarmAbility(Abilities.FlameBody),
  createWarmAbility(Abilities.MagmaArmor),
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
