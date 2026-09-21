import { Foe, Landmark, Metric } from '../../auth/quest-record';
import AleaRNG from '../../core/alea';
import type Families from '../ids/families';
import { Items } from '../ids/items';
import { getSpeciesLairs } from '../overworld/lair';
import { getRegisteredFamilies } from '../species/__create';
import { getFamilyName, getRegisteredSpecies, getSpeciesData } from '../species';
import { getFeaturedFamily } from '../species/day';
import { type MetricRequirement, RequirementKind } from './index';

/**
 * The rotating quests: a fresh set of dailies every day and one hunt a
 * week, derived from the date the way the species day is, so nothing
 * is stored to rotate. Progress is the same lifetime counters measured
 * from a baseline the server snapshots when the window first sees the
 * player.
 *
 * The date is the **player's**, so every function here takes a local
 * timestamp (`toLocalTime(now, offset)`) and reads it as UTC, the way
 * `getTimeOfDay` does. A day that turns over mid-morning because the
 * server's day did is a day that means nothing to the player standing
 * in it.
 */

export interface RotationReward {
  item: Items;
  amount: number;
}

export interface RotationQuest {
  slot: number;
  name: string;
  requirement: MetricRequirement;
  rewards: RotationReward[];
}

export const DAILY_SLOTS = 3;

const DAY = 24 * 60 * 60 * 1000;

/** Two digits, so one window key sorts against the next */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The daily window's key: the player's date, same rollover as their species day */
export function dailyWindow(local: number): string {
  const date = new Date(local);

  return `d${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The weekly window's key: the ISO week the player's date falls in */
export function weeklyWindow(local: number): string {
  const date = new Date(local);
  // ISO weeks belong to the year of their Thursday
  const nearest = new Date(date.getTime() + (4 - (date.getUTCDay() || 7)) * DAY);
  const opening = Date.UTC(nearest.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((nearest.getTime() - opening) / DAY + 1) / 7);

  return `w${nearest.getUTCFullYear()}-${pad(week)}`;
}

function ask(metric: Metric, count: number, rest?: Partial<MetricRequirement>): MetricRequirement {
  return { kind: RequirementKind.Counter, metric, count, ...rest };
}

/** The pool the third daily slot draws from, one per day by seed */
const DAILY_POOL: [name: string, requirement: MetricRequirement, rewards: RotationReward[]][] = [
  [
    'Roadside Challenge',
    ask(Metric.BattleWins, 1, { foe: Foe.Trainer }),
    [{ item: Items.HyperPotion, amount: 2 }],
  ],
  ['Local Rounds', ask(Metric.NpcVisits, 1), [{ item: Items.SuperPotion, amount: 2 }]],
  // Named to a kind: "claim 3 landmarks" counted caches, patches,
  // nests and portal crossings alike, which told a player to go and do
  // something without saying what
  [
    "Forager's Rounds",
    ask(Metric.Landmarks, 3, { landmark: Landmark.Cache }),
    [{ item: Items.GreatBall, amount: 3 }],
  ],
  ['Well Supplied', ask(Metric.ItemUses, 3), [{ item: Items.UltraBall, amount: 1 }]],
  ['Answer the Siren', ask(Metric.RaidRuns, 1), [{ item: Items.HyperPotion, amount: 3 }]],
];

/**
 * Today's three: the featured family's catch where the calendar
 * names one, a walk, and one drawn from the pool
 */
export function getDailyQuests(local: number): RotationQuest[] {
  const featured = getFeaturedFamily(local);
  const spotlight: RotationQuest =
    featured == null
      ? {
          slot: 0,
          name: 'Fresh Catches',
          requirement: ask(Metric.Catches, 3),
          rewards: [{ item: Items.PokeBall, amount: 5 }],
        }
      : {
          slot: 0,
          name: `Featured: ${getFamilyName(featured)}`,
          requirement: ask(Metric.Catches, 2, { family: featured }),
          rewards: [
            { item: Items.RareCandy, amount: 1 },
            { item: Items.PokeBall, amount: 5 },
          ],
        };

  const rng = new AleaRNG(`daily${dailyWindow(local)}`);
  const [name, requirement, rewards] = DAILY_POOL[Math.floor(rng.random() * DAILY_POOL.length)];

  return [
    spotlight,
    {
      slot: 1,
      name: 'Daily Stroll',
      requirement: ask(Metric.Steps, 3000),
      rewards: [{ item: Items.SitrusBerry, amount: 2 }],
    },
    { slot: 2, name, requirement, rewards },
  ];
}

/**
 * The families the hunt may call: everything registered except the
 * lair-bound, since a legendary is a raid's to give
 */
function huntFamilies(): Families[] {
  const lairbound = new Set<Families>();

  for (const species of getRegisteredSpecies()) {
    if (getSpeciesLairs(species).length > 0) {
      lairbound.add(getSpeciesData(species).family);
    }
  }

  const families: Families[] = [];

  for (const family of getRegisteredFamilies()) {
    if (!lairbound.has(family)) {
      families.push(family);
    }
  }
  return families;
}

/** This week's bounty: 5 catches from one seeded family line */
export function getWeeklyHunt(local: number): RotationQuest {
  const pool = huntFamilies();
  const rng = new AleaRNG(`hunt${weeklyWindow(local)}`);
  const family = pool[Math.floor(rng.random() * pool.length)];

  return {
    slot: 0,
    name: `The ${getFamilyName(family)} Hunt`,
    requirement: ask(Metric.Catches, 5, { family }),
    rewards: [
      { item: Items.RareCandy, amount: 2 },
      { item: Items.Nugget, amount: 1 },
    ],
  };
}
