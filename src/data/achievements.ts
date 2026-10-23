import * as v from 'valibot';
import { type Landmark, Metric } from '../model/quest-record';
import achievementsFile from './achievements.yaml';
import type { Types } from './constants/types';
import {
  ACHIEVEMENT_LINE_IDS,
  ACHIEVEMENT_TIER_IDS,
  METRIC_IDS,
  NPC_IDS,
  QUEST_LANDMARK_IDS,
  TYPE_IDS,
} from './ids/names';
import type Npc from './overworld/npc';
import {
  TRAINER_CLASSES,
  TRAINER_TRADES,
  type TrainerClass,
  getTradeClasses,
} from './overworld/trainers';
import { AchievementLine, AchievementTier } from './ids/achievements';
import type { Species } from './ids/species';
import { getSpeciesData } from './species';
import achievementTextFile from './text/en/achievements.yaml';
import { idOf, idsOf, stringTable } from './yaml';

/**
 * Achievements: lifetime awards in 4 tiers, derived from the same
 * counters the quests read. Nothing is stored when a tier is
 * reached — the counters are the truth, and a standing is computed
 * from them wherever it is shown. Bronze unlocks the line's title,
 * worn in the tier's colour; Platinum adds its Master variant. What
 * each line counts and its thresholds are `achievements.yaml`.
 */

const ACHIEVEMENT_TEXT = v.parse(
  v.strictObject({
    tiers: v.unknown(),
    lines: v.record(v.string(), v.strictObject({ name: v.string(), deed: v.string() })),
  }),
  achievementTextFile,
);

export const TIER_NAMES = stringTable<AchievementTier>(
  ACHIEVEMENT_TIER_IDS,
  ACHIEVEMENT_TEXT.tiers,
  'text/en/achievements.yaml: tiers',
);

type Thresholds = [number, number, number, number];

const THRESHOLDS = v.tuple([v.number(), v.number(), v.number(), v.number()]);

const FILE = v.strictObject({
  lines: v.record(
    v.string(),
    v.strictObject({
      metric: v.string(),
      npc: v.optional(v.string()),
      landmark: v.optional(v.string()),
      tiers: THRESHOLDS,
    }),
  ),
  types: v.array(v.string()),
  'type-tiers': THRESHOLDS,
  'trainer-tiers': THRESHOLDS,
  colors: v.record(v.string(), v.string()),
});

/** The numbers, out of `achievements.yaml` */
const written = v.parse(FILE, achievementsFile);

/** The metals: the slot ring and the worn title's badge share them */
export const TIER_COLORS: Record<AchievementTier, string> = {
  [AchievementTier.None]: '',
  [AchievementTier.Bronze]: '',
  [AchievementTier.Silver]: '',
  [AchievementTier.Gold]: '',
  [AchievementTier.Platinum]: '',
};

for (const [name, color] of Object.entries(written.colors)) {
  TIER_COLORS[idOf<AchievementTier>(ACHIEVEMENT_TIER_IDS, name, `achievements.yaml: colors`)] =
    color;
}

export { AchievementLine, AchievementTier };

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
  AchievementLine.Pathfinder,
];

/**
 * Line names double as their titles, worn from Bronze with Master
 * prefixed at Platinum, so each has to read as something a player
 * would wear
 */
export const LINE_NAMES: Record<number, string> = {};

/** What each line is counting, said for the hover card */
export const LINE_DEEDS: Record<number, string> = {};

for (const [name, said] of Object.entries(ACHIEVEMENT_TEXT.lines)) {
  const line = idOf(ACHIEVEMENT_LINE_IDS, name, `text/en/achievements.yaml: ${name}`);

  LINE_NAMES[line] = said.name;
  LINE_DEEDS[line] = said.deed;
}
for (const [name, line] of Object.entries(ACHIEVEMENT_LINE_IDS)) {
  if (!Object.hasOwn(LINE_NAMES, line)) {
    throw new Error(`text/en/achievements.yaml: ${name} is missing`);
  }
}

/**
 * What each line asks of the counters: a metric, narrowed the way a
 * quest requirement narrows one
 */
interface LineAsk {
  metric: Metric;
  npc?: Npc;
  landmark?: Landmark;
}

const LINE_ASKS: Record<number, LineAsk> = {};

/** Each line's 4 tier thresholds, Bronze to Platinum, ascending */
export const LINE_TIERS: Record<number, Thresholds> = {};

for (const [name, line] of Object.entries(written.lines)) {
  const where = `achievements.yaml: ${name}`;
  const id = idOf<AchievementLine>(ACHIEVEMENT_LINE_IDS, name, where);
  const ask: LineAsk = { metric: idOf<Metric>(METRIC_IDS, line.metric, where) };

  if (line.npc != null) {
    ask.npc = idOf<Npc>(NPC_IDS, line.npc, where);
  }
  if (line.landmark != null) {
    ask.landmark = idOf<Landmark>(QUEST_LANDMARK_IDS, line.landmark, where);
  }
  LINE_ASKS[id] = ask;
  LINE_TIERS[id] = line.tiers;
}

// Every line is written down, so none climbs against nothing
for (const line of ACHIEVEMENT_LINES) {
  if (!Object.hasOwn(LINE_ASKS, line)) {
    throw new Error(`Achievement line ${line} needs a row in achievements.yaml`);
  }
}

/**
 * The type lines: one per Gen 1 type, counting lifetime catches of
 * that type, dual-types counting for both
 */
export const ACHIEVEMENT_TYPES: Types[] = idsOf<Types>(
  TYPE_IDS,
  written.types,
  'achievements.yaml: types',
);

export const TYPE_TIERS: Thresholds = written['type-tiers'];

/**
 * The trainer lines: one per **trade** rather than per class, so both
 * regions' Swimmers climb the same line and pay the same title
 */
export const ACHIEVEMENT_TRAINERS: TrainerClass[] = TRAINER_TRADES;

export const TRAINER_TIERS: Thresholds = written['trainer-tiers'];

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
  /** One per trade: both regions' Swimmers on one line */
  trainers: Map<TrainerClass, AchievementStanding>;
  /**
   * And one per class, which nothing is shown for: it is what says
   * whether a region's own coats are worn yet
   */
  variants: Map<TrainerClass, AchievementStanding>;
}

/**
 * Every standing at once, pure over the counters: what the server
 * reads for the shelf and what the title check re-derives
 */
export function deriveAchievements(counters: Counters): Achievements {
  const lines = new Map<AchievementLine, AchievementStanding>();
  const types = new Map<Types, AchievementStanding>();
  const trainers = new Map<TrainerClass, AchievementStanding>();
  const variants = new Map<TrainerClass, AchievementStanding>();

  for (const line of ACHIEVEMENT_LINES) {
    lines.set(line, standingOf(lineCount(counters, LINE_ASKS[line]), LINE_TIERS[line]));
  }

  const caught = typeCounts(counters);

  for (const type of ACHIEVEMENT_TYPES) {
    types.set(type, standingOf(caught.get(type) ?? 0, TYPE_TIERS));
  }

  const beaten = counters.get(Metric.TrainerWins) ?? new Map<number, number>();

  for (const trainer of TRAINER_CLASSES) {
    variants.set(trainer, standingOf(beaten.get(trainer) ?? 0, TRAINER_TIERS));
  }
  for (const trade of ACHIEVEMENT_TRAINERS) {
    // The trade's own count is every region's put together
    let beatenAcross = 0;

    for (const trainer of getTradeClasses(trade)) {
      beatenAcross += beaten.get(trainer) ?? 0;
    }

    trainers.set(trade, standingOf(beatenAcross, TRAINER_TIERS));
  }
  return { lines, types, trainers, variants };
}
