import 'server-only';
import BATTLE_TIMEOUT from '../auth/battle-lock';
import { asCatchSnapshot } from '../auth/catch-snapshot';
import {
  BATTLE_COLLECTION,
  CAUGHT_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
} from '../auth/collections';
import { getAdminFirestore } from './firebase';
import { asNumber, asStringArray, docData } from './read';

/**
 * A catch that is fighting cannot be edited. A battle stands on a
 * frozen snapshot of its party, so anything the record does in the
 * meantime — an item handed back to the bag, a level, an evolution —
 * would leave the fight and the record describing different pokemon.
 * The worst of those is the held item: a player who pulls a berry out
 * mid-raid would have it eaten in the battle and still sitting in
 * their bag afterwards.
 *
 * So a catch fielded in a battle is locked, and every write that edits
 * one refuses while the lock holds. The fight releases it when it
 * ends; the stamp it was locked at releases it anyway once the battle
 * timeout has passed, so a party walked out on does not stay held. The
 * check itself is a plain field read — no document is fetched to
 * answer it. When trading arrives it asks the same question before
 * putting a pokemon up.
 */

/**
 * Whether a catch is locked into a live battle. The clock is the
 * server's own — a caller's idea of `now` would be a way to talk a
 * lock into looking expired
 */
export function isCatchLocked(caught: Record<string, unknown>): boolean {
  const lockedAt = asNumber(caught.lockedAt);

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
 * What a catch document carries while it is fighting: the battle's own
 * `startedAt`, which is what lets the release tell this battle's lock
 * from a later one's. There is no flag beside it — a stamp of zero is
 * a free pokemon, so the stamp was always the whole of the answer
 */
export function lockFields(startedAt: number): { lockedAt: number } {
  return { lockedAt: startedAt };
}

/**
 * A free catch
 */
export function freeFields(): { lockedAt: number } {
  return { lockedAt: 0 };
}

/**
 * Release the party of a battle that has ended. Every catch the
 * battle's team snapshots name is freed, but only where its lock is
 * still *this* battle's — a pokemon whose lock has since expired and
 * been taken by another fight keeps that newer one, so a late report
 * cannot unlock a battle it has nothing to do with
 */
export async function releaseBattleLocks(battleId: string): Promise<void> {
  const db = getAdminFirestore();
  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(battleId).get());

  if (battle == null) {
    return;
  }

  const teams = asStringArray(battle.teams);
  const startedAt = asNumber(battle.startedAt);

  if (teams.length === 0) {
    return;
  }

  const snapshots = await db.getAll(
    ...teams.map((id) => db.collection(TEAM_SNAPSHOT_COLLECTION).doc(id)),
  );
  const fielded = new Set<string>();

  for (const entry of snapshots) {
    const data = docData(entry);

    if (data == null || !Array.isArray(data.catches)) {
      continue;
    }
    for (const value of data.catches) {
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

  const ids = [...fielded];
  const refs = ids.map((id) => db.collection(CAUGHT_COLLECTION).doc(id));
  const stored = await db.getAll(...refs);
  const batch = db.batch();
  let releasing = 0;

  for (const [at, entry] of stored.entries()) {
    const data = docData(entry);

    if (asNumber(data?.lockedAt) === startedAt) {
      batch.update(refs[at], freeFields());
      releasing += 1;
    }
  }

  if (releasing > 0) {
    await batch.commit();
  }
}
