import type { Foe, Landmark, Metric } from '../../auth/quest-record';
import type Awards from '../ids/awards';
import type { Types } from '../constants/types';
import type Families from '../ids/families';
import type { Balls, Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type Npc from '../overworld/npc';
import type Regions from '../ids/regions';
import type { Species } from '../ids/species';
import type { TrainerClass } from '../overworld/trainers';

/**
 * The quests themselves: requirements against the lifetime counters,
 * rewards paid through the gift machinery, and an optional chain link
 * so a line of them reads as a progression. Definitions live in code
 * the way items and species do; the database only remembers counters
 * and claims.
 */

export const enum Quests {
  // Catcher's Start
  FirstCatch = 0,
  GrowingTeam = 1,
  NewFaces = 2,
  FieldNotes = 3,
  // Roadside Rivals
  PickingFights = 4,
  RocketTrouble = 5,
  CleanupCrew = 6,
  // Raid Sirens
  RaidRookie = 7,
  BossDown = 8,
  SirenVeteran = 9,
  // Strange Weather
  OddLights = 10,
  StormChaser = 11,
  // The Hatchery
  EggSpotting = 12,
  OutForAWalk = 13,
  FreshHatch = 14,
  Matchmaker = 15,
  NestForANibble = 16,
  // Warm Company
  SideBySide = 17,
  DayAtTheSpa = 18,
  // Coaching Course
  GrowthSpurt = 19,
  BalancedDiet = 20,
  NewTricks = 21,
  FullBloom = 22,
  // Auction House
  OpeningBid = 23,
  Sold = 24,
  // The Wide World
  OverTheHill = 25,
  ThroughTheDoor = 26,
  FarAfield = 27,
  // Better Together
  FriendlyFace = 28,
  FairSwap = 29,
  // Coaching Course, added after the first board shipped
  FineTuning = 30,
  // The pokedex chains are generated, one per region, and their ids
  // are numbered from DEX_QUEST_BASE in `dex.ts`. A written quest
  // added here carries on from 31
}

export const enum RequirementKind {
  /** A lifetime counter reaching a total */
  Counter = 0,
  /** Items standing in the bag, taken when the reward is */
  TurnIn = 1,
  /** Distinct species the dex has as caught */
  Dex = 2,
}

export interface MetricRequirement {
  kind: RequirementKind.Counter;
  metric: Metric;
  count: number;
  /**
   * Narrowings, at most one, and only where the metric has the
   * dimension: species/family/type where the params are species, item
   * for uses, npc for visits, landmark for landmarks, move for moves
   * learned, foe for battle wins. None asks for the total
   */
  species?: Species;
  family?: Families;
  type?: Types;
  item?: Items;
  npc?: Npc;
  landmark?: Landmark;
  move?: Moves;
  foe?: Foe;
  /** Which class of duelling trainer, for TrainerWins */
  trainer?: TrainerClass;
}

export interface TurnInRequirement {
  kind: RequirementKind.TurnIn;
  item: Items;
  count: number;
}

export interface DexRequirement {
  kind: RequirementKind.Dex;
  count: number;
  /** Count only one region's stretch of the dex; none counts it all */
  region?: Regions;
}

export type QuestRequirement = MetricRequirement | TurnInRequirement | DexRequirement;

export const enum QuestRewardKind {
  Item = 0,
  /** A finished record, handed over whole */
  Catch = 1,
  /** A meeting staged in the world, caught with the player's own ball */
  Encounter = 2,
  /** An egg in the box, hatched by walking */
  Egg = 3,
  /** A place on the awards shelf, earned for good */
  Award = 4,
}

export type QuestReward =
  | { kind: QuestRewardKind.Item; item: Items; amount: number }
  | { kind: QuestRewardKind.Catch; species: Species; level: number; shiny?: boolean; ball?: Balls }
  | { kind: QuestRewardKind.Encounter; species: Species; level: number; shiny?: boolean }
  | { kind: QuestRewardKind.Egg; species: Species }
  | { kind: QuestRewardKind.Award; award: Awards };

export interface QuestData {
  name: string;
  requirements: QuestRequirement[];
  rewards: QuestReward[];
}

/**
 * A chain: quests claimed strictly in order, drawn as one group with
 * its progress. Membership lives here rather than on the quest, so
 * the order is written exactly once.
 *
 * Each chain introduces one of the game's features, so the board
 * itself is the tutorial: the first quest of every chain stands open
 * from the start, and finishing one unlocks the next lesson in it
 */
export const enum Chains {
  Catching = 0,
  Battling = 1,
  Raiding = 2,
  Phenomena = 3,
  Eggs = 4,
  Happiness = 5,
  Training = 6,
  Auctions = 7,
  Biomes = 8,
  Friends = 9,
  // The pokedex chains are generated, one per region, and numbered
  // from DEX_CHAIN_BASE in `dex.ts`
}

export interface ChainData {
  name: string;
  quests: Quests[];
}
