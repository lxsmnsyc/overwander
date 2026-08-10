import type { BaseEvent, EventPriority } from '../core/event-emitter';
import type { EventMap } from '../core/event-engine';
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

export interface OverworldEventMap extends EventMap {
  [OverworldEvents.CheckSpawnCount]: [CheckSpawnCountEvent, EventPriority];
  [OverworldEvents.CheckEncounterNature]: [CheckEncounterNatureEvent, EventPriority];
  [OverworldEvents.CheckEncounterGender]: [CheckEncounterGenderEvent, EventPriority];
  [OverworldEvents.CheckEncounterShiny]: [CheckEncounterShinyEvent, EventPriority];
  [OverworldEvents.CheckGoldReward]: [CheckGoldRewardEvent, EventPriority];
}
