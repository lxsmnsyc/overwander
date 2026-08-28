import 'server-only';
import { GiftKind } from '../auth/gift-record';
import {
  DAILY_SLOTS,
  type RotationQuest,
  type RotationReward,
  dailyWindow,
  getDailyQuests,
  getWeeklyHunt,
  weeklyWindow,
} from '../data/quests/rotations';
import { getSql } from './db';
import { claimMysteryGift, giftId, makeGiftOffer, offer } from './gifts';
import { type Counters, countOf } from './quests';
import { readProgress } from './quest-progress';
import { asNumber, asRecord } from './read';

/**
 * The rotating board, measured from baselines: the quests are the
 * date's own, and a window's progress is the lifetime counter minus
 * where it stood when the window first saw the player. The baseline
 * is written once per (window, slot) and the claim row pays once, so
 * neither a relist nor a second press moves anything
 */

export type RotationScope = 'daily' | 'weekly';

export interface RotationStanding {
  quest: RotationQuest;
  have: number;
  claimed: boolean;
  claimable: boolean;
}

export interface RotationBoard {
  daily: RotationStanding[];
  weekly: RotationStanding;
}

function windowOf(scope: RotationScope, now: number): string {
  return scope === 'daily' ? dailyWindow(now) : weeklyWindow(now);
}

function questAt(scope: RotationScope, slot: number, now: number): RotationQuest | null {
  if (scope === 'weekly') {
    return slot === 0 ? getWeeklyHunt(now) : null;
  }
  return getDailyQuests(now).find((quest) => quest.slot === slot) ?? null;
}

/** The stored baselines for one window, slot to counter value */
async function readBaselines(uid: string, window: string): Promise<Map<number, number>> {
  const rows = await getSql()`
    select slot, baseline from rotation_baselines
    where player = ${uid} and window_key = ${window}
  `;

  return new Map(
    rows.map((row) => [asNumber(asRecord(row).slot), asNumber(asRecord(row).baseline)]),
  );
}

/**
 * The baseline a slot measures from, written on first sight. The
 * write is keep-first, so a racing pair agrees on whichever landed
 */
async function baselineOf(
  uid: string,
  window: string,
  slot: number,
  current: number,
  stored: Map<number, number>,
): Promise<number> {
  const held = stored.get(slot);

  if (held != null) {
    return held;
  }
  await getSql()`
    insert into rotation_baselines (player, window_key, slot, baseline)
    values (${uid}, ${window}, ${slot}, ${current})
    on conflict (player, window_key, slot) do nothing
  `;

  const rows = await getSql()`
    select baseline from rotation_baselines
    where player = ${uid} and window_key = ${window} and slot = ${slot}
  `;

  return asNumber(rows.at(0)?.baseline);
}

async function readClaimedSlots(uid: string, window: string): Promise<Set<number>> {
  const rows = await getSql()`
    select slot from rotation_claims where player = ${uid} and window_key = ${window}
  `;

  return new Set(rows.map((row) => asNumber(asRecord(row).slot)));
}

async function standingOf(
  uid: string,
  counters: Counters,
  scope: RotationScope,
  quest: RotationQuest,
  now: number,
  stored: Map<number, number>,
  claimedSlots: Set<number>,
): Promise<RotationStanding> {
  const window = windowOf(scope, now);
  const current = countOf(counters, quest.requirement);
  const baseline = await baselineOf(uid, window, quest.slot, current, stored);
  const have = Math.max(0, current - baseline);
  const claimed = claimedSlots.has(quest.slot);

  return { quest, have, claimed, claimable: !claimed && have >= quest.requirement.count };
}

/**
 * Forget the windows that have rolled past.
 *
 * A window key is derived from the date, so yesterday's is a string
 * nothing will ever compute again: the rows under it are not stale,
 * they are unreachable. They are swept here rather than on a clock
 * because the moment they became garbage is the moment this player's
 * day turned over, and this is where that is noticed
 */
async function forgetOldWindows(uid: string, daily: string, weekly: string): Promise<void> {
  await getSql()`
    delete from rotation_baselines
    where player = ${uid} and window_key not in (${daily}, ${weekly})
  `;
  await getSql()`
    delete from rotation_claims
    where player = ${uid} and window_key not in (${daily}, ${weekly})
  `;
}

/** The whole rotating board as it stands for this player right now */
export async function listRotations(uid: string, now: number): Promise<RotationBoard> {
  const counters = await readProgress(uid);
  const today = dailyWindow(now);
  const thisWeek = weeklyWindow(now);
  const [dailyBase, weeklyBase, dailyClaims, weeklyClaims] = await Promise.all([
    readBaselines(uid, today),
    readBaselines(uid, thisWeek),
    readClaimedSlots(uid, today),
    readClaimedSlots(uid, thisWeek),
  ]);

  // Nothing written for today yet means the day just turned for this
  // player, which is the one moment a sweep is worth the statement:
  // any other read finds nothing to delete and pays for the look
  if (dailyBase.size === 0) {
    await forgetOldWindows(uid, today, thisWeek);
  }

  const daily: RotationStanding[] = [];

  for (const quest of getDailyQuests(now)) {
    daily.push(await standingOf(uid, counters, 'daily', quest, now, dailyBase, dailyClaims));
  }
  return {
    daily,
    weekly: await standingOf(
      uid,
      counters,
      'weekly',
      getWeeklyHunt(now),
      now,
      weeklyBase,
      weeklyClaims,
    ),
  };
}

/**
 * Claim one rotating quest. The requirement is re-read against the
 * baseline here, the claim row makes it pay once, and the rewards
 * ride the gift rows under window-scoped ids so a crashed retry pays
 * nothing twice. Resolves what was paid, or null when the slot is
 * unknown, unmet or already claimed
 */
export async function claimRotation(
  uid: string,
  scope: RotationScope,
  slot: number,
  now: number,
  offset: number,
  locale: string,
): Promise<RotationReward[] | null> {
  const quest = questAt(scope, slot, now);

  if (quest == null || slot < 0 || slot >= (scope === 'daily' ? DAILY_SLOTS : 1)) {
    return null;
  }

  const window = windowOf(scope, now);
  const counters = await readProgress(uid);
  const current = countOf(counters, quest.requirement);
  const stored = await readBaselines(uid, window);
  const baseline = await baselineOf(uid, window, slot, current, stored);

  if (current - baseline < quest.requirement.count) {
    return null;
  }

  const claimed = await getSql()`
    insert into rotation_claims (player, window_key, slot, claimed_at)
    values (${uid}, ${window}, ${slot}, ${now})
    on conflict do nothing
  `;

  if (claimed.count === 0) {
    return null;
  }

  const offers = quest.rewards.map((reward, at) =>
    makeGiftOffer(
      {
        reason: `${scope === 'daily' ? 'Daily' : 'Hunt'}: ${quest.name}.`,
        player: uid,
        expiresAt: null,
        kind: GiftKind.Item,
        item: reward.item,
        amount: reward.amount,
      },
      giftId(`rotation-${window}-${slot}-${at}`, uid),
      now,
    ),
  );

  await offer(uid, offers, now);

  for (const [at] of quest.rewards.entries()) {
    await claimMysteryGift(
      uid,
      giftId(`rotation-${window}-${slot}-${at}`, uid),
      now,
      offset,
      locale,
    );
  }
  return quest.rewards;
}
