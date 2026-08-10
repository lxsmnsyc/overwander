import 'server-only';
import { asCatchSnapshot } from '../auth/catch-snapshot';
import {
  BATTLE_COLLECTION,
  BATTLE_CONSUMPTION_COLLECTION,
  CAUGHT_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
} from '../auth/collections';
import type ConsumedItems from '../auth/consumed-items';
import type { Items } from '../data/ids/items';
import { getAdminFirestore } from './firebase';
import { asNumberArray, asStringArray, docData } from './read';

/**
 * What a battle costs its fighters, written with admin credentials. A
 * report only ever takes items away, and only the reporter's own — so
 * unlike an outcome it cannot be used against anybody else — but it
 * still passes through here, because it writes to catch records and
 * because the marker that stops it happening twice has to be the
 * server's
 */

/**
 * What a catch is holding, restored from the stored document
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asHeldItems = (value: unknown): Items[] => asNumberArray(value) as Items[];

/**
 * Everything the player actually fielded in this battle, catch id to
 * the items that catch entered holding. The team snapshots are the
 * server's own writing, so they — not the report — decide what a unit
 * could possibly have spent
 */
async function readFieldedItems(
  battle: Record<string, unknown>,
  player: string,
): Promise<Map<string, Set<Items>>> {
  const db = getAdminFirestore();
  const ids = asStringArray(battle.teams);
  const fielded = new Map<string, Set<Items>>();

  if (ids.length === 0) {
    return fielded;
  }

  const snapshots = await db.getAll(
    ...ids.map((id) => db.collection(TEAM_SNAPSHOT_COLLECTION).doc(id)),
  );

  for (const entry of snapshots) {
    const data = docData(entry);

    if (data == null || data.player !== player || !Array.isArray(data.catches)) {
      continue;
    }
    for (const value of data.catches) {
      const snapshot = asCatchSnapshot(value);

      if (snapshot.caught !== '') {
        fielded.set(snapshot.caught, new Set(snapshot.items));
      }
    }
  }

  return fielded;
}

/**
 * Take the items a player's party spent off their catch records. The
 * battle names who fought it and the team snapshots name what each of
 * their catches walked in holding, so a report can only strip an item
 * that was actually fielded — anything else in it is dropped.
 *
 * A marker at battleConsumptions/{battleId}:{uid} guards the whole
 * thing, so one battle bills one player once however many times the
 * report arrives. Resolves false when the player did not fight it, or
 * has already paid for it
 */
export default async function consumeHeldItems(
  uid: string,
  battleId: string,
  consumed: ConsumedItems[],
): Promise<boolean> {
  if (consumed.length === 0) {
    return false;
  }

  const db = getAdminFirestore();
  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(battleId).get());

  if (battle == null || !new Set(asStringArray(battle.players)).has(uid)) {
    return false;
  }

  const fielded = await readFieldedItems(battle, uid);
  const reported = consumed.filter((entry) => fielded.has(entry.caught));

  if (reported.length === 0) {
    return false;
  }

  return db.runTransaction(async (transaction) => {
    const marker = db.collection(BATTLE_CONSUMPTION_COLLECTION).doc(`${battleId}:${uid}`);

    if ((await transaction.get(marker)).exists) {
      return false;
    }

    const refs = reported.map((entry) => db.collection(CAUGHT_COLLECTION).doc(entry.caught));
    const stored = await transaction.getAll(...refs);

    transaction.set(marker, { player: uid, battle: battleId });

    for (const [at, target] of reported.entries()) {
      const data = docData(stored[at]);

      // A catch sold, released or handed on since the battle started
      // is nobody's to charge
      if (data == null || data.owner !== uid) {
        continue;
      }

      const spent = fielded.get(target.caught);
      const reportedItems = new Set(target.items);
      const remaining: Items[] = [];
      const taken = new Set<Items>();

      for (const item of asHeldItems(data.items)) {
        // One copy per item spent: the rest of the stack, if a later
        // limit ever allows one, stays where it is
        if (spent?.has(item) === true && reportedItems.has(item) && !taken.has(item)) {
          taken.add(item);
          continue;
        }
        remaining.push(item);
      }

      if (taken.size > 0) {
        transaction.update(refs[at], { items: remaining });
      }
    }

    return true;
  });
}
