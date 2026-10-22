import * as v from 'valibot';
import type { Foe, Landmark, Metric } from '../../model/quest-record';
import type Awards from '../ids/awards';
import type { Types } from '../constants/types';
import type Families from '../ids/families';
import type { Balls, Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import {
  AWARD_IDS,
  BALL_IDS,
  CHAIN_IDS,
  FAMILY_IDS,
  FOE_IDS,
  ITEM_IDS,
  METRIC_IDS,
  MOVE_IDS,
  NPC_IDS,
  QUEST_IDS,
  QUEST_LANDMARK_IDS,
  REGION_IDS,
  SPECIES_IDS,
  TRAINER_IDS,
  TYPE_IDS,
} from '../ids/names';
import type Npc from '../ids/npcs';
import type Regions from '../ids/regions';
import type { Species } from '../ids/species';
import type TrainerClass from '../ids/trainers';
import namesFile from '../text/en/quests.yaml';
import { idOf } from '../yaml';
import dailyFile from './daily.yaml';
import questsFile from './quests.yaml';
import {
  type ChainData,
  type Chains,
  type MetricRequirement,
  type QuestData,
  type QuestRequirement,
  type QuestReward,
  QuestRewardKind,
  type Quests,
  RequirementKind,
} from './types';

/**
 * The written quests and the daily pool, out of `quests.yaml`,
 * `daily.yaml` and `text/en/quests.yaml`
 */

const NAME = v.string();
const COUNT = v.number();

const COUNTER = v.strictObject({
  metric: NAME,
  count: COUNT,
  species: v.optional(NAME),
  family: v.optional(NAME),
  type: v.optional(NAME),
  item: v.optional(NAME),
  npc: v.optional(NAME),
  landmark: v.optional(NAME),
  move: v.optional(NAME),
  foe: v.optional(NAME),
  trainer: v.optional(NAME),
});

const REQUIREMENT = v.union([
  COUNTER,
  v.strictObject({ dex: COUNT, region: v.optional(NAME) }),
  v.strictObject({ 'turn-in': NAME, count: COUNT }),
]);

const REWARD = v.union([
  v.strictObject({ item: NAME, amount: COUNT }),
  v.strictObject({
    catch: NAME,
    level: COUNT,
    shiny: v.optional(v.boolean()),
    ball: v.optional(NAME),
  }),
  v.strictObject({ encounter: NAME, level: COUNT, shiny: v.optional(v.boolean()) }),
  v.strictObject({ egg: NAME }),
  v.strictObject({ award: NAME }),
]);

const QUESTS_FILE = v.strictObject({
  chains: v.record(NAME, v.array(NAME)),
  quests: v.record(
    NAME,
    v.strictObject({ requirements: v.array(REQUIREMENT), rewards: v.array(REWARD) }),
  ),
});

const DAILY_FILE = v.record(
  NAME,
  v.strictObject({
    requirement: COUNTER,
    rewards: v.array(v.strictObject({ item: NAME, amount: COUNT })),
  }),
);

const NAMES_FILE = v.strictObject({
  chains: v.record(NAME, v.string()),
  quests: v.record(NAME, v.string()),
  daily: v.record(NAME, v.string()),
});

/** A counter requirement and its narrowing */
function readCounter(written: v.InferOutput<typeof COUNTER>, where: string): MetricRequirement {
  const requirement: MetricRequirement = {
    kind: RequirementKind.Counter,
    metric: idOf<Metric>(METRIC_IDS, written.metric, where),
    count: written.count,
  };

  // At most one narrowing is written, so the order they are read in is moot
  if (written.species != null) {
    requirement.species = idOf<Species>(SPECIES_IDS, written.species, where);
  }
  if (written.family != null) {
    requirement.family = idOf<Families>(FAMILY_IDS, written.family, where);
  }
  if (written.type != null) {
    requirement.type = idOf<Types>(TYPE_IDS, written.type, where);
  }
  if (written.item != null) {
    requirement.item = idOf<Items>(ITEM_IDS, written.item, where);
  }
  if (written.npc != null) {
    requirement.npc = idOf<Npc>(NPC_IDS, written.npc, where);
  }
  if (written.landmark != null) {
    requirement.landmark = idOf<Landmark>(QUEST_LANDMARK_IDS, written.landmark, where);
  }
  if (written.move != null) {
    requirement.move = idOf<Moves>(MOVE_IDS, written.move, where);
  }
  if (written.foe != null) {
    requirement.foe = idOf<Foe>(FOE_IDS, written.foe, where);
  }
  if (written.trainer != null) {
    requirement.trainer = idOf<TrainerClass>(TRAINER_IDS, written.trainer, where);
  }
  return requirement;
}

function readRequirement(
  written: v.InferOutput<typeof REQUIREMENT>,
  where: string,
): QuestRequirement {
  if ('metric' in written) {
    return readCounter(written, where);
  }
  if ('dex' in written) {
    return written.region == null
      ? { kind: RequirementKind.Dex, count: written.dex }
      : {
          kind: RequirementKind.Dex,
          count: written.dex,
          region: idOf<Regions>(REGION_IDS, written.region, where),
        };
  }
  return {
    kind: RequirementKind.TurnIn,
    item: idOf<Items>(ITEM_IDS, written['turn-in'], where),
    count: written.count,
  };
}

function readReward(written: v.InferOutput<typeof REWARD>, where: string): QuestReward {
  if ('item' in written) {
    return {
      kind: QuestRewardKind.Item,
      item: idOf<Items>(ITEM_IDS, written.item, where),
      amount: written.amount,
    };
  }
  if ('catch' in written) {
    const reward: QuestReward = {
      kind: QuestRewardKind.Catch,
      species: idOf<Species>(SPECIES_IDS, written.catch, where),
      level: written.level,
    };

    if (written.shiny != null) {
      reward.shiny = written.shiny;
    }
    if (written.ball != null) {
      reward.ball = idOf<Balls>(BALL_IDS, written.ball, where);
    }
    return reward;
  }
  if ('encounter' in written) {
    const reward: QuestReward = {
      kind: QuestRewardKind.Encounter,
      species: idOf<Species>(SPECIES_IDS, written.encounter, where),
      level: written.level,
    };

    if (written.shiny != null) {
      reward.shiny = written.shiny;
    }
    return reward;
  }
  if ('egg' in written) {
    return { kind: QuestRewardKind.Egg, species: idOf<Species>(SPECIES_IDS, written.egg, where) };
  }
  return { kind: QuestRewardKind.Award, award: idOf<Awards>(AWARD_IDS, written.award, where) };
}

/** The name a file keys something by, or a clear failure where text/en has none */
function nameOf(names: Record<string, string>, key: string, where: string): string {
  if (!Object.hasOwn(names, key)) {
    throw new Error(`${where} needs a name in text/en/quests.yaml`);
  }
  return names[key];
}

const names = v.parse(NAMES_FILE, namesFile);
const written = v.parse(QUESTS_FILE, questsFile);

export const WRITTEN_CHAINS: Record<number, ChainData> = {};

/** The written chains, in the order the board shows them */
export const WRITTEN_CHAIN_ORDER: Chains[] = [];

export const WRITTEN_QUESTS: Record<number, QuestData> = {};

for (const [name, quest] of Object.entries(written.quests)) {
  const where = `quests.yaml: ${name}`;
  const requirements: QuestRequirement[] = [];
  const rewards: QuestReward[] = [];

  for (const requirement of quest.requirements) {
    requirements.push(readRequirement(requirement, where));
  }
  for (const reward of quest.rewards) {
    rewards.push(readReward(reward, where));
  }
  WRITTEN_QUESTS[idOf<Quests>(QUEST_IDS, name, where)] = {
    name: nameOf(names.quests, name, where),
    requirements,
    rewards,
  };
}

for (const [name, members] of Object.entries(written.chains)) {
  const where = `quests.yaml: chains: ${name}`;
  const chain = idOf<Chains>(CHAIN_IDS, name, where);
  const quests: Quests[] = [];

  for (const member of members) {
    const quest = idOf<Quests>(QUEST_IDS, member, where);

    if (!Object.hasOwn(WRITTEN_QUESTS, quest)) {
      throw new Error(`${where}: ${member} is not a written quest`);
    }
    quests.push(quest);
  }
  WRITTEN_CHAINS[chain] = { name: nameOf(names.chains, name, where), quests };
  WRITTEN_CHAIN_ORDER.push(chain);
}

// Every written quest and chain the enums have is written down
for (const [name, quest] of Object.entries(QUEST_IDS)) {
  if (!Object.hasOwn(WRITTEN_QUESTS, quest)) {
    throw new Error(`${name} needs a quest in quests.yaml`);
  }
}
for (const [name, chain] of Object.entries(CHAIN_IDS)) {
  if (!Object.hasOwn(WRITTEN_CHAINS, chain)) {
    throw new Error(`${name} needs a chain in quests.yaml`);
  }
}

export interface DailyQuest {
  name: string;
  requirement: MetricRequirement;
  rewards: { item: Items; amount: number }[];
}

/** The pool the third daily slot draws from, in the order the seed walks */
export const DAILY_POOL: DailyQuest[] = [];

for (const [key, daily] of Object.entries(v.parse(DAILY_FILE, dailyFile))) {
  const where = `daily.yaml: ${key}`;
  const rewards: DailyQuest['rewards'] = [];

  for (const reward of daily.rewards) {
    rewards.push({ item: idOf<Items>(ITEM_IDS, reward.item, where), amount: reward.amount });
  }
  DAILY_POOL.push({
    name: nameOf(names.daily, key, where),
    requirement: readCounter(daily.requirement, where),
    rewards,
  });
}
