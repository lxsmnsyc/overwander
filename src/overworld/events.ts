import type { BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
import type Families from '../data/ids/families';
import type Natures from '../data/ids/natures';
import type { Genders } from '../data/ids/species';
import type Overworld from './core';

/**
 * What the overworld asks before it stages anything. Every question
 * is a check event: the mechanics fill in the plain answer, and
 * whatever walks beside the player — its abilities, what it holds —
 * listens in and changes it.
 *
 * This is the battle engine's shape, one domain over. An ability is
 * written once, in one place, and registers itself against the
 * questions it has an opinion about, rather than being spelled out
 * inside whichever function happened to need it
 */
export const enum OverworldEvents {
  /**
   * How many of a window's spawns this player can see. Lures raise it
   */
  CheckSpawnCount = 0,
  /**
   * The nature an encounter comes with. Synchronize passes the
   * buddy's on
   */
  CheckEncounterNature = 1,
  /**
   * The gender an encounter comes with. Cute Charm draws out the
   * opposite of the buddy's
   */
  CheckEncounterGender = 2,
  /**
   * The multiplier on an encounter's shiny odds. Held items raise it
   * — the Shiny Charm eightfold
   */
  CheckEncounterShiny = 3,
  /**
   * What a reward pays out. A Luck Incense doubles it
   */
  CheckGoldReward = 4,
  /**
   * What a catch pays in candy beyond its own. An Exp. Share pays the
   * buddy's family, a Lucky Egg the caught one's
   */
  CheckCatchCandy = 5,
  /**
   * How far an egg the player is picking up has to be carried. Flame
   * Body warms it, so it comes out sooner
   */
  CheckEggSteps = 6,
  /**
   * What the buddy found on the ground over the steps just walked.
   * Pickup is the only thing that answers it
   */
  CheckWalkPickup = 7,
}

/**
 * Every check event carries the roll stream its listeners decide on.
 * The stream is seeded by what is being asked about and by the player
 * asking, so the client and the server reach the same answer without
 * exchanging it, and two players standing on one cell get their own
 */
export interface OverworldEvent extends BaseEvent {
  overworld: Overworld;
  random: () => number;
}

export interface CheckSpawnCountEvent extends OverworldEvent {
  /**
   * What a player walking alone would see
   */
  base: number;
  count: number;
}

export interface CheckEncounterNatureEvent extends OverworldEvent {
  nature: Natures;
}

export interface CheckEncounterGenderEvent extends OverworldEvent {
  gender: Genders;
}

export interface CheckEncounterShinyEvent extends OverworldEvent {
  boost: number;
}

export interface CheckGoldRewardEvent extends OverworldEvent {
  /**
   * What the raid or the beaten trainer pays before anything the
   * player brought along has its say
   */
  base: number;
  gold: number;
}

export interface CheckCatchCandyEvent extends OverworldEvent {
  /**
   * The family of the pokemon that was just caught
   */
  caught: Families;
  /**
   * The family of the pokemon walking beside the player, or null when
   * they walk alone
   */
  buddy: Families | null;
  /**
   * What each family is owed on top of the catch's own candy, by the
   * family it goes to. It is a map rather than a count because the
   * two items pay different families — and the same one when the
   * buddy is of the caught pokemon's line
   */
  bonus: Map<Families, number>;
}

export interface CheckEggStepsEvent extends OverworldEvent {
  /**
   * What the egg would cost to hatch before anything the player was
   * walking with has its say
   */
  base: number;
  steps: number;
}

export interface CheckWalkPickupEvent extends OverworldEvent {
  /**
   * How far the buddy had walked before this report, and how far it
   * has walked after it. An effect that fires every so many steps
   * counts the marks between the two rather than being told how many
   * steps were credited, so a report split in half is worth exactly
   * what one report would have been
   */
  from: number;
  to: number;
  /**
   * How many things were found along the way
   */
  found: number;
}

export interface OverworldEventMap extends EventMap {
  [OverworldEvents.CheckSpawnCount]: [CheckSpawnCountEvent, EventPriority];
  [OverworldEvents.CheckEncounterNature]: [CheckEncounterNatureEvent, EventPriority];
  [OverworldEvents.CheckEncounterGender]: [CheckEncounterGenderEvent, EventPriority];
  [OverworldEvents.CheckEncounterShiny]: [CheckEncounterShinyEvent, EventPriority];
  [OverworldEvents.CheckGoldReward]: [CheckGoldRewardEvent, EventPriority];
  [OverworldEvents.CheckCatchCandy]: [CheckCatchCandyEvent, EventPriority];
  [OverworldEvents.CheckEggSteps]: [CheckEggStepsEvent, EventPriority];
  [OverworldEvents.CheckWalkPickup]: [CheckWalkPickupEvent, EventPriority];
}
