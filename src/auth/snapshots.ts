// Firestore returns untyped documents; the converters below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type FirestoreDataConverter,
  type Unsubscribe,
  doc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import type { ItemStack } from '../data/overworld/item-pool';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL, type Spawn } from '../overworld/chunk-snapshot';
import { type SnapshotRecord, asSnapshotRecord, spawnId } from './snapshot-record';
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
import { SNAPSHOT_COLLECTION } from './collections';
import type { EncounterRecord } from './encounter-record';
import { getFirebaseFirestore } from './firebase';
import getIdToken from './session';

const snapshotConverter: FirestoreDataConverter<SnapshotRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => asSnapshotRecord(snapshot.data()),
};

/**
 * The document a chunk's window lives at, one per zone
 */
function windowId(chunk: Chunk, offset: number): string {
  return `${chunk.seed}:${toZoneKey(offset)}`;
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
  count: number,
): Promise<SnapshotRecord> {
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

    // A live window is adopted whole — its spawns are what everybody
    // in this zone is looking at. One written before the spawns moved
    // in has none, so it is rolled again rather than shown empty
    if (
      existing != null &&
      now < existing.timestamp + SNAPSHOT_INTERVAL &&
      existing.spawns.length > 0
    ) {
      return existing;
    }

    const timestamp = Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    // The rolls come from the window itself, so whoever writes it
    // writes what everyone else will read: one document, one write,
    // and no stale spawns left behind to sweep up
    const record: SnapshotRecord = {
      seed: chunk.seed,
      offset: asOffset(offset),
      timestamp,
      spawns: new ChunkSnapshot(chunk, timestamp, offset)
        .getSpawns(count)
        .map(([species, individualValue, traitValue]) => ({
          species,
          individualValue,
          traitValue,
        })),
    };

    transaction.set(ref, record);
    return record;
  });
}

/**
 * Resolve the chunk's current snapshot from the shared store, so
 * every player of that chunk in that zone derives the same one
 */
export async function getChunkSnapshot(
  chunk: Chunk,
  offset: number,
  count: number,
): Promise<ChunkSnapshot> {
  const { timestamp } = await resolveSnapshotWindow(chunk, offset, count);

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
  onChange: (record: SnapshotRecord | null) => void,
): Unsubscribe {
  const ref = doc(
    getFirebaseFirestore(),
    SNAPSHOT_COLLECTION,
    windowId(chunk, offset),
  ).withConverter(snapshotConverter);

  return onSnapshot(ref, (snapshot) => {
    onChange(snapshot.data() ?? null);
  });
}

/**
 * Visit a chunk: resolve its current window and hand back the
 * synchronized spawns.
 *
 * Whoever finds the window expired rolls the next one and writes it,
 * spawns and all, in a single transaction; everybody else adopts what
 * is stored. There is nothing left over to clean up, since a window
 * that turns over overwrites its own spawns
 */
export async function visitChunk(
  chunk: Chunk,
  count: number,
  offset: number,
): Promise<[string, Spawn][]> {
  const record = await resolveSnapshotWindow(chunk, offset, count);
  const key = `${chunk.seed}:${toZoneKey(offset)}`;

  return record.spawns.map((roll, index) => [
    spawnId(key, record.timestamp, index),
    [roll.species, roll.individualValue, roll.traitValue],
  ]);
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
