import { type Foe, type Landmark, Metric } from '../../auth/quest-record';
import type Families from '../ids/families';
import { Balls, Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import Npc from '../overworld/npc';
import { Species } from '../ids/species';
import { Types } from '../constants/types';

/**
 * The quests themselves: requirements against the lifetime counters,
 * rewards paid through the gift machinery, and an optional chain link
 * so a line of them reads as a progression. Definitions live in code
 * the way items and species do; the database only remembers counters
 * and claims.
 */

export const enum Quests {
  FirstCatch = 0,
  GrowingTeam = 1,
  OutForAWalk = 2,
  GrowthSpurt = 3,
  LocalFaces = 4,
  RocketTrouble = 5,
  BetterTogether = 6,
  RaidRookie = 7,
  BugHunter = 8,
  NestForANibble = 9,
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
}

export interface TurnInRequirement {
  kind: RequirementKind.TurnIn;
  item: Items;
  count: number;
}

export interface DexRequirement {
  kind: RequirementKind.Dex;
  count: number;
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
}

export type QuestReward =
  | { kind: QuestRewardKind.Item; item: Items; amount: number }
  | { kind: QuestRewardKind.Catch; species: Species; level: number; shiny?: boolean; ball?: Balls }
  | { kind: QuestRewardKind.Encounter; species: Species; level: number; shiny?: boolean }
  | { kind: QuestRewardKind.Egg; species: Species };

export interface QuestData {
  name: string;
  requirements: QuestRequirement[];
  rewards: QuestReward[];
}

/**
 * A chain: quests claimed strictly in order, drawn as one group with
 * its progress. Membership lives here rather than on the quest, so
 * the order is written exactly once
 */
export const enum Chains {
  TrainersPath = 0,
}

export interface ChainData {
  name: string;
  quests: Quests[];
}

export const CHAINS: Record<Chains, ChainData> = {
  [Chains.TrainersPath]: {
    name: "Trainer's Path",
    quests: [
      Quests.FirstCatch,
      Quests.GrowingTeam,
      Quests.OutForAWalk,
      Quests.GrowthSpurt,
      Quests.LocalFaces,
      Quests.RocketTrouble,
      Quests.BetterTogether,
      Quests.RaidRookie,
    ],
  },
};

/** Every chain, in the order the board shows them */
export const CHAIN_ORDER: Chains[] = [Chains.TrainersPath];

/**
 * The quest that has to be claimed before this one unlocks: its
 * predecessor in its chain, or nothing for a chain opener and for
 * every standalone
 */
export function prerequisiteOf(quest: Quests): Quests | null {
  for (const chain of CHAIN_ORDER) {
    const at = CHAINS[chain].quests.indexOf(quest);

    if (at > 0) {
      return CHAINS[chain].quests[at - 1];
    }
  }
  return null;
}

function ask(metric: Metric, count: number, rest?: Partial<MetricRequirement>): MetricRequirement {
  return { kind: RequirementKind.Counter, metric, count, ...rest };
}

export const QUESTS: Record<Quests, QuestData> = {
  [Quests.FirstCatch]: {
    name: 'First Catch',
    requirements: [ask(Metric.Catches, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.PokeBall, amount: 10 }],
  },
  [Quests.GrowingTeam]: {
    name: 'Growing Team',
    requirements: [ask(Metric.Catches, 5)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.GreatBall, amount: 5 }],
  },
  [Quests.OutForAWalk]: {
    name: 'Out for a Walk',
    requirements: [ask(Metric.Steps, 1000)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.OranBerry, amount: 5 }],
  },
  [Quests.GrowthSpurt]: {
    name: 'Growth Spurt',
    requirements: [ask(Metric.LevelUps, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.RareCandy, amount: 1 }],
  },
  [Quests.LocalFaces]: {
    name: 'Local Faces',
    requirements: [ask(Metric.NpcVisits, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.HeartScale, amount: 1 }],
  },
  [Quests.RocketTrouble]: {
    name: 'Rocket Trouble',
    requirements: [ask(Metric.NpcVisits, 1, { npc: Npc.RocketGrunt })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.SuperPotion, amount: 5 }],
  },
  [Quests.BetterTogether]: {
    name: 'Better Together',
    requirements: [ask(Metric.Friends, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.UltraBall, amount: 3 }],
  },
  [Quests.RaidRookie]: {
    name: 'Raid Rookie',
    requirements: [ask(Metric.RaidRuns, 1)],
    rewards: [
      { kind: QuestRewardKind.Catch, species: Species.Eevee, level: 5, ball: Balls.PremierBall },
    ],
  },
  [Quests.BugHunter]: {
    name: 'Bug Hunter',
    requirements: [ask(Metric.Catches, 3, { type: Types.Bug })],
    rewards: [{ kind: QuestRewardKind.Encounter, species: Species.Scyther, level: 15 }],
  },
  [Quests.NestForANibble]: {
    name: 'Nest for a Nibble',
    requirements: [{ kind: RequirementKind.TurnIn, item: Items.OranBerry, count: 3 }],
    rewards: [{ kind: QuestRewardKind.Egg, species: Species.Chansey }],
  },
};

/** Every quest, in the order the list shows them */
export const QUEST_ORDER: Quests[] = [
  Quests.FirstCatch,
  Quests.GrowingTeam,
  Quests.OutForAWalk,
  Quests.GrowthSpurt,
  Quests.LocalFaces,
  Quests.RocketTrouble,
  Quests.BetterTogether,
  Quests.RaidRookie,
  Quests.BugHunter,
  Quests.NestForANibble,
];
