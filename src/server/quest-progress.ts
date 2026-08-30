import 'server-only';
import type { Metric } from '../auth/quest-record';
import { getSql } from './db';
import { asNumber, asRecord } from './read';

/**
 * The lifetime counters quests read. They are bumped where the action
 * actually happens and never read back on the hot path, so a bump
 * must never break the play that earned it: failures are swallowed.
 * A bump lost to a crash is a step nobody counted, which the next
 * step makes up for; requirements are totals, not events.
 */

export type ProgressBump = [metric: Metric, param: number, count: number];

export async function bumpProgress(uid: string, bumps: ProgressBump[]): Promise<void> {
  // Merged before it is sent, for two reasons: one statement rather
  // than one per counter, and `on conflict do update` refuses a
  // command that would touch the same row twice
  const totals = new Map<
    string,
    { player: string; metric: number; param: number; count: number }
  >();

  for (const [metric, param, count] of bumps) {
    if (count <= 0) {
      continue;
    }
    const key = `${metric}:${param}`;
    const held = totals.get(key);

    if (held == null) {
      totals.set(key, { player: uid, metric, param, count });
    } else {
      held.count += count;
    }
  }

  if (totals.size === 0) {
    return;
  }
  const rows = [...totals.values()];

  try {
    await getSql()`
      insert into quest_progress ${getSql()(rows, 'player', 'metric', 'param', 'count')}
      on conflict (player, metric, param)
      do update set count = quest_progress.count + excluded.count
    `;
  } catch {
    // Counted or not, the action itself already happened
  }
}

/**
 * Mark a fact rather than add to a count: the row is written at 1
 * once and never touched again, so the metric's total is how many
 * distinct params were ever marked. Swallowed the way a bump is
 */
export async function markProgress(uid: string, metric: Metric, param: number): Promise<void> {
  try {
    await getSql()`
      insert into quest_progress (player, metric, param, count)
      values (${uid}, ${metric}, ${param}, 1)
      on conflict (player, metric, param) do nothing
    `;
  } catch {
    // Marked or not, the visit itself already happened
  }
}

/** Every counter this player has, as metric -> param -> count */
export async function readProgress(uid: string): Promise<Map<Metric, Map<number, number>>> {
  const rows = await getSql()`
    select metric, param, count from quest_progress where player = ${uid}
  `;
  const held = new Map<Metric, Map<number, number>>();

  for (const entry of rows) {
    const row = asRecord(entry);
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const metric = asNumber(row.metric) as Metric;
    const inner = held.get(metric) ?? new Map<number, number>();

    inner.set(asNumber(row.param), asNumber(row.count));
    held.set(metric, inner);
  }
  return held;
}

/**
 * Where a quest's counters stood when it opened, as quest to slot to
 * value.
 *
 * A requirement reads the lifetime counter, so a quest waiting behind
 * a prerequisite would otherwise arrive already part-done off a
 * player's whole history. Measuring from a baseline written at the
 * moment the quest opened is what makes it a task rather than a
 * receipt. `slot` is the requirement's index within the quest
 */
export async function readQuestBaselines(uid: string): Promise<Map<number, Map<number, number>>> {
  const rows = await getSql()`
    select quest, slot, baseline from quest_baselines where player = ${uid}
  `;
  const held = new Map<number, Map<number, number>>();

  for (const entry of rows) {
    const row = asRecord(entry);
    const quest = asNumber(row.quest);
    const inner = held.get(quest) ?? new Map<number, number>();

    inner.set(asNumber(row.slot), asNumber(row.baseline));
    held.set(quest, inner);
  }
  return held;
}

/**
 * Open a quest's counters at where they stand now. Keep-first, so the
 * line is drawn once: a second unlock, a racing board read, or a
 * replayed claim all agree on whichever landed
 */
export async function openQuestBaselines(
  uid: string,
  quest: number,
  slots: [slot: number, baseline: number][],
): Promise<Map<number, number>> {
  if (slots.length > 0) {
    const rows = slots.map(([slot, baseline]) => ({ player: uid, quest, slot, baseline }));

    await getSql()`
      insert into quest_baselines ${getSql()(rows, 'player', 'quest', 'slot', 'baseline')}
      on conflict (player, quest, slot) do nothing
    `;
  }

  // Read back rather than trusting what was offered: a racing writer
  // may have drawn the line first, and theirs is the one that counts
  const rows = await getSql()`
    select slot, baseline from quest_baselines where player = ${uid} and quest = ${quest}
  `;

  return new Map(
    rows.map((row) => [asNumber(asRecord(row).slot), asNumber(asRecord(row).baseline)]),
  );
}
