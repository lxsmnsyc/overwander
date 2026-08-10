import 'server-only';
import {
  BERRY_CLAIM_COLLECTION,
  CACHE_CLAIM_COLLECTION,
  ENCOUNTER_COLLECTION,
  FLED_COLLECTION,
  GROTTO_CLAIM_COLLECTION,
  NEST_CLAIM_COLLECTION,
  SNAPSHOT_COLLECTION,
  SPAWN_COLLECTION,
} from '../auth/collections';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import AleaRNG from '../core/alea';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import ChunkSnapshot, {
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import deriveEncounter, { type EncounterOptions } from '../overworld/encounter';
import { encounterKey } from '../overworld/safari';
import createOverworld from '../overworld/setup';
import resolveBuddy from './buddy';
import { grantNestEgg } from './eggs';
import { getAdminFirestore } from './firebase';
import { asOffset, toLocalTime, toZoneKey } from '../auth/local-time';
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
      .doc(`${chunk.seed}:${toZoneKey(zone)}`)
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
  offset: number,
): Promise<Items | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const item = snapshot?.getItemCaches().get(cell);

  if (snapshot == null || item == null) {
    return null;
  }

  const id = `${snapshot.key}@${snapshot.timestamp}$${cell}:${uid}`;

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
  offset: number,
): Promise<Items | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const berry = snapshot?.getBerryPatches().get(cell);

  if (snapshot == null || berry == null) {
    return null;
  }

  const id = `${snapshot.key}@${snapshot.timestamp}$berry${cell}:${uid}`;

  if (!(await claim(BERRY_CLAIM_COLLECTION, id, { player: uid, item: berry }))) {
    return null;
  }
  await grantItem(uid, berry);
  return berry;
}

/**
 * Take the egg a nest is holding. A nest keeps to its own day-long
 * window rather than the five-minute one the chunk turns over on, so
 * the claim marker is stamped with the nest day: one egg per nest,
 * per player, per local day.
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
  offset: number,
): Promise<GrottoClaim | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getHiddenGrottos().get(cell);

  if (snapshot == null || reward == null) {
    return null;
  }

  const key = `${snapshot.key}@${snapshot.timestamp}$grotto${cell}`;

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
  const rng = new AleaRNG(`${snapshot.key}${snapshot.timestamp}grotto${cell}spawn`);
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
  const data = docData(await getAdminFirestore().collection(SPAWN_COLLECTION).doc(spawnId).get());
  const snapshot = await resolveSnapshot(x, y, now, offset);

  // The spawn has to belong to the chunk the player is standing in,
  // in its live window: one from a window that has turned over, or
  // from a chunk away, is not standing there to be met
  if (
    data == null ||
    snapshot == null ||
    data.chunk !== snapshot.chunk.seed ||
    data.offset !== snapshot.offset ||
    data.timestamp !== snapshot.timestamp
  ) {
    return null;
  }

  const overworld = createOverworld(uid, await resolveBuddy(uid));

  // The extras a lure draws in are only there for the player whose
  // buddy drew them: the window publishes them for everyone, and a
  // player walking without a lure cannot meet what they cannot see
  if (spawnIndex(spawnId) >= overworld.checkSpawnCount(SPAWN_COUNT)) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const species = asNumber(data.species) as Species;
  const spawn: Spawn = [species, asNumber(data.individualValue), asNumber(data.traitValue)];

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
    transaction.set(ref, { keys: [...keys, key] }, { merge: true });
  });
}
