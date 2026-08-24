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
  const rows = bumps.filter(([, , count]) => count > 0);

  if (rows.length === 0) {
    return;
  }
  try {
    for (const [metric, param, count] of rows) {
      await getSql()`
        insert into quest_progress (player, metric, param, count)
        values (${uid}, ${metric}, ${param}, ${count})
        on conflict (player, metric, param)
        do update set count = quest_progress.count + ${count}
      `;
    }
  } catch {
    // Counted or not, the action itself already happened
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
