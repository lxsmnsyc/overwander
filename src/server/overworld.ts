import 'server-only';
import {
  BERRY_CLAIM_COLLECTION,
  CACHE_CLAIM_COLLECTION,
  ENCOUNTER_COLLECTION,
  FLED_COLLECTION,
  NEST_CLAIM_COLLECTION,
  PHENOMENON_CLAIM_COLLECTION,
  SNAPSHOT_COLLECTION,
} from '../auth/collections';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { asSpawnRolls, spawnId as nameSpawn, windowId } from '../auth/snapshot-record';
import AleaRNG from '../core/alea';
import type { ItemStack } from '../data/overworld/item-pool';
import ChunkSnapshot, {
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import deriveEncounter, { type EncounterOptions } from '../overworld/encounter';
import { encounterKey, encounterWindow } from '../overworld/safari';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { grantNestEgg } from './eggs';
import { getAdminFirestore } from './firebase';
import { asOffset, toLocalTime, toZoneKey } from '../auth/local-time';
import { asNumber, asStringArray, docData } from './read';
import { grantItem, grantItems } from './inventory';

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

/**
 * The chunk's live window in one zone, as stored. A window nobody has
 * opened yet, or one that has expired, pays nothing: refreshing it is
 * the client's shared-world business, and a claim against a stale
 * window is a claim against a landmark that is no longer there.
 *
 * The instant is the server's; the zone is the caller's, and
 * everything derived from it — the window document, the rolls, the
 * claim markers — is scoped by it, so a client that invents a zone
 * gets that zone's world rather than a second helping of its own
 */
export async function resolveSnapshot(
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<ChunkSnapshot | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const stored = docData(
    await getAdminFirestore()
      .collection(SNAPSHOT_COLLECTION)
      .doc(windowId(chunk.seed, toZoneKey(zone)))
      .get(),
  );
  const timestamp = asNumber(stored?.timestamp);

  if (timestamp === 0 || toLocalTime(now, zone) >= timestamp + SNAPSHOT_INTERVAL) {
    return null;
  }
  return new ChunkSnapshot(chunk, timestamp, zone);
}

/**
 * Take a claim marker, or find it already taken. One marker per
 * landmark, window and player, so a landmark pays each player once
 * per window and regenerates with the next one
 */
export async function claim(
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
 * Interact with an item cache: everything the window buried there
 * lands in the bag. A stash is up to three kinds of up to three
 * pieces, so the whole of it is granted rather than one item
 */
export async function claimItemCache(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<ItemStack[] | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const stash = snapshot?.getItemCaches().get(cell);

  if (snapshot == null || stash == null) {
    return null;
  }

  const id = `${snapshot.key}@${snapshot.landmarkTimestamp}$${cell}:${uid}`;

  // The marker records the whole stash, so what a cache paid is
  // readable afterwards rather than only that it paid
  if (!(await claim(CACHE_CLAIM_COLLECTION, id, { player: uid, items: stash }))) {
    return null;
  }
  await grantStash(uid, stash);
  return stash;
}

/**
 * Put a whole stash in the bag. A bag is one document, so three kinds
 * dug out of one cache are **one** write rather than three queueing
 * behind each other — and a stash cannot half-land
 */
async function grantStash(uid: string, stash: ItemStack[]): Promise<void> {
  await grantItems(
    uid,
    stash.map(({ item, amount }) => [item, amount]),
  );
}

/**
 * Pick a berry patch: everything on the bush lands in the bag. A
 * patch bears a handful of one kind rather than a single berry
 */
export async function claimBerryPatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const berries = snapshot?.getBerryPatches().get(cell);

  if (snapshot == null || berries == null) {
    return null;
  }

  const id = `${snapshot.key}@${snapshot.landmarkTimestamp}$berry${cell}:${uid}`;

  if (
    !(await claim(BERRY_CLAIM_COLLECTION, id, {
      player: uid,
      item: berries.item,
      amount: berries.amount,
    }))
  ) {
    return null;
  }
  await grantItem(uid, berries.item, berries.amount);
  return berries;
}

/**
 * Take the egg a nest is holding. A nest keeps to its own half-day
 * window rather than the quarter-hour one the ground turns over on, so
 * the claim marker is stamped with the nest window: one egg per
 * nest, per player, per half day.
 *
 * The player still has to be standing in the chunk's live window to
 * reach it, which is what the snapshot resolves. Resolves the new
 * egg's catch id, or null when there is nothing lying there
 */
export async function claimNest(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const species = snapshot?.getNests().get(cell);

  if (snapshot == null || species == null) {
    return null;
  }

  const id = `${snapshot.key}@${snapshot.nestTimestamp}$nest${cell}:${uid}`;

  if (!(await claim(NEST_CLAIM_COLLECTION, id, { player: uid, species }))) {
    return null;
  }
  return grantNestEgg(uid, snapshot, cell, species, now, offset, locale);
}

/**
 * What a phenomenon yielded: an item that already landed in the bag,
 * the encounter the player now stands in, or — a grotto alone — the
 * egg it was hiding
 */
export type PhenomenonClaim =
  | { kind: 'item'; items: ItemStack[] }
  | { kind: 'encounter'; encounter: EncounterRecord }
  | { kind: 'egg'; catchId: string };

/**
 * Walk into whatever is going on at a cell.
 *
 * What is happening there and what it turns out to be are both the
 * world's, derived from the chunk, the hour and the cell — so the
 * pokemon a phenomenon startles out is the one it hid, not one the
 * caller named, and every visitor of that cell this hour meets the
 * same individual.
 *
 * **One successful interaction per player per hour.** The marker is
 * taken before anything is handed over and only where something is
 * actually there to hand over, so a phenomenon the biome could not
 * fill costs the player nothing
 */
export async function claimPhenomenon(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<PhenomenonClaim | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getPhenomenonReward(cell) ?? null;

  if (snapshot == null || reward == null) {
    return null;
  }

  const key = `${snapshot.key}@${snapshot.phenomenonTimestamp}$happening${cell}`;

  if (
    !(await claim(PHENOMENON_CLAIM_COLLECTION, `${key}:${uid}`, { player: uid, kind: reward.kind }))
  ) {
    return null;
  }

  if (reward.kind === 'item') {
    await grantStash(uid, reward.items);
    return { kind: 'item', items: reward.items };
  }

  if (reward.kind === 'egg') {
    return {
      kind: 'egg',
      catchId: await grantNestEgg(uid, snapshot, cell, reward.species, now, offset, locale),
    };
  }

  // The pokemon needs the two rolls a snapshot spawn would have; they
  // derive from the same chunk, hour and cell, so what the phenomenon
  // startled out is one pokemon rather than one per player
  const rng = new AleaRNG(`${snapshot.key}${snapshot.phenomenonTimestamp}happening${cell}spawn`);
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
  // permanent Shadow ability. What the buddy changes about the
  // meeting — the shiny odds it carries, the nature it passes on, the
  // gender it draws out — is asked of the overworld rather than
  // spelled out here
  const overworld = createOverworld(uid, await resolveBuddy(uid));
  const derived = deriveEncounter(snapshot, spawn, uid, {
    ...options,
    shinyBoost: (options.shinyBoost ?? 1) * overworld.checkEncounterShiny(id),
  });
  const record: EncounterRecord = {
    ...derived,
    nature: overworld.checkEncounterNature(id, derived.nature),
    gender: overworld.checkEncounterGender(id, derived.gender),
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
  offset: number,
): Promise<EncounterRecord | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return null;
  }

  // The name says which chunk, which zone and which window the spawn
  // belongs to, and the window it names has to be the live one: a
  // spawn from a window that has turned over, or from a chunk away,
  // is not standing there to be met
  const index = spawnIndex(spawnId);

  if (spawnId !== nameSpawn(snapshot.key, snapshot.timestamp, index)) {
    return null;
  }

  const overworld = createOverworld(uid, await resolveBuddy(uid));

  // The extras a lure draws in are only there for the player whose
  // buddy drew them: the window publishes them for everyone, and a
  // player walking without a lure cannot meet what they cannot see
  if (index >= overworld.checkSpawnCount(SPAWN_COUNT)) {
    return null;
  }

  // The roll itself comes off the window document, which is the one
  // the whole zone is looking at. It is addressed by the document's
  // id and **not** by `snapshot.key`: the two are a separator apart,
  // and asking for the key found nothing at all — so every published
  // spawn in the game answered as though its window had turned over
  const window = docData(
    await getAdminFirestore()
      .collection(SNAPSHOT_COLLECTION)
      .doc(windowId(snapshot.chunk.seed, toZoneKey(snapshot.offset)))
      .get(),
  );
  const rolls = asSpawnRolls(window?.spawns);

  if (index >= rolls.length) {
    return null;
  }

  const rolled = rolls[index];
  const spawn: Spawn = [rolled.species, rolled.individualValue, rolled.traitValue];

  return startEncounter(uid, snapshot, spawnId, spawn);
}

/**
 * Which roll of the window a published spawn was: the id carries it
 * after the '#', and the extras a lure adds are the last of them
 */
function spawnIndex(spawnId: string): number {
  const index = Number(spawnId.slice(spawnId.lastIndexOf('#') + 1));

  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
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
    transaction.set(ref, { keys: [...keep(keys, encounterWindow(key)), key] }, { merge: true });
  });
}

/**
 * How long a fled encounter is remembered for.
 *
 * What it has to outlive is the window that staged it: the spawn is
 * gone when the window turns over, so a key from an older one can
 * never match anything again. The allowance is an hour rather than
 * one window, because the windows are **local** — a player who
 * crosses a zone reads a clock offset from the one their last key was
 * written against, and an hour is more than any of that is worth
 * arguing about.
 *
 * Without it the list only ever grows: one key per encounter a player
 * has ever walked away from, in one document, until it meets
 * Firestore's megabyte
 */
export const FLED_MEMORY = 60 * 60 * 1000;

/**
 * The keys still worth keeping, measured against the newest one
 */
function keep(keys: string[], newest: number): string[] {
  return keys.filter((key) => newest - encounterWindow(key) < FLED_MEMORY);
}
