// Firestore returns untyped documents; the converters below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type FirestoreDataConverter,
  type Unsubscribe,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { ItemStack } from '../data/overworld/item-pool';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL, type Spawn } from '../overworld/chunk-snapshot';
import { asNumber, asString } from './__normalize';
import { requireUid } from '../server/firebase';
import {
  claimBerryPatch as claimBerryOnServerSide,
  claimItemCache as claimCacheOnServerSide,
  claimNest as claimNestOnServerSide,
  claimPhenomenon as claimPhenomenonOnServerSide,
  meetSpawn,
} from '../server/overworld';
import { serverNow, syncServerClock } from './clock';
import { asOffset, getLocale, toLocalTime, toZoneKey } from './local-time';
import { SNAPSHOT_COLLECTION, SPAWN_COLLECTION } from './collections';
import type { EncounterRecord } from './encounter-record';
import { getFirebaseFirestore } from './firebase';
import getIdToken from './session';

/**
 * One shared snapshot record per chunk **and zone** at
 * snapshots/{chunkSeed}:{zone}: whoever finds the record missing or
 * expired refreshes it, and the stored window is canonical for every
 * player in that zone — nobody derives spawns from their own clock.
 *
 * The zone is part of the key because the window is local: players an
 * ocean apart are in different hours of the day, so they walk
 * different worlds rather than fighting over one window
 */
export interface SnapshotRecord {
  /**
   * The chunk seed this snapshot belongs to
   */
  seed: string;
  /**
   * Minutes east of UTC the window was read in
   */
  offset: number;
  /**
   * The 5-minute local window the snapshot covers
   */
  timestamp: number;
}

/**
 * One synchronized spawn at spawns/{snapshotKey#index}: the raw
 * roll (species, individual value, trait value) shared by every
 * player viewing the chunk from the same zone
 */
export interface SpawnRecord {
  chunk: string;
  offset: number;
  timestamp: number;
  species: Species;
  individualValue: number;
  traitValue: number;
}

const snapshotConverter: FirestoreDataConverter<SnapshotRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      seed: asString(data.seed),
      offset: asNumber(data.offset),
      timestamp: asNumber(data.timestamp),
    };
  },
};

const spawnConverter: FirestoreDataConverter<SpawnRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      chunk: asString(data.chunk),
      offset: asNumber(data.offset),
      timestamp: asNumber(data.timestamp),
      species: asNumber(data.species) as Species,
      individualValue: asNumber(data.individualValue),
      traitValue: asNumber(data.traitValue),
    };
  },
};

/**
 * The document a chunk's window lives at, one per zone
 */
function windowId(chunk: Chunk, offset: number): string {
  return `${chunk.seed}:${toZoneKey(offset)}`;
}

function spawnId(snapshot: ChunkSnapshot, index: number): string {
  return `${snapshot.key}@${snapshot.timestamp}#${index}`;
}

/**
 * Fix the chunk's current window in the shared store: the first
 * player to find it missing or expired writes the new one and is
 * told they refreshed it; everyone else in the same zone adopts the
 * stored timestamp
 */
async function resolveSnapshotWindow(
  chunk: Chunk,
  offset: number,
): Promise<{ timestamp: number; refreshed: boolean }> {
  const db = getFirebaseFirestore();
  const ref = doc(db, SNAPSHOT_COLLECTION, windowId(chunk, offset)).withConverter(
    snapshotConverter,
  );

  // The instant must come from the server's clock: a player whose
  // device is skewed would otherwise refresh a live window early or
  // hold an expired one. Only the zone it is read in is the player's
  await syncServerClock();

  return runTransaction(db, async (transaction) => {
    const existing = (await transaction.get(ref)).data();
    const now = toLocalTime(serverNow(), offset);

    if (existing != null && now < existing.timestamp + SNAPSHOT_INTERVAL) {
      return { timestamp: existing.timestamp, refreshed: false };
    }

    const window = Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;

    transaction.set(ref, { seed: chunk.seed, offset: asOffset(offset), timestamp: window });
    return { timestamp: window, refreshed: true };
  });
}

/**
 * Resolve the chunk's current snapshot from the shared store, so
 * every player of that chunk in that zone derives the same one
 */
export async function getChunkSnapshot(chunk: Chunk, offset: number): Promise<ChunkSnapshot> {
  const { timestamp } = await resolveSnapshotWindow(chunk, offset);

  return new ChunkSnapshot(chunk, timestamp, offset);
}

/**
 * Follow the chunk's window as the shared store rolls it over, so
 * every observer of the chunk turns to the new 5-minute window the
 * moment somebody refreshes it
 */
export function watchSnapshotWindow(
  chunk: Chunk,
  offset: number,
  onChange: (timestamp: number | null) => void,
): Unsubscribe {
  const ref = doc(
    getFirebaseFirestore(),
    SNAPSHOT_COLLECTION,
    windowId(chunk, offset),
  ).withConverter(snapshotConverter);

  return onSnapshot(ref, (snapshot) => {
    onChange(snapshot.data()?.timestamp ?? null);
  });
}

/**
 * Follow the chunk's published spawns for one window: a spawn caught
 * or cleared by another player disappears from every screen at once
 */
export function watchSpawns(
  chunk: Chunk,
  offset: number,
  timestamp: number,
  onChange: (spawns: [string, SpawnRecord][]) => void,
): Unsubscribe {
  const spawns = collection(getFirebaseFirestore(), SPAWN_COLLECTION).withConverter(spawnConverter);

  return onSnapshot(
    query(
      spawns,
      where('chunk', '==', chunk.seed),
      where('offset', '==', asOffset(offset)),
      where('timestamp', '==', timestamp),
    ),
    (result) => {
      onChange(result.docs.map((entry) => [entry.id, entry.data()]));
    },
  );
}

/**
 * Drop every stored spawn of the chunk **in this zone** that belongs
 * to a window other than the current one. Another zone's spawns are
 * left where they are: its window turns over on its own clock
 */
async function clearStaleSpawns(chunk: Chunk, offset: number, timestamp: number): Promise<void> {
  const db = getFirebaseFirestore();
  const spawns = collection(db, SPAWN_COLLECTION).withConverter(spawnConverter);
  const result = await getDocs(
    query(spawns, where('chunk', '==', chunk.seed), where('offset', '==', asOffset(offset))),
  );
  const batch = writeBatch(db);

  for (const entry of result.docs) {
    if (entry.data().timestamp !== timestamp) {
      batch.delete(entry.ref);
    }
  }
  await batch.commit();
}

/**
 * Roll the snapshot's spawns and publish them to the shared spawn
 * store. Ids are deterministic (snapshot key + roll index) and the
 * rolls themselves derive from the shared window, so concurrent
 * players write identical documents — every viewer of the chunk
 * sees one synchronized set. Returns id-spawn pairs
 */
export async function publishSpawns(
  snapshot: ChunkSnapshot,
  count: number,
): Promise<[string, Spawn][]> {
  const db = getFirebaseFirestore();
  const spawns = snapshot.getSpawns(count);
  const batch = writeBatch(db);
  const pairs: [string, Spawn][] = [];

  spawns.forEach((spawn, index) => {
    const id = spawnId(snapshot, index);
    const [species, individualValue, traitValue] = spawn;

    batch.set(doc(db, SPAWN_COLLECTION, id).withConverter(spawnConverter), {
      chunk: snapshot.chunk.seed,
      offset: asOffset(snapshot.offset),
      timestamp: snapshot.timestamp,
      species,
      individualValue,
      traitValue,
    });
    pairs.push([id, spawn]);
  });
  await batch.commit();

  return pairs;
}

/**
 * The synchronized spawns of a chunk's current window, as stored
 */
export async function listSpawns(snapshot: ChunkSnapshot): Promise<[string, SpawnRecord][]> {
  const spawns = collection(getFirebaseFirestore(), SPAWN_COLLECTION).withConverter(spawnConverter);
  const result = await getDocs(
    query(
      spawns,
      where('chunk', '==', snapshot.chunk.seed),
      where('offset', '==', asOffset(snapshot.offset)),
      where('timestamp', '==', snapshot.timestamp),
    ),
  );

  return result.docs.map((entry) => [entry.id, entry.data()]);
}

/**
 * Visit a chunk: resolve its current window and hand back the
 * synchronized spawns. The visitor who rolls the window over
 * regenerates the chunk — stale spawn records are deleted and the
 * new window's spawns published; within a live window the stored
 * set is reused (published by whoever arrives first)
 */
export async function visitChunk(
  chunk: Chunk,
  count: number,
  offset: number,
): Promise<[string, Spawn][]> {
  const { timestamp, refreshed } = await resolveSnapshotWindow(chunk, offset);
  const snapshot = new ChunkSnapshot(chunk, timestamp, offset);

  if (refreshed) {
    await clearStaleSpawns(chunk, offset, timestamp);
    return publishSpawns(snapshot, count);
  }

  const existing = await listSpawns(snapshot);

  if (existing.length > 0) {
    return existing.map(([id, record]) => [
      id,
      [record.species, record.individualValue, record.traitValue],
    ]);
  }
  return publishSpawns(snapshot, count);
}

/**
 * What a landmark or a spawn is worth is decided by the server: the
 * reward derives from the chunk seed and the shared window, and both
 * of those are read there rather than described by the caller. A
 * client that asks for a cell holding nothing, or for a window that
 * has passed, is told there is nothing to claim. How near the player
 * was standing is not part of it: no position is stored, so reach is
 * a rule the map enforces rather than the server.
 *
 * Each of the wrappers below carries the player's token; the uid is
 * whatever that token proves, never what the call says.
 */

/**
 * Interact with an item cache landmark: everything buried there lands
 * in the player's bag — up to three kinds of up to three pieces, or a
 * single special. A claim marker (cache cell + landmark window +
 * player) guards the grant, so each cache pays a player once per
 * quarter hour — an expired window's cache regenerates and can be
 * claimed anew.
 * Resolves the whole stash, or null when there is nothing to claim
 */
export async function claimItemCache(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<ItemStack[] | null> {
  return claimCacheOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function claimCacheOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<ItemStack[] | null> {
  'use server';
  return claimCacheOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
  );
}

/**
 * Pick a berry patch: everything on the bush lands in the player's
 * bag — a handful of one kind — once per window, guarded the same way
 * a cache is
 */
export async function claimBerryPatch(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<ItemStack | null> {
  return claimBerryOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function claimBerryOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<ItemStack | null> {
  'use server';
  return claimBerryOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
  );
}

/**
 * Take the egg a nest is holding. A nest refills every twelve hours
 * rather than every landmark window, and the marker behind it is
 * stamped with that window, so a nest gives each player one egg
 * between refills.
 *
 * Resolves the new egg's catch id, or null when the nest is empty
 */
export async function claimNest(snapshot: ChunkSnapshot, cell: number): Promise<string | null> {
  return claimNestOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    getLocale(),
  );
}

async function claimNestOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  'use server';
  return claimNestOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    locale,
  );
}

/**
 * What a phenomenon yielded: an item that already landed in the bag,
 * the encounter the player now stands in, or the egg a grotto was
 * hiding
 */
export type PhenomenonClaim =
  | { kind: 'item'; items: ItemStack[] }
  | { kind: 'encounter'; encounter: EncounterRecord }
  | { kind: 'egg'; catchId: string };

/**
 * Walk into whatever is going on at a phenomenon cell. An item lands
 * in the bag; a pokemon is staged as an encounter of its own, rolled
 * from the chunk, hour and cell so every visitor meets the same
 * individual; a grotto's egg is written like a nest's.
 *
 * A player gets **one** of these per cell per hour, and only where
 * something was actually there. Resolves null otherwise
 */
export async function claimPhenomenon(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<PhenomenonClaim | null> {
  return claimPhenomenonOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    getLocale(),
  );
}

async function claimPhenomenonOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  locale: string,
): Promise<PhenomenonClaim | null> {
  'use server';
  return claimPhenomenonOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    locale,
  );
}

/**
 * Interact with one of the chunk's published spawns: it becomes this
 * player's encounter. The per-player derivation (shininess, gender,
 * ability, nature, ...) is stored at encounters/{spawnId}:{playerId}
 * on first interaction and returned as-is afterwards, so a meeting
 * cannot be re-rolled into a better one by re-entering it.
 *
 * Resolves null when the spawn is not standing in that chunk's live
 * window
 */
export async function startEncounter(
  snapshot: ChunkSnapshot,
  spawn: string,
): Promise<EncounterRecord | null> {
  return meetSpawnOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    spawn,
    snapshot.offset,
  );
}

async function meetSpawnOnServer(
  token: string,
  x: number,
  y: number,
  spawn: string,
  offset: number,
): Promise<EncounterRecord | null> {
  'use server';
  return meetSpawn(await requireUid(token), x, y, spawn, await syncServerClock(), offset);
}
