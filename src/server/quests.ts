import 'server-only';
import type { Metric, QuestStanding, RequirementStanding } from '../auth/quest-record';
import { GiftKind } from '../auth/gift-record';
import { ITEM_STACKS } from '../auth/stacks';
import { Balls } from '../data/ids/items';
import type { EncounterRecord } from '../auth/encounter-record';
import {
  type DexRequirement,
  QUESTS,
  QUEST_ORDER,
  type QuestData,
  type QuestRequirement,
  type QuestReward,
  QuestRewardKind,
  type Quests,
  RequirementKind,
  type TurnInRequirement,
  getQuestData,
  prerequisiteOf,
  successorOf,
} from '../data/quests';
import type Regions from '../data/ids/regions';
import { defaultSlots } from '../data/constants/slots';
import type { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import { grantNestEgg } from './eggs';
import {
  type GiftClaim,
  type StaffGift,
  claimMysteryGift,
  giftId,
  giftPlace,
  makeGiftOffer,
  offer,
} from './gifts';
import { recordAwardWin } from './awards';
import { readCaughtDexCount } from './pokedex';
import { openQuestBaselines, readProgress, readQuestBaselines } from './quest-progress';
import { getSql, tx } from './db';
import { readStack, readStackIn, spendStackIn } from './stacks';
import { asNumber, asRecord } from './read';

/**
 * The quests: requirements read off the lifetime counters, rewards
 * paid through the gift machinery under fixed per-quest ids, and one
 * claim row that makes each pay exactly once.
 */

/** What one requirement is asking of the counters or the bag */
export type Counters = Map<Metric, Map<number, number>>;

export function countOf(counters: Counters, requirement: QuestRequirement): number {
  if (requirement.kind !== RequirementKind.Counter) {
    // The bag and the dex are read by the caller; this path never runs
    return 0;
  }

  const held = counters.get(requirement.metric) ?? new Map<number, number>();

  if (requirement.species != null) {
    return held.get(requirement.species) ?? 0;
  }
  if (requirement.item != null) {
    return held.get(requirement.item) ?? 0;
  }
  if (requirement.npc != null) {
    return held.get(requirement.npc) ?? 0;
  }
  if (requirement.landmark != null) {
    return held.get(requirement.landmark) ?? 0;
  }
  if (requirement.move != null) {
    return held.get(requirement.move) ?? 0;
  }
  if (requirement.foe != null) {
    return held.get(requirement.foe) ?? 0;
  }

  let total = 0;

  for (const [param, count] of held) {
    if (requirement.family != null || requirement.type != null) {
      // The params under a catches metric are species; the family and
      // the type are both facts about the species, so membership is
      // asked of the registry rather than stored
      if (param < 0) {
        continue;
      }
      try {
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        const species = getSpeciesData(param as Species);

        if (requirement.family != null && species.family !== requirement.family) {
          continue;
        }
        if (requirement.type != null && !species.types.some((one) => one === requirement.type)) {
          continue;
        }
      } catch {
        continue;
      }
    }
    total += count;
  }
  return total;
}

/**
 * What one quest's counters read as, measured from where they stood
 * when the quest opened.
 *
 * Only a quest behind a prerequisite is measured: one at the head of
 * its chain has been open as long as the account has, so its counters
 * are its own from the first step. The line is drawn on first sight
 * as well as at the unlock itself, which is what carries a quest that
 * was already unlocked when this arrived
 */
async function baselinedCounts(
  uid: string,
  quest: Quests,
  requirements: QuestRequirement[],
  counters: Counters,
  stored: Map<number, Map<number, number>>,
): Promise<Map<number, number>> {
  if (prerequisiteOf(quest) == null) {
    return new Map();
  }

  const held = stored.get(quest) ?? new Map<number, number>();
  const missing: [number, number][] = [];

  for (const [slot, requirement] of requirements.entries()) {
    if (requirement.kind !== RequirementKind.Counter || held.has(slot)) {
      continue;
    }
    missing.push([slot, countOf(counters, requirement)]);
  }
  if (missing.length === 0) {
    return held;
  }

  const opened = await openQuestBaselines(uid, quest, missing);

  stored.set(quest, opened);
  return opened;
}

/** One counter requirement's standing, net of the quest's baseline */
function progressOf(
  counters: Counters,
  requirement: QuestRequirement,
  slot: number,
  baselines: Map<number, number>,
): number {
  return Math.max(0, countOf(counters, requirement) - (baselines.get(slot) ?? 0));
}

/** The name under which one quest's one reward rides the gift rows */
function questGiftId(uid: string, quest: Quests, at: number): string {
  return giftId(`quest-${quest}-${at}`, uid);
}

/** A reward as the staff-gift shape the gift machinery pays out */
function asGiftSpec(uid: string, data: QuestData, reward: QuestReward): StaffGift | null {
  const common = { reason: `Quest: ${data.name}.`, player: uid, expiresAt: null };

  if (reward.kind === QuestRewardKind.Item) {
    return { ...common, kind: GiftKind.Item, item: reward.item, amount: reward.amount };
  }
  if (reward.kind === QuestRewardKind.Egg || reward.kind === QuestRewardKind.Award) {
    return null;
  }

  const pokemon = {
    ...common,
    species: reward.species,
    level: reward.level,
    shiny: reward.shiny === true,
    shadow: false,
    gender: null,
    nature: null,
    ivs: null,
    abilities: [],
    moves: [],
    items: [],
    place: '',
    slots: defaultSlots(),
  };

  if (reward.kind === QuestRewardKind.Catch) {
    return { ...pokemon, kind: GiftKind.Catch, ball: reward.ball ?? Balls.PokeBall, owner: '' };
  }
  return { ...pokemon, kind: GiftKind.Encounter };
}

async function readClaims(uid: string): Promise<Set<Quests>> {
  const rows = await getSql()`select quest from quest_claims where player = ${uid}`;

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return new Set(rows.map((row) => asNumber(asRecord(row).quest) as Quests));
}

/**
 * Every quest this player can see, in list order: unlocked means its
 * chain predecessor is claimed. Requirements come back with where the
 * player stands on each
 */
export async function listQuests(uid: string): Promise<QuestStanding[]> {
  const [counters, claims, baselines] = await Promise.all([
    readProgress(uid),
    readClaims(uid),
    readQuestBaselines(uid),
  ]);
  const standings: QuestStanding[] = [];
  // One dex query per region asked about, however many quests ask
  const dexCounts = new Map<number, number>();
  const dexOf = async (region?: Regions): Promise<number> => {
    const key = region ?? -1;
    const held = dexCounts.get(key);

    if (held != null) {
      return held;
    }

    const count = await readCaughtDexCount(uid, region);

    dexCounts.set(key, count);
    return count;
  };

  for (const quest of QUEST_ORDER) {
    const data = QUESTS[quest];
    const before = prerequisiteOf(quest);

    if (before != null && !claims.has(before)) {
      continue;
    }

    const requirements: RequirementStanding[] = [];
    const opened = await baselinedCounts(uid, quest, data.requirements, counters, baselines);

    for (const [slot, requirement] of data.requirements.entries()) {
      let have: number;

      if (requirement.kind === RequirementKind.TurnIn) {
        have = await readStack(ITEM_STACKS, uid, requirement.item);
      } else if (requirement.kind === RequirementKind.Dex) {
        have = await dexOf(requirement.region);
      } else {
        have = progressOf(counters, requirement, slot, opened);
      }

      requirements.push({ requirement, have, met: have >= requirement.count });
    }

    standings.push({
      quest,
      claimed: claims.has(quest),
      claimable: !claims.has(quest) && requirements.every((one) => one.met),
      requirements,
    });
  }
  return standings;
}

/** What claiming paid, for the screen to say and stage */
export interface QuestPayout {
  rewards: QuestReward[];
  /** The staged meeting, for a reward that is one */
  encounter: EncounterRecord | null;
  /** The egg's new catch id, for a reward that is one */
  egg: string | null;
}

/**
 * Claim one quest.
 *
 * The requirements are re-read here rather than trusted, the turn-ins
 * leave the bag in the same transaction the claim row lands in, and
 * the rewards ride the gift machinery under fixed ids, so a second
 * press or a crashed retry pays nothing twice. Resolves null when the
 * quest is unknown, locked, unmet or already claimed
 */
export async function claimQuest(
  uid: string,
  quest: Quests,
  now: number,
  offset: number,
  locale: string,
): Promise<QuestPayout | null> {
  const data = getQuestData(quest);

  if (data == null) {
    return null;
  }

  const claims = await readClaims(uid);
  const before = prerequisiteOf(quest);

  if (claims.has(quest) || (before != null && !claims.has(before))) {
    return null;
  }

  const [counters, baselines] = await Promise.all([readProgress(uid), readQuestBaselines(uid)]);
  const opened = await baselinedCounts(uid, quest, data.requirements, counters, baselines);
  const turnIns = data.requirements.filter(
    (one): one is TurnInRequirement => one.kind === RequirementKind.TurnIn,
  );
  const metricsMet = data.requirements.every(
    (one, slot) =>
      one.kind !== RequirementKind.Counter || progressOf(counters, one, slot, opened) >= one.count,
  );

  if (!metricsMet) {
    return null;
  }

  const dexAsks = data.requirements.filter(
    (one): one is DexRequirement => one.kind === RequirementKind.Dex,
  );

  for (const dexAsk of dexAsks) {
    if ((await readCaughtDexCount(uid, dexAsk.region)) < dexAsk.count) {
      return null;
    }
  }

  // The claim row and the turn-ins land together: a bag short of one
  // berry claims nothing and spends nothing
  const taken = await tx(async (transaction) => {
    for (const turnIn of turnIns) {
      const held = await readStackIn(transaction, ITEM_STACKS, uid, turnIn.item);

      if (!(await spendStackIn(transaction, ITEM_STACKS, uid, turnIn.item, held, turnIn.count))) {
        return false;
      }
    }

    const claimed = await transaction`
      insert into quest_claims (player, quest, claimed_at)
      values (${uid}, ${quest}, ${now})
      on conflict do nothing
    `;

    return claimed.count > 0;
  });

  if (!taken) {
    return null;
  }

  // Rewards ride the gift rows under fixed ids: offered idempotently,
  // then claimed straight through, so what a quest paid is readable on
  // the ledger afterwards
  let encounter: EncounterRecord | null = null;
  let egg: string | null = null;

  for (const [at, reward] of data.rewards.entries()) {
    if (reward.kind === QuestRewardKind.Egg) {
      egg = await grantNestEgg(
        uid,
        giftPlace(now),
        100000 + quest,
        reward.species,
        now,
        offset,
        locale,
      );
      continue;
    }
    // A shelf award is earned in place rather than ridden through the
    // gift rows; the claim row above already makes this pay once
    if (reward.kind === QuestRewardKind.Award) {
      await recordAwardWin(uid, reward.award, now);
      continue;
    }

    const spec = asGiftSpec(uid, data, reward);

    if (spec == null) {
      continue;
    }

    const id = questGiftId(uid, quest, at);

    await offer(uid, [makeGiftOffer(spec, id, now)], now);

    const paid: GiftClaim | null = await claimMysteryGift(uid, id, now, offset, locale);

    if (paid?.encounter != null) {
      encounter = paid.encounter;
    }
  }

  // The next quest in the chain starts counting here, rewards and all:
  // a pokemon this claim just handed over is not one the player went
  // and caught. Read fresh, since the rewards above moved counters
  await openBaselinesFor(uid, successorOf(quest));

  return { rewards: data.rewards, encounter, egg };
}

/**
 * Draw the line a newly unlocked quest counts from. Keep-first, so an
 * unlock that already happened keeps the line it was given
 */
async function openBaselinesFor(uid: string, quest: Quests | null): Promise<void> {
  if (quest == null) {
    return;
  }

  const counters = await readProgress(uid);
  const slots: [number, number][] = [];

  for (const [slot, requirement] of QUESTS[quest].requirements.entries()) {
    if (requirement.kind === RequirementKind.Counter) {
      slots.push([slot, countOf(counters, requirement)]);
    }
  }
  await openQuestBaselines(uid, quest, slots);
}
