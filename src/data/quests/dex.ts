import Awards from '../ids/awards';
import { Items } from '../ids/items';
import Regions from '../ids/regions';
import { REGIONS, REGION_NAMES } from '../species/regions';
import {
  type ChainData,
  type Chains,
  type QuestData,
  QuestRewardKind,
  type Quests,
  RequirementKind,
} from './types';

/**
 * The dex chain, one per region.
 *
 * Every region's pokedex is the same ladder with different numbers, so
 * it is generated rather than written out: a region declares how many
 * caught each rung asks for and which medal the last one hangs on the
 * shelf, and its chain, its quests and their ids all follow. Adding a
 * region is adding a row here, not three quests, a chain and a name
 * apiece.
 *
 * Only regions with an entry get a chain. Nothing is invented for a
 * region whose species are not written yet
 */

export interface RegionDex {
  /** How many of the region's own each rung asks the dex to hold */
  milestones: number[];
  /** What the last rung hangs on the shelf */
  medal: Awards;
}

export const REGION_DEXES: Partial<Record<Regions, RegionDex>> = {
  // 151 to find. A sixth of them, half of them, and all but Mew, who
  // is nobody's to walk into
  [Regions.Kanto]: { milestones: [25, 75, 150], medal: Awards.KantoDexMedal },
  // 100 more, and the same shape: a fifth, half, and all but Celebi
  [Regions.Johto]: { milestones: [20, 50, 99], medal: Awards.JohtoDexMedal },
  // 135 more, and the same shape again: a fifth, half, and all but
  // the two mythicals, since a relic is not something a walk turns up
  [Regions.Hoenn]: { milestones: [27, 68, 133], medal: Awards.HoennDexMedal },
};

/**
 * Where the generated ids live: high above the written quests and the
 * written chains, a hundred apiece, so both sides can grow without
 * ever meeting. A region's rung keeps its number for good, which is
 * what the claim rows are written in
 */
export const DEX_QUEST_BASE = 1000;
export const DEX_CHAIN_BASE = 100;

export function dexQuestId(region: Regions, rung: number): Quests {
  return DEX_QUEST_BASE + region * 100 + rung;
}

export function dexChainId(region: Regions): Chains {
  return DEX_CHAIN_BASE + region;
}

/** A region's name with its capital back on, off the lower-case sheet names */
function regionTitle(region: Regions): string {
  const name = REGION_NAMES[region];

  return name.slice(0, 1).toUpperCase() + name.slice(1);
}

/**
 * What each rung is called. The last is the region's name, since
 * finishing a dex is the thing the chain is named for; the ones below
 * it are the titles a collector picks up on the way, and a ladder
 * longer than the titles falls back to counting
 */
const RUNG_NAMES = ['Field Researcher', 'Dex Scholar', 'Dex Master', 'Dex Sage'];

function rungName(region: Regions, rung: number, rungs: number): string {
  if (rung === rungs - 1) {
    return `${regionTitle(region)} Complete`;
  }
  return RUNG_NAMES[rung] ?? `${regionTitle(region)} Dex ${rung + 1}`;
}

/**
 * What a rung pays. The last one is the medal and a Master Ball;
 * below it the reward climbs with the ask, since the rungs get
 * further apart as a dex fills
 */
function rungRewards(medal: Awards, rung: number, rungs: number): QuestData['rewards'] {
  if (rung === rungs - 1) {
    return [
      { kind: QuestRewardKind.Award, award: medal },
      { kind: QuestRewardKind.Item, item: Items.MasterBall, amount: 1 },
    ];
  }
  return rung === 0
    ? [{ kind: QuestRewardKind.Item, item: Items.UltraBall, amount: 5 }]
    : [{ kind: QuestRewardKind.Item, item: Items.RareCandy, amount: rung + 2 }];
}

/** Every region that has a dex chain, in region order */
export function getDexRegions(): Regions[] {
  return REGIONS.filter((region) => REGION_DEXES[region] != null);
}

/** One region's dex quests, keyed by the id their claim rows carry */
export function getDexQuests(region: Regions): Map<Quests, QuestData> {
  const dex = REGION_DEXES[region];
  const quests = new Map<Quests, QuestData>();

  if (dex == null) {
    return quests;
  }

  for (const [rung, count] of dex.milestones.entries()) {
    quests.set(dexQuestId(region, rung), {
      name: rungName(region, rung, dex.milestones.length),
      requirements: [{ kind: RequirementKind.Dex, count, region }],
      rewards: rungRewards(dex.medal, rung, dex.milestones.length),
    });
  }
  return quests;
}

/** One region's dex chain, or null for a region that has no dex yet */
export function getDexChain(region: Regions): ChainData | null {
  const dex = REGION_DEXES[region];

  if (dex == null) {
    return null;
  }
  return {
    name: `${regionTitle(region)} Pokedex`,
    quests: dex.milestones.map((_, rung) => dexQuestId(region, rung)),
  };
}
