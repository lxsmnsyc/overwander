import 'server-only';
import { toLocalTime } from '../auth/local-time';
import { NPC_INTERVAL } from '../overworld/chunk-snapshot';
import { WORLD_GENERATION } from '../overworld/current';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * The catches locked into this player's live dungeon runs. Mid-run the
 * only healing is the player's own medicine, so anything else that
 * mends asks here first
 */
export async function runLockedCatches(uid: string, now: number): Promise<Set<string>> {
  const rows = await getSql()`
    select window_at, utc_offset, party from dungeon_runs
    where generation = ${WORLD_GENERATION} and player = ${uid} and not cleared
      and state is not null
  `;
  const locked = new Set<string>();

  for (const row of rows) {
    if (toLocalTime(now, asNumber(row.utc_offset)) >= asNumber(row.window_at) + NPC_INTERVAL) {
      continue;
    }
    if (Array.isArray(row.party)) {
      for (const one of row.party) {
        if (typeof one === 'string') {
          locked.add(one);
        }
      }
    }
  }
  return locked;
}

/** Whether any of these catches is locked into a live run */
export async function isInLiveRun(uid: string, catches: string[], now: number): Promise<boolean> {
  if (catches.length === 0) {
    return false;
  }

  const locked = await runLockedCatches(uid, now);

  for (const one of catches) {
    if (locked.has(one)) {
      return true;
    }
  }
  return false;
}
