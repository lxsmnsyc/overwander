// Firestore returns untyped documents; the converters below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { User } from 'firebase/auth';
import {
  type FirestoreDataConverter,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL, type Spawn } from '../overworld/chunk-snapshot';
import deriveEncounter, { type Encounter, type EncounterType } from '../overworld/encounter';
import { asNumber, asNumberArray, asStatRecord, asString } from './__normalize';
import { getFirebaseFirestore } from './firebase';

/**
 * One shared snapshot record per chunk at snapshots/{chunkSeed}:
 * whoever finds the record missing or expired refreshes it, and the
 * stored window timestamp is canonical for every player — nobody
 * derives spawns from their own clock
 */
export interface SnapshotRecord {
  /**
   * The chunk seed this snapshot belongs to
   */
  seed: string;
  /**
   * The 5-minute window the snapshot covers
   */
  timestamp: number;
}

/**
 * One synchronized spawn at spawns/{snapshotKey#index}: the raw
 * roll (species, individual value, trait value) shared by every
 * player viewing the chunk
 */
export interface SpawnRecord {
  chunk: string;
  timestamp: number;
  species: Species;
  individualValue: number;
  traitValue: number;
}

/**
 * A player's view of a spawn at encounters/{spawnId:playerId}: the
 * derived traits (shininess, gender, ability, ...) that differ per
 * player live here
 */
export interface EncounterRecord extends Encounter {
  spawn: string;
  player: string;
}

const SNAPSHOT_COLLECTION = 'snapshots';
const SPAWN_COLLECTION = 'spawns';
const ENCOUNTER_COLLECTION = 'encounters';

const snapshotConverter: FirestoreDataConverter<SnapshotRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return { seed: asString(data.seed), timestamp: asNumber(data.timestamp) };
  },
};

const spawnConverter: FirestoreDataConverter<SpawnRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      chunk: asString(data.chunk),
      timestamp: asNumber(data.timestamp),
      species: asNumber(data.species) as Species,
      individualValue: asNumber(data.individualValue),
      traitValue: asNumber(data.traitValue),
    };
  },
};

const encounterConverter: FirestoreDataConverter<EncounterRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      spawn: asString(data.spawn),
      player: asString(data.player),
      type: asNumber(data.type) as EncounterType,
      species: asNumber(data.species) as Species,
      level: asNumber(data.level),
      individualValue: asNumber(data.individualValue),
      traitValue: asNumber(data.traitValue),
      ivs: asStatRecord(data.ivs),
      nature: asNumber(data.nature) as Natures,
      ability: asNumber(data.ability) as Abilities,
      gender: asNumber(data.gender) as Genders,
      shiny: data.shiny === true,
      moves: asNumberArray(data.moves) as Moves[],
      timestamp: asNumber(data.timestamp),
      x: asNumber(data.x),
      y: asNumber(data.y),
      biome: asNumber(data.biome) as Biome,
    };
  },
};

function snapshotKey(chunk: Chunk, timestamp: number): string {
  return `${chunk.seed}@${timestamp}`;
}

function spawnId(chunk: Chunk, timestamp: number, index: number): string {
  return `${snapshotKey(chunk, timestamp)}#${index}`;
}

/**
 * Fix the chunk's current window in the shared store: the first
 * player to find it missing or expired writes the new one and is
 * told they refreshed it; everyone else adopts the stored timestamp
 */
async function resolveSnapshotWindow(
  chunk: Chunk,
): Promise<{ timestamp: number; refreshed: boolean }> {
  const db = getFirebaseFirestore();
  const ref = doc(db, SNAPSHOT_COLLECTION, chunk.seed).withConverter(snapshotConverter);

  return runTransaction(db, async (transaction) => {
    const existing = (await transaction.get(ref)).data();
    const now = Date.now();

    if (existing != null && now < existing.timestamp + SNAPSHOT_INTERVAL) {
      return { timestamp: existing.timestamp, refreshed: false };
    }

    const window = Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;

    transaction.set(ref, { seed: chunk.seed, timestamp: window });
    return { timestamp: window, refreshed: true };
  });
}

/**
 * Resolve the chunk's current snapshot from the shared store, so
 * all players derive the exact same snapshot
 */
export async function getChunkSnapshot(chunk: Chunk): Promise<ChunkSnapshot> {
  const { timestamp } = await resolveSnapshotWindow(chunk);

  return new ChunkSnapshot(chunk, timestamp);
}

/**
 * Drop every stored spawn of the chunk that belongs to a window
 * other than the current one
 */
async function clearStaleSpawns(chunk: Chunk, timestamp: number): Promise<void> {
  const db = getFirebaseFirestore();
  const spawns = collection(db, SPAWN_COLLECTION).withConverter(spawnConverter);
  const result = await getDocs(query(spawns, where('chunk', '==', chunk.seed)));
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
    const id = spawnId(snapshot.chunk, snapshot.timestamp, index);
    const [species, individualValue, traitValue] = spawn;

    batch.set(doc(db, SPAWN_COLLECTION, id).withConverter(spawnConverter), {
      chunk: snapshot.chunk.seed,
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
export async function visitChunk(chunk: Chunk, count: number): Promise<[string, Spawn][]> {
  const { timestamp, refreshed } = await resolveSnapshotWindow(chunk);
  const snapshot = new ChunkSnapshot(chunk, timestamp);

  if (refreshed) {
    await clearStaleSpawns(chunk, timestamp);
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
 * Interact with a spawn: it becomes this player's encounter. The
 * per-player derivation (shininess, gender, ability, nature, ...)
 * is stored at encounters/{spawnId:playerId} on first interaction
 * and returned as-is afterwards, so each player meets their own
 * version of the same spawn
 */
export async function startEncounter(
  user: User,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
): Promise<Encounter> {
  const ref = doc(getFirebaseFirestore(), ENCOUNTER_COLLECTION, `${id}:${user.uid}`).withConverter(
    encounterConverter,
  );
  const existing = (await getDoc(ref)).data();

  if (existing != null) {
    return existing;
  }

  const encounter = deriveEncounter(snapshot, spawn, user.uid);

  await setDoc(ref, { ...encounter, spawn: id, player: user.uid });
  return encounter;
}
