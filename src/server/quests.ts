import 'server-only';
import type { Metric, QuestStanding, RequirementStanding } from '../auth/quest-record';
import { GiftKind } from '../auth/gift-record';
import { ITEM_STACKS } from '../auth/stacks';
import { Balls } from '../data/ids/items';
import type { EncounterRecord } from '../auth/encounter-record';
import {
  QUESTS,
  QUEST_ORDER,
  type QuestData,
  type QuestRequirement,
  type QuestReward,
  QuestRewardKind,
  type Quests,
  RequirementKind,
  type TurnInRequirement,
  prerequisiteOf,
} from '../data/quests';
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
import { readCaughtDexCount } from './pokedex';
import { readProgress } from './quest-progress';
import { getSql, tx } from './db';
import { readStack, readStackIn, spendStackIn } from './stacks';
import { asNumber, asRecord } from './read';

/**
 * The quests: requirements read off the lifetime counters, rewards
 * paid through the gift machinery under fixed per-quest ids, and one
 * claim row that makes each pay exactly once.
 */

/** What one requirement is asking of the counters or the bag */
type Counters = Map<Metric, Map<number, number>>;

function countOf(counters: Counters, requirement: QuestRequirement): number {
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
  if (reward.kind === QuestRewardKind.Egg) {
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
  const [counters, claims, dex] = await Promise.all([
    readProgress(uid),
    readClaims(uid),
    readCaughtDexCount(uid),
  ]);
  const standings: QuestStanding[] = [];

  for (const quest of QUEST_ORDER) {
    const data = QUESTS[quest];
    const before = prerequisiteOf(quest);

    if (before != null && !claims.has(before)) {
      continue;
    }

    const requirements: RequirementStanding[] = [];

    for (const requirement of data.requirements) {
      let have: number;

      if (requirement.kind === RequirementKind.TurnIn) {
        have = await readStack(ITEM_STACKS, uid, requirement.item);
      } else if (requirement.kind === RequirementKind.Dex) {
        have = dex;
      } else {
        have = countOf(counters, requirement);
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
  const data = QUESTS[quest] as QuestData | undefined;

  if (data == null) {
    return null;
  }

  const claims = await readClaims(uid);
  const before = prerequisiteOf(quest);

  if (claims.has(quest) || (before != null && !claims.has(before))) {
    return null;
  }

  const counters = await readProgress(uid);
  const turnIns = data.requirements.filter(
    (one): one is TurnInRequirement => one.kind === RequirementKind.TurnIn,
  );
  const metricsMet = data.requirements
    .filter((one) => one.kind === RequirementKind.Counter)
    .every((one) => countOf(counters, one) >= one.count);

  if (!metricsMet) {
    return null;
  }

  const dexAsks = data.requirements.filter((one) => one.kind === RequirementKind.Dex);

  if (dexAsks.length > 0) {
    const dex = await readCaughtDexCount(uid);

    if (dexAsks.some((one) => dex < one.count)) {
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
  return { rewards: data.rewards, encounter, egg };
}
