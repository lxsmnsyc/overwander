import { Landmark, Metric } from '../auth/quest-record';
import { Types } from './constants/types';
import Npc from './overworld/npc';
import type { Species } from './ids/species';
import { getSpeciesData } from './species';

/**
 * Achievements: lifetime awards in 4 tiers, derived from the same
 * counters the quests read. Nothing is stored when a tier is
 * reached — the counters are the truth, and a standing is computed
 * from them wherever it is shown. Bronze unlocks the line's title,
 * worn in the tier's colour; Platinum adds its Master variant.
 */

export const enum AchievementTier {
  None = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4,
}

export const TIER_NAMES: Record<AchievementTier, string> = {
  [AchievementTier.None]: 'Unranked',
  [AchievementTier.Bronze]: 'Bronze',
  [AchievementTier.Silver]: 'Silver',
  [AchievementTier.Gold]: 'Gold',
  [AchievementTier.Platinum]: 'Platinum',
};

/** The metals: the slot ring and the worn title's badge share them */
export const TIER_COLORS: Record<AchievementTier, string> = {
  [AchievementTier.None]: '',
  [AchievementTier.Bronze]: '#b0793f',
  [AchievementTier.Silver]: '#9aa4b0',
  [AchievementTier.Gold]: '#e0b64f',
  [AchievementTier.Platinum]: '#7bc8d2',
};

const enum AchievementLine {
  Collector = 0,
  Hatcher = 1,
  Coach = 2,
  Wayfarer = 3,
  Socialite = 4,
  Forager = 5,
  Raider = 6,
  Trader = 7,
  Auctioneer = 8,
  Confidant = 9,
  Wayfinder = 10,
  Matchmaker = 11,
  Purifier = 12,
}

export { AchievementLine };

export const ACHIEVEMENT_LINES: AchievementLine[] = [
  AchievementLine.Collector,
  AchievementLine.Hatcher,
  AchievementLine.Coach,
  AchievementLine.Wayfarer,
  AchievementLine.Socialite,
  AchievementLine.Forager,
  AchievementLine.Raider,
  AchievementLine.Trader,
  AchievementLine.Auctioneer,
  AchievementLine.Confidant,
  AchievementLine.Wayfinder,
  AchievementLine.Matchmaker,
  AchievementLine.Purifier,
];

/**
 * Line names double as their titles, worn from Bronze with Master
 * prefixed at Platinum, so each has to read as something a player
 * would wear
 */
export const LINE_NAMES: Record<AchievementLine, string> = {
  [AchievementLine.Collector]: 'Collector',
  [AchievementLine.Hatcher]: 'Hatcher',
  [AchievementLine.Coach]: 'Coach',
  [AchievementLine.Wayfarer]: 'Wayfarer',
  [AchievementLine.Socialite]: 'Socialite',
  [AchievementLine.Forager]: 'Forager',
  [AchievementLine.Raider]: 'Raider',
  [AchievementLine.Trader]: 'Trader',
  [AchievementLine.Auctioneer]: 'Auctioneer',
  [AchievementLine.Confidant]: 'Confidant',
  [AchievementLine.Wayfinder]: 'Wayfinder',
  [AchievementLine.Matchmaker]: 'Matchmaker',
  [AchievementLine.Purifier]: 'Purifier',
};

/** What each line is counting, said for the hover card */
export const LINE_DEEDS: Record<AchievementLine, string> = {
  [AchievementLine.Collector]: 'pokemon caught',
  [AchievementLine.Hatcher]: 'eggs hatched',
  [AchievementLine.Coach]: 'levels gained',
  [AchievementLine.Wayfarer]: 'steps walked',
  [AchievementLine.Socialite]: 'people served by',
  [AchievementLine.Forager]: 'landmarks claimed',
  [AchievementLine.Raider]: 'raids won',
  [AchievementLine.Trader]: 'trades made',
  [AchievementLine.Auctioneer]: 'auctions settled',
  [AchievementLine.Confidant]: 'friends made',
  [AchievementLine.Wayfinder]: 'portals crossed',
  [AchievementLine.Matchmaker]: 'pairs bred',
  [AchievementLine.Purifier]: 'shadows purified',
};

/**
 * What each line asks of the counters: a metric, narrowed the way a
 * quest requirement narrows one
 */
interface LineAsk {
  metric: Metric;
  npc?: Npc;
  landmark?: Landmark;
}

const LINE_ASKS: Record<AchievementLine, LineAsk> = {
  [AchievementLine.Collector]: { metric: Metric.Catches },
  [AchievementLine.Hatcher]: { metric: Metric.Hatches },
  [AchievementLine.Coach]: { metric: Metric.LevelUps },
  [AchievementLine.Wayfarer]: { metric: Metric.Steps },
  [AchievementLine.Socialite]: { metric: Metric.NpcVisits },
  [AchievementLine.Forager]: { metric: Metric.Landmarks },
  [AchievementLine.Raider]: { metric: Metric.RaidWins },
  [AchievementLine.Trader]: { metric: Metric.Trades },
  [AchievementLine.Auctioneer]: { metric: Metric.Auctions },
  [AchievementLine.Confidant]: { metric: Metric.Friends },
  [AchievementLine.Wayfinder]: { metric: Metric.Landmarks, landmark: Landmark.Portal },
  [AchievementLine.Matchmaker]: { metric: Metric.NpcVisits, npc: Npc.Breeder },
  [AchievementLine.Purifier]: { metric: Metric.Purifies },
};

/** Each line's 4 tier thresholds, Bronze to Platinum, ascending */
export const LINE_TIERS: Record<AchievementLine, [number, number, number, number]> = {
  [AchievementLine.Collector]: [10, 50, 250, 1000],
  [AchievementLine.Hatcher]: [5, 25, 100, 500],
  [AchievementLine.Coach]: [25, 150, 750, 3000],
  [AchievementLine.Wayfarer]: [5000, 50_000, 250_000, 1_000_000],
  [AchievementLine.Socialite]: [10, 50, 250, 1000],
  [AchievementLine.Forager]: [25, 150, 750, 3000],
  [AchievementLine.Raider]: [5, 25, 100, 500],
  [AchievementLine.Trader]: [5, 25, 100, 250],
  [AchievementLine.Auctioneer]: [5, 25, 100, 250],
  [AchievementLine.Confidant]: [3, 10, 25, 50],
  [AchievementLine.Wayfinder]: [3, 10, 50, 200],
  [AchievementLine.Matchmaker]: [3, 10, 50, 200],
  [AchievementLine.Purifier]: [3, 10, 50, 200],
};

/**
 * The type lines: one per Gen 1 type, counting lifetime catches of
 * that type, dual-types counting for both. One price for all of
 * them — a thin pool climbs by repeat catches
 */
export const ACHIEVEMENT_TYPES: Types[] = [
  Types.Normal,
  Types.Fighting,
  Types.Flying,
  Types.Poison,
  Types.Ground,
  Types.Rock,
  Types.Bug,
  Types.Ghost,
  Types.Fire,
  Types.Water,
  Types.Grass,
  Types.Electric,
  Types.Psychic,
  Types.Ice,
  Types.Dragon,
];

export const TYPE_TIERS: [number, number, number, number] = [10, 50, 250, 1000];

/** The counters as `readProgress` hands them over */
export type Counters = Map<Metric, Map<number, number>>;

/** The tier a count stands at against ascending thresholds */
export function tierOf(
  count: number,
  thresholds: [number, number, number, number],
): AchievementTier {
  let reached = AchievementTier.None;

  for (const [at, threshold] of thresholds.entries()) {
    if (count >= threshold) {
      reached = at + 1;
    }
  }
  return reached;
}

/**
 * A tier's name off a plain number, for arithmetic like "the tier
 * above this one"
 */
export function tierName(tier: number): string {
  const names: Record<number, string> = TIER_NAMES;

  return names[tier] ?? '';
}

/** One line or type line as the shelf shows it */
export interface AchievementStanding {
  count: number;
  tier: AchievementTier;
  /** The next threshold to reach, or null past Platinum */
  next: number | null;
}

function standingOf(
  count: number,
  thresholds: [number, number, number, number],
): AchievementStanding {
  const tier = tierOf(count, thresholds);
  const remaining: readonly number[] = thresholds;

  return { count, tier, next: remaining[tier] ?? null };
}

function lineCount(counters: Counters, ask: LineAsk): number {
  const held = counters.get(ask.metric) ?? new Map<number, number>();

  if (ask.npc != null) {
    return held.get(ask.npc) ?? 0;
  }
  if (ask.landmark != null) {
    return held.get(ask.landmark) ?? 0;
  }

  let total = 0;

  for (const count of held.values()) {
    total += count;
  }
  return total;
}

/**
 * Lifetime catches by type, read off the per-species catch counters
 * through the registry. A species the registry does not know counts
 * for no type rather than throwing: an old counter outlives a rename
 */
function typeCounts(counters: Counters): Map<Types, number> {
  const held = counters.get(Metric.Catches) ?? new Map<number, number>();
  const totals = new Map<Types, number>();

  for (const [param, count] of held) {
    if (param < 0) {
      continue;
    }
    try {
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      for (const type of getSpeciesData(param as Species).types) {
        totals.set(type, (totals.get(type) ?? 0) + count);
      }
    } catch {
      continue;
    }
  }
  return totals;
}

export interface Achievements {
  lines: Map<AchievementLine, AchievementStanding>;
  types: Map<Types, AchievementStanding>;
}

/**
 * Every standing at once, pure over the counters: what the server
 * reads for the shelf and what the title check re-derives
 */
export function deriveAchievements(counters: Counters): Achievements {
  const lines = new Map<AchievementLine, AchievementStanding>();
  const types = new Map<Types, AchievementStanding>();

  for (const line of ACHIEVEMENT_LINES) {
    lines.set(line, standingOf(lineCount(counters, LINE_ASKS[line]), LINE_TIERS[line]));
  }

  const caught = typeCounts(counters);

  for (const type of ACHIEVEMENT_TYPES) {
    types.set(type, standingOf(caught.get(type) ?? 0, TYPE_TIERS));
  }
  return { lines, types };
}
