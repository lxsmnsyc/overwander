import type { QuestRequirement, Quests } from '../data/quests';

/**
 * Quests, as both sides read them.
 *
 * A quest is requirements and rewards. Requirements are read off
 * **lifetime counters** the server bumps wherever the action actually
 * happens, so there is no per-quest progress to drift; a chained
 * quest simply asks for a higher total than the one before it. The
 * only stored per-quest fact is the claim, which is what makes a
 * reward pay once.
 */

/**
 * What is counted. The param narrows a metric where one number is not
 * enough: which species was caught, which item was used, which person
 * was visited. Metrics without a dimension use param 0
 */
export const enum Metric {
  /** A pokemon obtained, by species; hatching counts apart */
  Catches = 0,
  /** An egg hatched, by species */
  Hatches = 1,
  LevelUps = 2,
  /** An item spent on a pokemon, by item */
  ItemUses = 3,
  Steps = 4,
  /** A wanderer's service taken, by npc; beating a grunt included */
  NpcVisits = 5,
  /** A landmark claimed, by kind */
  Landmarks = 6,
  /** A raid battle settled, won or not */
  RaidRuns = 7,
  RaidWins = 8,
  /** A trade accepted, counted for both sides */
  Trades = 9,
  Friends = 10,
  /** An auction settled, counted for seller and winner */
  Auctions = 11,
}

/** The landmark kinds the Landmarks metric counts, as its params */
export const enum Landmark {
  Cache = 0,
  Berry = 1,
  Nest = 2,
  Phenomenon = 3,
}

/**
 * One requirement as the list shows it: what is asked, and where this
 * player stands against it. A turn-in's `have` is the bag as it was
 * read, since nothing is consumed until the claim
 */
export interface RequirementStanding {
  requirement: QuestRequirement;
  have: number;
  met: boolean;
}

/** One quest as the list shows it */
export interface QuestStanding {
  quest: Quests;
  claimed: boolean;
  claimable: boolean;
  requirements: RequirementStanding[];
}
