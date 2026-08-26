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
  /** A shadow purified, by Nurse Joy or a Purifying Gem alike */
  Purifies = 12,
  /** A pokemon evolved, by the species it evolved from */
  Evolutions = 13,
  /** A pokemon let go, by species */
  Releases = 14,
  /** A move learned by any road, by move */
  MovesLearned = 15,
  /** A fighting landmark's resident beaten, by foe */
  BattleWins = 16,
  /** Gold taken in; param 0, the count is the amount */
  GoldEarned = 17,
  /** Gold paid out for good; param 0, the count is the amount */
  GoldSpent = 18,
  /** A mystery gift claimed off the shelf */
  Gifts = 19,
  /** An auction bid placed, outbid or not */
  Bids = 20,
  /** A shiny caught, by species; these count under Catches too */
  ShinyCatches = 21,
  /**
   * A duelling trainer beaten, by their class. It counts under
   * BattleWins as well, the way a shiny counts under Catches: this is
   * the one that tells a Bug Catcher from a Swimmer
   */
  TrainerWins = 22,
  /**
   * A biome stood in for the first time, by biome. Marked once and
   * never added to, so the total is how many different biomes the
   * player has seen
   */
  Biomes = 23,
  /** Pending effort points put into a stat; the count is the points */
  EffortAssigned = 24,
}

/** The landmark kinds the Landmarks metric counts, as its params */
export const enum Landmark {
  Cache = 0,
  Berry = 1,
  Nest = 2,
  Phenomenon = 3,
  /** A portal crossed, key and all */
  Portal = 4,
}

/** The foes the BattleWins metric counts, as its params */
export const enum Foe {
  Rocket = 0,
  GymLeader = 1,
  EliteFour = 2,
  Champion = 3,
  /** Any duelling trainer, whatever class they were */
  Trainer = 4,
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
