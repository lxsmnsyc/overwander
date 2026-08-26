import { Foe, Landmark, Metric } from '../../auth/quest-record';
import Awards from '../ids/awards';
import type Families from '../ids/families';
import Regions from '../ids/regions';
import { Balls, Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import Npc from '../overworld/npc';
import type { TrainerClass } from '../overworld/trainers';
import { Species } from '../ids/species';
import type { Types } from '../constants/types';

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
  // Kanto Pokedex
  FieldResearcher = 31,
  DexScholar = 32,
  KantoComplete = 33,
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
  Pokedex = 10,
}

export interface ChainData {
  name: string;
  quests: Quests[];
}

export const CHAINS: Record<Chains, ChainData> = {
  [Chains.Catching]: {
    name: "Catcher's Start",
    quests: [Quests.FirstCatch, Quests.GrowingTeam, Quests.NewFaces, Quests.FieldNotes],
  },
  [Chains.Battling]: {
    name: 'Roadside Rivals',
    quests: [Quests.PickingFights, Quests.RocketTrouble, Quests.CleanupCrew],
  },
  [Chains.Raiding]: {
    name: 'Raid Sirens',
    quests: [Quests.RaidRookie, Quests.BossDown, Quests.SirenVeteran],
  },
  [Chains.Phenomena]: {
    name: 'Strange Weather',
    quests: [Quests.OddLights, Quests.StormChaser],
  },
  [Chains.Eggs]: {
    name: 'The Hatchery',
    quests: [
      Quests.EggSpotting,
      Quests.OutForAWalk,
      Quests.FreshHatch,
      Quests.Matchmaker,
      Quests.NestForANibble,
    ],
  },
  [Chains.Happiness]: {
    name: 'Warm Company',
    quests: [Quests.SideBySide, Quests.DayAtTheSpa],
  },
  [Chains.Training]: {
    name: 'Coaching Course',
    quests: [
      Quests.GrowthSpurt,
      Quests.BalancedDiet,
      Quests.FineTuning,
      Quests.NewTricks,
      Quests.FullBloom,
    ],
  },
  [Chains.Auctions]: {
    name: 'Auction House',
    quests: [Quests.OpeningBid, Quests.Sold],
  },
  [Chains.Biomes]: {
    name: 'The Wide World',
    quests: [Quests.OverTheHill, Quests.ThroughTheDoor, Quests.FarAfield],
  },
  [Chains.Friends]: {
    name: 'Better Together',
    quests: [Quests.FriendlyFace, Quests.FairSwap],
  },
  [Chains.Pokedex]: {
    name: 'Kanto Pokedex',
    quests: [Quests.FieldResearcher, Quests.DexScholar, Quests.KantoComplete],
  },
};

/** Every chain, in the order the board shows them */
export const CHAIN_ORDER: Chains[] = [
  Chains.Catching,
  Chains.Battling,
  Chains.Raiding,
  Chains.Phenomena,
  Chains.Eggs,
  Chains.Happiness,
  Chains.Training,
  Chains.Auctions,
  Chains.Biomes,
  Chains.Friends,
  Chains.Pokedex,
];

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
  // Catcher's Start: throw a ball, then meet the dex
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
  [Quests.NewFaces]: {
    name: 'New Faces',
    requirements: [{ kind: RequirementKind.Dex, count: 5 }],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.UltraBall, amount: 3 }],
  },
  [Quests.FieldNotes]: {
    name: 'Field Notes',
    requirements: [{ kind: RequirementKind.Dex, count: 10 }],
    rewards: [{ kind: QuestRewardKind.Encounter, species: Species.Scyther, level: 15 }],
  },

  // Roadside Rivals: duels, Team Rocket, and the shadow they leave
  [Quests.PickingFights]: {
    name: 'Picking Fights',
    requirements: [ask(Metric.BattleWins, 1, { foe: Foe.Trainer })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.SuperPotion, amount: 5 }],
  },
  [Quests.RocketTrouble]: {
    name: 'Rocket Trouble',
    requirements: [ask(Metric.BattleWins, 1, { foe: Foe.Rocket })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.Revive, amount: 2 }],
  },
  [Quests.CleanupCrew]: {
    name: 'Cleanup Crew',
    requirements: [ask(Metric.Purifies, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.PurifyingGem, amount: 1 }],
  },

  // Raid Sirens: answer one, win one, make a habit of it
  [Quests.RaidRookie]: {
    name: 'Raid Rookie',
    requirements: [ask(Metric.RaidRuns, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.HyperPotion, amount: 5 }],
  },
  [Quests.BossDown]: {
    name: 'Boss Down',
    requirements: [ask(Metric.RaidWins, 1)],
    rewards: [
      { kind: QuestRewardKind.Catch, species: Species.Eevee, level: 5, ball: Balls.PremierBall },
    ],
  },
  [Quests.SirenVeteran]: {
    name: 'Siren Veteran',
    requirements: [ask(Metric.RaidWins, 5)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.RareCandy, amount: 3 }],
  },

  // Strange Weather: what a phenomenon hides
  [Quests.OddLights]: {
    name: 'Odd Lights',
    requirements: [ask(Metric.Landmarks, 1, { landmark: Landmark.Phenomenon })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.SitrusBerry, amount: 3 }],
  },
  [Quests.StormChaser]: {
    name: 'Storm Chaser',
    requirements: [ask(Metric.Landmarks, 5, { landmark: Landmark.Phenomenon })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.MoonStone, amount: 1 }],
  },

  // The Hatchery: find a nest, walk it warm, then breed your own.
  // The berries the first quest pays are the ones the last one asks
  // back, so the chain feeds itself
  [Quests.EggSpotting]: {
    name: 'Egg Spotting',
    requirements: [ask(Metric.Landmarks, 1, { landmark: Landmark.Nest })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.OranBerry, amount: 5 }],
  },
  [Quests.OutForAWalk]: {
    name: 'Out for a Walk',
    requirements: [ask(Metric.Steps, 1000)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.SitrusBerry, amount: 2 }],
  },
  [Quests.FreshHatch]: {
    name: 'Fresh Hatch',
    requirements: [ask(Metric.Hatches, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.HPUp, amount: 1 }],
  },
  [Quests.Matchmaker]: {
    name: 'Matchmaker',
    requirements: [ask(Metric.NpcVisits, 1, { npc: Npc.Breeder })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.Everstone, amount: 1 }],
  },
  [Quests.NestForANibble]: {
    name: 'Nest for a Nibble',
    requirements: [{ kind: RequirementKind.TurnIn, item: Items.OranBerry, count: 3 }],
    rewards: [{ kind: QuestRewardKind.Egg, species: Species.Chansey }],
  },

  // Warm Company: friendship is walked and groomed
  [Quests.SideBySide]: {
    name: 'Side by Side',
    requirements: [ask(Metric.Steps, 2500)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.OranBerry, amount: 10 }],
  },
  [Quests.DayAtTheSpa]: {
    name: 'Day at the Spa',
    requirements: [ask(Metric.NpcVisits, 1, { npc: Npc.Groomer })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.LuxuryBall, amount: 1 }],
  },

  // Coaching Course: levels, vitamins, moves, and the payoff.
  // Growth Spurt hands over the Protein that Balanced Diet asks to
  // see used
  [Quests.GrowthSpurt]: {
    name: 'Growth Spurt',
    requirements: [ask(Metric.LevelUps, 1)],
    rewards: [
      { kind: QuestRewardKind.Item, item: Items.RareCandy, amount: 1 },
      { kind: QuestRewardKind.Item, item: Items.Protein, amount: 1 },
    ],
  },
  [Quests.BalancedDiet]: {
    name: 'Balanced Diet',
    requirements: [ask(Metric.ItemUses, 1, { item: Items.Protein })],
    rewards: [
      { kind: QuestRewardKind.Item, item: Items.Iron, amount: 1 },
      { kind: QuestRewardKind.Item, item: Items.Carbos, amount: 1 },
    ],
  },
  [Quests.FineTuning]: {
    name: 'Fine Tuning',
    requirements: [ask(Metric.EffortAssigned, 10)],
    rewards: [
      { kind: QuestRewardKind.Item, item: Items.MuscleWing, amount: 3 },
      { kind: QuestRewardKind.Item, item: Items.SwiftWing, amount: 3 },
    ],
  },
  [Quests.NewTricks]: {
    name: 'New Tricks',
    requirements: [ask(Metric.MovesLearned, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.HeartScale, amount: 1 }],
  },
  [Quests.FullBloom]: {
    name: 'Full Bloom',
    requirements: [ask(Metric.Evolutions, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.PPUp, amount: 1 }],
  },

  // Auction House: a bid placed, then a lot settled either side
  [Quests.OpeningBid]: {
    name: 'Opening Bid',
    requirements: [ask(Metric.Bids, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.Nugget, amount: 1 }],
  },
  [Quests.Sold]: {
    name: 'Sold!',
    requirements: [ask(Metric.Auctions, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.BigNugget, amount: 1 }],
  },

  // The Wide World: the map is bigger than the first field
  [Quests.OverTheHill]: {
    name: 'Over the Hill',
    requirements: [ask(Metric.Biomes, 3)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.TinyMushroom, amount: 2 }],
  },
  [Quests.ThroughTheDoor]: {
    name: 'Through the Door',
    requirements: [ask(Metric.Landmarks, 1, { landmark: Landmark.Portal })],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.PortalKey, amount: 1 }],
  },
  [Quests.FarAfield]: {
    name: 'Far Afield',
    requirements: [ask(Metric.Biomes, 8)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.PearlString, amount: 1 }],
  },

  // Better Together: a friend made, then a trade across the tie
  [Quests.FriendlyFace]: {
    name: 'A Friendly Face',
    requirements: [ask(Metric.Friends, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.UltraBall, amount: 3 }],
  },
  [Quests.FairSwap]: {
    name: 'Fair Swap',
    requirements: [ask(Metric.Trades, 1)],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.GreatBall, amount: 5 }],
  },

  // Kanto Pokedex: the region's 151, milestone by milestone, with a
  // medal on the shelf at the end of it
  [Quests.FieldResearcher]: {
    name: 'Field Researcher',
    requirements: [{ kind: RequirementKind.Dex, count: 25, region: Regions.Kanto }],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.UltraBall, amount: 5 }],
  },
  [Quests.DexScholar]: {
    name: 'Dex Scholar',
    requirements: [{ kind: RequirementKind.Dex, count: 75, region: Regions.Kanto }],
    rewards: [{ kind: QuestRewardKind.Item, item: Items.RareCandy, amount: 3 }],
  },
  [Quests.KantoComplete]: {
    name: 'Kanto Complete',
    requirements: [{ kind: RequirementKind.Dex, count: 150, region: Regions.Kanto }],
    rewards: [
      { kind: QuestRewardKind.Award, award: Awards.KantoDexMedal },
      { kind: QuestRewardKind.Item, item: Items.MasterBall, amount: 1 },
    ],
  },
};

/** Every quest, in the order the list shows them: chain by chain */
export const QUEST_ORDER: Quests[] = CHAIN_ORDER.flatMap((chain) => CHAINS[chain].quests);
