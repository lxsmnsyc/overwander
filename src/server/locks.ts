import 'server-only';
import BATTLE_TIMEOUT from '../auth/battle-lock';
import { asCatchSnapshot } from '../auth/catch-snapshot';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * A catch that is fighting cannot be edited. A battle stands on a
 * frozen snapshot of its party, so anything the record does in the
 * meantime (an item handed back to the bag, a level, an evolution)
 * would leave the fight and the record describing different pokemon.
 * The worst of those is the held item: a player who pulls a berry out
 * mid-raid would have it eaten in the battle and still sitting in
 * their bag afterwards.
 *
 * So a catch fielded in a battle is locked, and every write that edits
 * one refuses while the lock holds. The fight releases it when it
 * ends; the stamp it was locked at releases it anyway once the battle
 * timeout has passed, so a party walked out on does not stay held. The
 * check itself is a plain field read; no row is fetched to answer it.
 */

/**
 * Whether a catch is locked into a live battle. The clock is the
 * server's own, since a caller's idea of `now` would be a way to talk
 * a lock into looking expired
 */
export function isCatchLocked(caught: Record<string, unknown>): boolean {
  const lockedAt = asNumber(caught.locked_at ?? caught.lockedAt);

  return lockedAt > 0 && Date.now() - lockedAt < BATTLE_TIMEOUT;
}

/**
 * Whether any of the catches is locked, for callers fielding a whole
 * party at once
 */
export function isAnyCatchLocked(caught: (Record<string, unknown> | null)[]): boolean {
  return caught.some((entry) => entry != null && isCatchLocked(entry));
}

/**
 * What a catch row carries while it is fighting: the battle's own
 * `startedAt`, which is what lets the release tell this battle's lock
 * from a later one's. There is no flag beside it; a stamp of zero is
 * a free pokemon, so the stamp was always the whole of the answer
 */
export function lockFields(startedAt: number): { locked_at: number } {
  return { locked_at: startedAt };
}

/**
 * A free catch
 */
export function freeFields(): { locked_at: number } {
  return { locked_at: 0 };
}

/**
 * Release the party of a battle that has ended. Every catch the
 * battle's team snapshots name is freed, but only where its lock is
 * still *this* battle's: a pokemon whose lock has since expired and
 * been taken by another fight keeps that newer one, so a late report
 * cannot unlock a battle it has nothing to do with
 */
export async function releaseBattleLocks(battleId: string): Promise<void> {
  const sql = getSql();
  const battles = await sql`select started_at from battles where id = ${battleId}`;

  if (battles.at(0) == null) {
    return;
  }

  const startedAt = asNumber(battles[0].started_at);
  const snapshots = await sql`
    select ts.catches
    from battle_teams bt
    join team_snapshots ts on ts.id = bt.snapshot_id
    where bt.battle_id = ${battleId}
  `;
  const fielded = new Set<string>();

  for (const entry of snapshots) {
    const catches: unknown = entry.catches;

    if (!Array.isArray(catches)) {
      continue;
    }
    for (const value of catches) {
      const { caught } = asCatchSnapshot(value);

      // The raid boss stands for no record, so there is nothing of
      // its to release
      if (caught !== '') {
        fielded.add(caught);
      }
    }
  }

  if (fielded.size === 0) {
    return;
  }

  await sql`
    update caught set locked_at = 0
    where id = any(${[...fielded]}) and locked_at = ${startedAt}
  `;
}
