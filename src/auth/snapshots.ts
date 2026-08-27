// Rows arrive untyped; the converters below restore const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { ItemStack } from '../data/overworld/item-pool';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL, type Spawn } from '../overworld/chunk-snapshot';
import { type SnapshotRecord, asSnapshotRecord, spawnId } from './snapshot-record';
import { requireUid } from '../server/auth';
import {
  type NestOffer,
  claimBerryPatch as claimBerryOnServerSide,
  claimItemCache as claimCacheOnServerSide,
  claimNest as claimNestOnServerSide,
  claimPhenomenon as claimPhenomenonOnServerSide,
  listClaimedPhenomena as listClaimedPhenomenaOnServerSide,
  listPickedBerryPatches as listPickedBerryPatchesOnServerSide,
  meetSpawn,
  peekNest as peekNestOnServerSide,
  peekPhenomenonEgg as peekPhenomenonEggOnServerSide,
} from '../server/overworld';
import { serverNow, syncServerClock } from './clock';
import { asRecord, asRecordArray } from './__normalize';
import { asOffset, getLocale, toLocalTime, toZoneKey } from './local-time';
import type { EncounterRecord } from './encounter-record';
import getSupabase, { type Unwatch, watchTable } from './supabase';
import getIdToken from './session';

/** The stored window plus its spawn rows, in the record shape */
async function readSnapshotWindow(chunk: Chunk, offset: number): Promise<SnapshotRecord | null> {
  const { data } = await getSupabase()
    .from('snapshots')
    .select(
      'chunk_seed, zone, utc_offset, window_at, snapshot_spawns(idx, species, individual_value, trait_value)',
    )
    .eq('chunk_seed', chunk.seed)
    .eq('zone', toZoneKey(asOffset(offset)))
    .maybeSingle();

  return data == null ? null : fromSnapshotRow(asRecord(data));
}

function fromSnapshotRow(row: Record<string, unknown>): SnapshotRecord {
  const spawns = asRecordArray(row.snapshot_spawns).sort(
    (left, right) => Number(left.idx ?? 0) - Number(right.idx ?? 0),
  );

  return asSnapshotRecord({
    seed: row.chunk_seed,
    offset: row.utc_offset,
    timestamp: row.window_at,
    spawns: spawns.map((entry) => ({
      species: entry.species,
      individualValue: entry.individual_value,
      traitValue: entry.trait_value,
    })),
  });
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
  // The instant must come from the server's clock: a player whose
  // device is skewed would otherwise refresh a live window early or
  // hold an expired one. Only the zone it is read in is the player's
  await syncServerClock();

  const existing = await readSnapshotWindow(chunk, offset);
  const now = toLocalTime(serverNow(), offset);

  // A live window is adopted whole; its spawns are what everybody in
  // this zone is looking at. One written before the spawns moved in
  // has none, so it is rolled again rather than shown empty
  if (
    existing != null &&
    now < existing.timestamp + SNAPSHOT_INTERVAL &&
    existing.spawns.length > 0
  ) {
    return existing;
  }

  const timestamp = Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
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

  // The publish is a definer function: shape-checked, and monotonic,
  // so two racing publishers converge on one stored window and a
  // stale one changes nothing. What is stored is re-read afterwards
  // rather than assumed, since the race may have been lost
  await getSupabase().rpc('publish_snapshot', {
    p_seed: chunk.seed,
    p_zone: toZoneKey(asOffset(offset)),
    p_offset: asOffset(offset),
    p_window: timestamp,
    p_spawns: record.spawns,
  });

  return (await readSnapshotWindow(chunk, offset)) ?? record;
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
 * Every window ever stored for a chunk, whichever zone wrote it.
 *
 * A chunk holds one window per zone and each is overwritten as it
 * turns over, so this is a handful of rows: what the chunk is showing
 * right now, once per zone anybody has walked it from
 */
export async function listChunkWindows(seed: string): Promise<SnapshotRecord[]> {
  const { data } = await getSupabase()
    .from('snapshots')
    .select(
      'chunk_seed, zone, utc_offset, window_at, snapshot_spawns(idx, species, individual_value, trait_value)',
    )
    .eq('chunk_seed', seed);

  return asRecordArray(data).map(fromSnapshotRow);
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
): Unwatch {
  return watchTable(
    'snapshots',
    [`chunk_seed=eq.${chunk.seed}`],
    async () => readSnapshotWindow(chunk, offset),
    onChange,
  );
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
  // A spawn is named after the snapshot's key, which is what the
  // server re-derives the name from
  const key = new ChunkSnapshot(chunk, record.timestamp, offset).key;

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
 * Whether there is an egg to be had here, without taking it.
 *
 * Looking is free and writes nothing, the way looking into a lair is.
 * An egg is the one reward in the overworld that is not simply better
 * to have — a buddy carries one egg and walks it open, so taking a
 * second is a decision about the first — and a landmark that pressed
 * one into the player's hands gave them no way to make it.
 *
 * Resolves null where there is nothing lying there at all. Nothing
 * about the species comes back: that is what an egg is
 */
export async function peekNest(snapshot: ChunkSnapshot, cell: number): Promise<NestOffer | null> {
  return peekNestOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function peekNestOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<NestOffer | null> {
  'use server';
  return peekNestOnServerSide(await requireUid(token), x, y, cell, await syncServerClock(), offset);
}

/**
 * The same question of a phenomenon cell, and only of the egg: an
 * item and a pokemon are walked into as they always were
 */
export async function peekPhenomenonEgg(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<NestOffer | null> {
  return peekPhenomenonEggOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function peekPhenomenonEggOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<NestOffer | null> {
  'use server';
  return peekPhenomenonEggOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
  );
}

/**
 * Which of this chunk's happenings this player has already walked
 * into this hour. The board stops drawing them: a cloud already dug
 * through is a cell that would answer nothing
 */
export async function listClaimedPhenomena(snapshot: ChunkSnapshot): Promise<number[]> {
  return listClaimedOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    snapshot.offset,
  );
}

async function listClaimedOnServer(
  token: string,
  x: number,
  y: number,
  offset: number,
): Promise<number[]> {
  'use server';
  return listClaimedPhenomenaOnServerSide(
    await requireUid(token),
    x,
    y,
    await syncServerClock(),
    offset,
  );
}

/**
 * Which of this chunk's patches this player has already picked this
 * window. The board draws those as bare bushes: a patch that would
 * answer nothing should not be drawn in fruit
 */
export async function listPickedBerryPatches(snapshot: ChunkSnapshot): Promise<number[]> {
  return listPickedOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    snapshot.offset,
  );
}

async function listPickedOnServer(
  token: string,
  x: number,
  y: number,
  offset: number,
): Promise<number[]> {
  'use server';
  return listPickedBerryPatchesOnServerSide(
    await requireUid(token),
    x,
    y,
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
