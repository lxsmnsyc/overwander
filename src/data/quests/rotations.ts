import { Foe, Landmark, Metric } from '../../auth/quest-record';
import AleaRNG from '../../core/alea';
import type Families from '../ids/families';
import { Items } from '../ids/items';
import { getSpeciesLair } from '../overworld/lair';
import { getRegisteredFamilies } from '../species/__create';
import { getFamilyName, getRegisteredSpecies, getSpeciesData } from '../species';
import { getFeaturedFamily } from '../species/day';
import { type MetricRequirement, RequirementKind } from './index';

/**
 * The rotating quests: a fresh set of dailies every UTC day and one
 * hunt a week, derived from the date the way the species day is, so
 * every player faces the same board and nothing is stored to rotate.
 * Progress is the same lifetime counters measured from a baseline the
 * server snapshots when the window first sees the player.
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

/** The daily window's key: the UTC date, same rollover as the species day */
export function dailyWindow(now: number): string {
  const date = new Date(now);

  return `d${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

/** The weekly window's key: the ISO week, read in UTC */
export function weeklyWindow(now: number): string {
  const date = new Date(now);
  // ISO weeks belong to the year of their Thursday
  const nearest = new Date(date.getTime() + (4 - (date.getUTCDay() || 7)) * DAY);
  const opening = Date.UTC(nearest.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((nearest.getTime() - opening) / DAY + 1) / 7);

  return `w${nearest.getUTCFullYear()}-${week}`;
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
export function getDailyQuests(now: number): RotationQuest[] {
  const featured = getFeaturedFamily(now);
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

  const rng = new AleaRNG(`daily${dailyWindow(now)}`);
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
  const lairbound = new Set(
    getRegisteredSpecies()
      .filter((species) => getSpeciesLair(species) != null)
      .map((species) => getSpeciesData(species).family),
  );

  return getRegisteredFamilies().filter((family) => !lairbound.has(family));
}

/** This week's bounty: 5 catches from one seeded family line */
export function getWeeklyHunt(now: number): RotationQuest {
  const pool = huntFamilies();
  const rng = new AleaRNG(`hunt${weeklyWindow(now)}`);
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
