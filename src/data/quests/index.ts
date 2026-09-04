import { Foe, Landmark, Metric } from '../../auth/quest-record';
import { Balls, Items } from '../ids/items';
import Npc from '../overworld/npc';
import { Species } from '../ids/species';
import { dexChainId, getDexChain, getDexQuests, getDexRegions } from './dex';
import {
  type ChainData,
  Chains,
  type MetricRequirement,
  type QuestData,
  QuestRewardKind,
  Quests,
  RequirementKind,
} from './types';

/**
 * The quests themselves: requirements against the lifetime counters,
 * rewards paid through the gift machinery, and an optional chain link
 * so a line of them reads as a progression. Definitions live in code
 * the way items and species do; the database only remembers counters
 * and claims.
 *
 * The vocabulary they are written in is in `types.ts`, which the
 * generated pokedex chains in `dex.ts` share
 */

export * from './types';

const WRITTEN_CHAINS: Record<Chains, ChainData> = {
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
};

/** The written chains, in the order the board shows them */
const WRITTEN_CHAIN_ORDER: Chains[] = [
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
];

function ask(metric: Metric, count: number, rest?: Partial<MetricRequirement>): MetricRequirement {
  return { kind: RequirementKind.Counter, metric, count, ...rest };
}

const WRITTEN_QUESTS: Record<Quests, QuestData> = {
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
    // Doors rather than biomes. A counter behind a prerequisite is
    // measured from the moment it opens, and there are only 29 biomes
    // in the world, so a player who had already seen most of them
    // could never find another eight
    requirements: [ask(Metric.Landmarks, 5, { landmark: Landmark.Portal })],
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
};

/**
 * Every chain there is: the written ones, then one pokedex chain per
 * region that has a dex. The generated half is why these are built
 * rather than declared — a region arrives with its chain already in
 * the board's order
 */
export const CHAINS: Record<number, ChainData> = (() => {
  const chains: Record<number, ChainData> = { ...WRITTEN_CHAINS };

  for (const region of getDexRegions()) {
    const chain = getDexChain(region);

    if (chain != null) {
      chains[dexChainId(region)] = chain;
    }
  }
  return chains;
})();

export const CHAIN_ORDER: Chains[] = [
  ...WRITTEN_CHAIN_ORDER,
  ...getDexRegions().map((region) => dexChainId(region)),
];

export const QUESTS: Record<number, QuestData> = (() => {
  const quests: Record<number, QuestData> = { ...WRITTEN_QUESTS };

  for (const region of getDexRegions()) {
    for (const [quest, data] of getDexQuests(region)) {
      quests[quest] = data;
    }
  }
  return quests;
})();

/**
 * One quest's definition, or null for an id nothing declares. A claim
 * row outlives the quest it was written for — a region's dex chain can
 * be taken out again — so a reader must be able to ask
 */
export function getQuestData(quest: Quests): QuestData | null {
  return Object.hasOwn(QUESTS, quest) ? QUESTS[quest] : null;
}

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

/**
 * The quest this one unlocks by being claimed: its successor in its
 * chain, or nothing for a chain's last quest and for every standalone
 */
export function successorOf(quest: Quests): Quests | null {
  for (const chain of CHAIN_ORDER) {
    const chained = CHAINS[chain].quests;
    const at = chained.indexOf(quest);

    if (at >= 0 && at < chained.length - 1) {
      return chained[at + 1];
    }
  }
  return null;
}

/** Every quest, in the order the list shows them: chain by chain */
export const QUEST_ORDER: Quests[] = CHAIN_ORDER.flatMap((chain) => CHAINS[chain].quests);
