import 'server-only';
import {
  BERRY_CLAIM_COLLECTION,
  CACHE_CLAIM_COLLECTION,
  ENCOUNTER_COLLECTION,
  FLED_COLLECTION,
  GROTTO_CLAIM_COLLECTION,
  SNAPSHOT_COLLECTION,
  SPAWN_COLLECTION,
} from '../auth/collections';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import AleaRNG from '../core/alea';
import { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL, type Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import deriveEncounter, { type EncounterOptions, SHINY_CHARM_BOOST } from '../overworld/encounter';
import { encounterKey } from '../overworld/safari';
import isBuddyHolding from './buddy';
import { getAdminFirestore } from './firebase';
import { asNumber, asStringArray, docData } from './read';
import { grantItem } from './inventory';

/**
 * The overworld's privileged side: what a landmark pays out, and what
 * a player is actually standing in front of.
 *
 * Nothing here trusts a caller's description of the world. The window
 * comes from the shared snapshot document, the chunk from the world
 * seed, and the reward from the deterministic roll those two produce
 * — a client that asks for a cell it is not near, or a window that
 * has passed, gets whatever the world really staged, which is
 * usually nothing
 */

function snapshotKey(chunk: Chunk, timestamp: number): string {
  return `${chunk.seed}@${timestamp}`;
}

/**
 * The chunk's live window, as stored. A window nobody has opened yet,
 * or one that has expired, pays nothing: refreshing it is the
 * client's shared-world business, and a claim against a stale window
 * is a claim against a landmark that is no longer there
 */
async function resolveSnapshot(x: number, y: number, now: number): Promise<ChunkSnapshot | null> {
  const chunk = getWorld().getChunk(x, y);
  const stored = docData(
    await getAdminFirestore().collection(SNAPSHOT_COLLECTION).doc(chunk.seed).get(),
  );
  const timestamp = asNumber(stored?.timestamp);

  if (timestamp === 0 || now >= timestamp + SNAPSHOT_INTERVAL) {
    return null;
  }
  return new ChunkSnapshot(chunk, timestamp);
}

/**
 * Take a claim marker, or find it already taken. One marker per
 * landmark, window and player, so a landmark pays each player once
 * per window and regenerates with the next one
 */
async function claim(
  collection: string,
  id: string,
  record: Record<string, unknown>,
): Promise<boolean> {
  const db = getAdminFirestore();
  const ref = db.collection(collection).doc(id);

  return db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).exists) {
      return false;
    }
    transaction.set(ref, record);
    return true;
  });
}

/**
 * Interact with an item cache: the window's reward lands in the bag
 */
export async function claimItemCache(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
): Promise<Items | null> {
  const snapshot = await resolveSnapshot(x, y, now);
  const item = snapshot?.getItemCaches().get(cell);

  if (snapshot == null || item == null) {
    return null;
  }

  const id = `${snapshotKey(snapshot.chunk, snapshot.timestamp)}$${cell}:${uid}`;

  if (!(await claim(CACHE_CLAIM_COLLECTION, id, { player: uid, item }))) {
    return null;
  }
  await grantItem(uid, item);
  return item;
}

/**
 * Pick a berry patch: the window's berry lands in the bag
 */
export async function claimBerryPatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
): Promise<Items | null> {
  const snapshot = await resolveSnapshot(x, y, now);
  const berry = snapshot?.getBerryPatches().get(cell);

  if (snapshot == null || berry == null) {
    return null;
  }

  const id = `${snapshotKey(snapshot.chunk, snapshot.timestamp)}$berry${cell}:${uid}`;

  if (!(await claim(BERRY_CLAIM_COLLECTION, id, { player: uid, item: berry }))) {
    return null;
  }
  await grantItem(uid, berry);
  return berry;
}

/**
 * What a hidden grotto yielded: either an item that already landed in
 * the bag, or the encounter the player now stands in
 */
export type GrottoClaim =
  | { kind: 'item'; item: Items }
  | { kind: 'encounter'; encounter: EncounterRecord };

/**
 * Interact with a hidden grotto. An item lands in the bag here; a
 * pokemon is staged as an encounter of its own, with the spawn rolled
 * from the chunk, window and cell — so the grotto's pokemon is the
 * one the world hid there, not one the caller named
 */
export async function claimHiddenGrotto(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
): Promise<GrottoClaim | null> {
  const snapshot = await resolveSnapshot(x, y, now);
  const reward = snapshot?.getHiddenGrottos().get(cell);

  if (snapshot == null || reward == null) {
    return null;
  }

  const key = `${snapshotKey(snapshot.chunk, snapshot.timestamp)}$grotto${cell}`;

  if (
    !(await claim(GROTTO_CLAIM_COLLECTION, `${key}:${uid}`, { player: uid, kind: reward.kind }))
  ) {
    return null;
  }

  if (reward.kind === 'item') {
    await grantItem(uid, reward.item);
    return { kind: 'item', item: reward.item };
  }

  // The grotto's pokemon needs the two rolls a snapshot spawn would
  // have; they derive from the same chunk, window and cell, so every
  // observer of this grotto meets the same individual
  const rng = new AleaRNG(`${snapshot.chunk.seed}${snapshot.timestamp}grotto${cell}spawn`);
  const spawn: Spawn = [reward.species, rng.int32(), rng.int32()];

  return { kind: 'encounter', encounter: await startEncounter(uid, snapshot, key, spawn) };
}

/**
 * Stage a meeting: the per-player derivation is written to
 * encounters/{spawnId}:{uid} on first interaction and returned as-is
 * afterwards, so re-entering a meeting cannot re-roll it into
 * something better
 */
export async function startEncounter(
  uid: string,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
  options: EncounterOptions = {},
): Promise<EncounterRecord> {
  const ref = getAdminFirestore().collection(ENCOUNTER_COLLECTION).doc(`${id}:${uid}`);
  const existing = docData(await ref.get());

  if (existing != null) {
    return asEncounterRecord(existing);
  }

  // Snapshot spawns are wild meetings; a raid reward carries its own
  // type (raid encounters never flee) and, from a shadow raid, its
  // permanent Shadow ability. A buddy holding the Shiny Charm lifts
  // the odds of every meeting the player has
  const charm = await isBuddyHolding(uid, Items.ShinyCharm);
  const record: EncounterRecord = {
    ...deriveEncounter(snapshot, spawn, uid, {
      ...options,
      shinyBoost: (options.shinyBoost ?? 1) * (charm ? SHINY_CHARM_BOOST : 1),
    }),
    spawn: id,
    player: uid,
  };

  await ref.set(record);
  return record;
}

/**
 * Meet one of the chunk's published spawns. The spawn is read from
 * the shared store rather than taken from the caller, so the rolls
 * behind the meeting are the ones every player of that chunk sees
 */
export async function meetSpawn(
  uid: string,
  x: number,
  y: number,
  spawnId: string,
  now: number,
): Promise<EncounterRecord | null> {
  const data = docData(await getAdminFirestore().collection(SPAWN_COLLECTION).doc(spawnId).get());
  const snapshot = await resolveSnapshot(x, y, now);

  // The spawn has to belong to the chunk the player is standing in,
  // in its live window: one from a window that has turned over, or
  // from a chunk away, is not standing there to be met
  if (
    data == null ||
    snapshot == null ||
    data.chunk !== snapshot.chunk.seed ||
    data.timestamp !== snapshot.timestamp
  ) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const species = asNumber(data.species) as Species;
  const spawn: Spawn = [species, asNumber(data.individualValue), asNumber(data.traitValue)];

  return startEncounter(uid, snapshot, spawnId, spawn);
}

/**
 * Mark an encounter as fled. The key is recomputed from the stored
 * encounter, so a player cannot retire a meeting they never had
 */
export async function markFled(uid: string, spawnId: string): Promise<void> {
  const db = getAdminFirestore();
  const stored = docData(await db.collection(ENCOUNTER_COLLECTION).doc(`${spawnId}:${uid}`).get());

  if (stored == null) {
    return;
  }

  const key = encounterKey(asEncounterRecord(stored));
  const ref = db.collection(FLED_COLLECTION).doc(uid);

  await db.runTransaction(async (transaction) => {
    const keys = asStringArray(docData(await transaction.get(ref))?.keys);

    if (new Set(keys).has(key)) {
      return;
    }
    transaction.set(ref, { keys: [...keys, key] }, { merge: true });
  });
}
