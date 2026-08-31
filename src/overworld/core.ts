import AleaRNG from '../core/alea';
import { EventEngine } from '../core/event-engine';
import type Abilities from '../data/ids/abilities';
import type Families from '../data/ids/families';
import type { Items } from '../data/ids/items';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import {
  type CheckCatchCandyEvent,
  type CheckEggStepsEvent,
  type CheckEncounterGenderEvent,
  type CheckEncounterHeldEvent,
  type CheckEncounterLevelsEvent,
  type CheckEncounterNatureEvent,
  type CheckEncounterShinyEvent,
  type CheckGoldRewardEvent,
  type CheckLampReachEvent,
  type CheckRevealsHeldEvent,
  type CheckSpawnCountEvent,
  type CheckWalkPickupEvent,
  type OverworldEventMap,
  OverworldEvents,
} from './events';

/**
 * The pokemon walking beside the player, as the field effects read
 * it. Null means they walk alone
 */
export interface Buddy {
  /**
   * What it is. The field effects mostly do not care, but an Exp.
   * Share pays this one's family rather than the caught pokemon's,
   * and only the species says which family that is
   */
  species: Species;
  abilities: Abilities[];
  items: Items[];
  nature: Natures;
  gender: Genders;
}

/**
 * The overworld as one player sees it: the engine every field
 * question is asked through.
 *
 * It follows the battle engine deliberately. A question is emitted as
 * a check event, the mechanics answer it plainly at Pre, and the
 * buddy's abilities and held items — each registered in one place of
 * its own — adjust the answer at Exact. Nothing that stages an
 * encounter has to know which abilities exist.
 *
 * An instance is cheap and short-lived: one per player per view or
 * request, built by `createOverworld`
 */
export default class Overworld extends EventEngine<OverworldEventMap> {
  constructor(
    /**
     * Whose overworld this is. Every roll is seeded with it, so two
     * players standing on one cell get their own answers
     */
    public readonly player: string,
    public readonly buddy: Buddy | null,
  ) {
    super();
  }

  /**
   * The roll stream one question runs on. It is keyed by what is
   * being asked about and by the player asking, so the client and the
   * server derive the same answer without exchanging it
   */
  random(subject: string, purpose: string): () => number {
    const rng = new AleaRNG(`${subject}:${this.player}:buddy:${purpose}`);

    return () => rng.random();
  }

  /**
   * Whether the buddy has the ability. Abilities register themselves
   * against this, so an effect never has to be spelled out at the
   * place that needs it
   */
  hasAbility(ability: Abilities): boolean {
    return this.buddy != null && new Set(this.buddy.abilities).has(ability);
  }

  /**
   * Whether the buddy is holding the item
   */
  holds(item: Items): boolean {
    return this.buddy != null && new Set(this.buddy.items).has(item);
  }

  /**
   * How many of a window's spawns this player can see. Lures raise it
   */
  checkSpawnCount(base: number): number {
    const event: CheckSpawnCountEvent = {
      id: 'CheckSpawnCount',
      disabled: false,
      overworld: this,
      random: this.random('spawns', 'lure'),
      base,
      count: base,
    };

    this.emit(OverworldEvents.CheckSpawnCount, event);
    return event.count;
  }

  /**
   * The nature an encounter comes with
   */
  checkEncounterNature(spawn: string, nature: Natures): Natures {
    const event: CheckEncounterNatureEvent = {
      id: 'CheckEncounterNature',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'nature'),
      nature,
    };

    this.emit(OverworldEvents.CheckEncounterNature, event);
    return event.nature;
  }

  /**
   * The gender an encounter comes with
   */
  checkEncounterGender(spawn: string, gender: Genders): Genders {
    const event: CheckEncounterGenderEvent = {
      id: 'CheckEncounterGender',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'gender'),
      gender,
    };

    this.emit(OverworldEvents.CheckEncounterGender, event);
    return event.gender;
  }

  /**
   * The multiplier on an encounter's shiny odds, before whatever the
   * species day is already worth
   */
  checkEncounterShiny(spawn: string, boost = 1): number {
    const event: CheckEncounterShinyEvent = {
      id: 'CheckEncounterShiny',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'shiny'),
      boost,
    };

    this.emit(OverworldEvents.CheckEncounterShiny, event);
    return event.boost;
  }

  /**
   * What a reward actually pays this player. The purse a raid or a
   * beaten grunt owes is decided by what was fought; what the player
   * walks away with is that, plus whatever they brought along
   */
  checkGoldReward(subject: string, base: number): number {
    const event: CheckGoldRewardEvent = {
      id: 'CheckGoldReward',
      disabled: false,
      overworld: this,
      random: this.random(subject, 'gold'),
      base,
      gold: base,
    };

    this.emit(OverworldEvents.CheckGoldReward, event);
    return event.gold;
  }

  /**
   * What a catch pays in candy on top of its own, by the family it
   * goes to. The catch's own reward is the candy rules' business —
   * this is only what the player was carrying at the time, so nothing
   * here is touched by the species day: a bonus is one candy whatever
   * day it falls on.
   *
   * Answers an empty map for a player carrying nothing that pays
   */
  checkCatchCandy(spawn: string, caught: Families): Map<Families, number> {
    const event: CheckCatchCandyEvent = {
      id: 'CheckCatchCandy',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'candy'),
      caught,
      buddy: this.buddy == null ? null : getSpeciesData(this.buddy.species).family,
      bonus: new Map(),
    };

    this.emit(OverworldEvents.CheckCatchCandy, event);
    return event.bonus;
  }

  /**
   * How far an egg has to be carried before it opens.
   *
   * It is asked once, as the egg comes into the player's hands, and
   * the answer is frozen onto the record — the same field a shadow egg
   * has already doubled. That is deliberate: what warms an egg is
   * whatever was walking beside the player when they picked it up, and
   * once they are carrying the egg itself there is nothing beside them
   * to warm it
   */
  checkEggSteps(subject: string, base: number): number {
    const event: CheckEggStepsEvent = {
      id: 'CheckEggSteps',
      disabled: false,
      overworld: this,
      random: this.random(subject, 'egg'),
      base,
      steps: base,
    };

    this.emit(OverworldEvents.CheckEggSteps, event);
    return Math.max(1, Math.ceil(event.steps));
  }

  /**
   * What the buddy picked up over the stretch just walked, counted in
   * whole finds. It is asked with where the walk stood before and
   * after, so an effect that fires every so many paces counts the
   * marks it crossed rather than trusting the size of the report
   */
  checkWalkPickup(subject: string, from: number, to: number): number {
    const event: CheckWalkPickupEvent = {
      id: 'CheckWalkPickup',
      disabled: false,
      overworld: this,
      random: this.random(subject, 'pickup'),
      from,
      to,
      found: 0,
    };

    this.emit(OverworldEvents.CheckWalkPickup, event);
    return Math.max(0, Math.floor(event.found));
  }

  /**
   * How far the player sees under a sky that has put the lights out,
   * in cells. It is asked whatever the sky is doing: only a dark one
   * reads the answer, and a board that asked conditionally would have
   * to know which skies those are
   */
  checkLampReach(base: number): number {
    const event: CheckLampReachEvent = {
      id: 'CheckLampReach',
      disabled: false,
      overworld: this,
      random: this.random('lamp', 'reach'),
      base,
      reach: base,
    };

    this.emit(OverworldEvents.CheckLampReach, event);
    return Math.max(0, event.reach);
  }

  /**
   * The band a wild meeting rolls its level inside. The floor never
   * passes the ceiling: an ability that keeps the weak away and one
   * that draws the strong out can be carried by the same buddy
   */
  checkEncounterLevels(spawn: string, base: [lowest: number, highest: number]): [number, number] {
    const event: CheckEncounterLevelsEvent = {
      id: 'CheckEncounterLevels',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'levels'),
      base,
      lowest: base[0],
      highest: base[1],
    };

    this.emit(OverworldEvents.CheckEncounterLevels, event);

    const highest = Math.max(1, Math.round(event.highest));

    return [Math.min(highest, Math.max(1, Math.round(event.lowest))), highest];
  }

  /**
   * How much likelier a wild meeting is to be carrying something
   */
  checkEncounterHeld(spawn: string): number {
    const event: CheckEncounterHeldEvent = {
      id: 'CheckEncounterHeld',
      disabled: false,
      overworld: this,
      random: this.random(spawn, 'held'),
      boost: 1,
    };

    this.emit(OverworldEvents.CheckEncounterHeld, event);
    return Math.max(1, event.boost);
  }

  /**
   * Whether what a meeting is holding is shown before anything is
   * thrown at it
   */
  checkRevealsHeld(): boolean {
    const event: CheckRevealsHeldEvent = {
      id: 'CheckRevealsHeld',
      disabled: false,
      overworld: this,
      random: this.random('held', 'shown'),
      shown: false,
    };

    this.emit(OverworldEvents.CheckRevealsHeld, event);
    return event.shown;
  }
}
