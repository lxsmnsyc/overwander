// Rows arrive untyped; the converters below restore const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { ItemStack } from '../data/overworld/item-pool';
import type Chunk from '../overworld/chunk';
import { WORLD_GENERATION } from '../overworld/current';
import type { Depth } from '../overworld/depth';
import ChunkSnapshot, {
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../overworld/chunk-snapshot';
import { LURE_SPAWN_BONUS } from '../overworld/abilities/__create';
import {
  CLAIM_CHUNK_LIMIT,
  type SnapshotRecord,
  asSnapshotRecord,
  spawnId,
} from './snapshot-record';
import { requireUid } from '../server/auth';
import { Pace } from '../server/pace';
import check, {
  CELL,
  CHUNK_COORDINATE,
  CLAIM_QUERIES,
  DEPTH,
  ID,
  LOCALE,
  OFFSET,
  TOKEN,
} from '../server/validate';
import {
  type ChunkClaims,
  type ClaimQuery,
  type LatherResult,
  type NestOffer,
  claimApricornTree as claimApricornOnServerSide,
  claimBerryPatch as claimBerryOnServerSide,
  claimItemCache as claimCacheOnServerSide,
  claimNest as claimNestOnServerSide,
  claimPhenomenon as claimPhenomenonOnServerSide,
  latherHoneyTree as latherHoneyTreeOnServerSide,
  listClaimsFor as listClaimsForOnServerSide,
  meetSpawn,
  peekNest as peekNestOnServerSide,
  peekPhenomenonEgg as peekPhenomenonEggOnServerSide,
} from '../server/overworld';
import batchedQuery from '../utils/batched-query';
import { localNow, syncServerClock } from './clock';
import { asRecord, asRecordArray } from './__normalize';
import { asOffset, getLocale, toZoneKey } from './local-time';
import type { EncounterRecord } from './encounter-record';
import getSupabase, { type Unwatch, watchTable } from './supabase';
import getIdToken from './session';

export type { LatherResult } from '../server/overworld';

/** The stored window plus its spawn rows, in the record shape */
async function readSnapshotWindow(chunk: Chunk, offset: number): Promise<SnapshotRecord | null> {
  const { data } = await getSupabase()
    .from('snapshots')
    .select(
      'chunk_seed, zone, utc_offset, window_at, snapshot_spawns(idx, species, individual_value, trait_value)',
    )
    .eq('generation', WORLD_GENERATION)
    .eq('chunk_seed', chunk.seed)
    .eq('zone', toZoneKey(asOffset(offset)))
    .maybeSingle();

  return data == null ? null : fromSnapshotRow(asRecord(data));
}

function fromSnapshotRow(row: Record<string, unknown>): SnapshotRecord {
  const spawns = asRecordArray(row.snapshot_spawns).sort(
    (left, right) => Number(left.idx ?? 0) - Number(right.idx ?? 0),
  );
  const rolls: Record<string, unknown>[] = [];

  for (const entry of spawns) {
    rolls.push({
      species: entry.species,
      individualValue: entry.individual_value,
      traitValue: entry.trait_value,
    });
  }
  return asSnapshotRecord({
    seed: row.chunk_seed,
    offset: row.utc_offset,
    timestamp: row.window_at,
    spawns: rolls,
  });
}

/**
 * How many spawns a visit publishes: the ordinary eight plus the
 * three a lure draws in, rolled for every window so that a lure
 * changes who can see them rather than whether they exist.
 *
 * It lives beside the publishing rather than with the board's own
 * measurements, because a claim refreshes the window too and has no
 * business knowing how the board is laid out
 */
export const PUBLISHED_SPAWNS = SPAWN_COUNT + LURE_SPAWN_BONUS;

/**
 * Make sure the chunk's window is live before a landmark is claimed.
 *
 * A claim against a window that has turned over is refused, and the
 * window is republished only when the player presses the ground. So a
 * player standing at a cache when the boundary passed pressed it, was
 * told there was nothing there, and had to walk out of the chunk and
 * back in before the same cache would pay. Landmarks run on a longer
 * window than spawns do, so the cache is nearly always still there:
 * what had run out was the publication, not the thing
 */
async function freshenWindow(snapshot: ChunkSnapshot): Promise<void> {
  await syncServerClock();
  if (localNow(snapshot.offset) < snapshot.timestamp + SNAPSHOT_INTERVAL) {
    return;
  }
  await resolveSnapshotWindow(snapshot.chunk, snapshot.offset, PUBLISHED_SPAWNS);
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
  /** The stored window, when the caller has just read it, so it is not read again */
  known?: SnapshotRecord | null,
): Promise<SnapshotRecord> {
  // The instant must come from the server's clock: a player whose
  // device is skewed would otherwise refresh a live window early or
  // hold an expired one. Only the zone it is read in is the player's
  await syncServerClock();

  const existing = known === undefined ? await readSnapshotWindow(chunk, offset) : known;
  const now = localNow(offset);

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
  const rolled: SnapshotRecord['spawns'] = [];

  for (const [species, individualValue, traitValue] of new ChunkSnapshot(
    chunk,
    timestamp,
    offset,
  ).getSpawns(count)) {
    rolled.push({ species, individualValue, traitValue });
  }

  const record: SnapshotRecord = {
    seed: chunk.seed,
    offset: asOffset(offset),
    timestamp,
    spawns: rolled,
  };

  // The publish is a definer function: shape-checked, and monotonic,
  // so two racing publishers converge on one stored window. Not read
  // back: a publisher that lost the race lost it to the same window,
  // and a window's spawns are rolled from the chunk, the window and
  // the zone alone, so what was stored is what was rolled here
  await getSupabase().rpc('publish_snapshot', {
    p_generation: WORLD_GENERATION,
    p_seed: chunk.seed,
    p_zone: toZoneKey(asOffset(offset)),
    p_offset: asOffset(offset),
    p_window: timestamp,
    p_spawns: record.spawns,
  });

  return record;
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
    .eq('generation', WORLD_GENERATION)
    .eq('chunk_seed', seed);

  const windows: SnapshotRecord[] = [];

  for (const row of asRecordArray(data)) {
    windows.push(fromSnapshotRow(row));
  }
  return windows;
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
  /** The window already held, so a change announcing that same window is not read */
  heldAt?: () => number | undefined,
  /** A window kept from before, which stands in for the first read */
  kept?: SnapshotRecord,
): Unwatch {
  const zone = toZoneKey(asOffset(offset));

  // The filter can only name the chunk, so another zone's window is turned away here
  return watchTable(
    'snapshots',
    [`chunk_seed=eq.${chunk.seed}`],
    async () => readSnapshotWindow(chunk, offset),
    onChange,
    {
      wanted: (row) => row.zone === zone && Number(row.window_at) !== heldAt?.(),
      initial: kept == null ? undefined : { value: kept },
    },
  );
}

/**
 * Visit a chunk and hand back its current window, publishing it when it
 * is missing or has run out. `known` is the stored window the caller
 * already holds, which spares reading it again
 */
export async function visitChunkWindow(
  chunk: Chunk,
  count: number,
  offset: number,
  known?: SnapshotRecord | null,
): Promise<SnapshotRecord> {
  return resolveSnapshotWindow(chunk, offset, count, known);
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
  const record = await visitChunkWindow(chunk, count, offset);
  // A spawn is named after the snapshot's key, which is what the
  // server re-derives the name from
  const key = new ChunkSnapshot(chunk, record.timestamp, offset).key;

  const spawns: [string, Spawn][] = [];

  for (const [index, roll] of record.spawns.entries()) {
    spawns.push([
      spawnId(key, record.timestamp, index),
      [roll.species, roll.individualValue, roll.traitValue],
    ]);
  }
  return spawns;
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
  await freshenWindow(snapshot);
  return claimCacheOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function claimCacheOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<ItemStack[] | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return claimCacheOnServerSide(
    await requireUid(token, Pace.Claim),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    depth,
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
  await freshenWindow(snapshot);
  return claimBerryOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function claimBerryOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<ItemStack | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return claimBerryOnServerSide(
    await requireUid(token, Pace.Claim),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    depth,
  );
}

/**
 * Pick an apricorn tree: everything ripe on it lands in the player's
 * bag, once per window, guarded the way a berry patch is
 */
export async function claimApricornTree(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<ItemStack | null> {
  await freshenWindow(snapshot);
  return claimApricornOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function claimApricornOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<ItemStack | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return claimApricornOnServerSide(
    await requireUid(token, Pace.Claim),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    depth,
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
  await freshenWindow(snapshot);
  return peekNestOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function peekNestOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<NestOffer | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return peekNestOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    depth,
  );
}

/**
 * The same question of a phenomenon cell, and only of the egg: an
 * item and a pokemon are walked into as they always were
 */
export async function peekPhenomenonEgg(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<NestOffer | null> {
  await freshenWindow(snapshot);
  return peekPhenomenonEggOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function peekPhenomenonEggOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<NestOffer | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return peekPhenomenonEggOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    depth,
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
  await freshenWindow(snapshot);
  return claimNestOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    getLocale(),
    snapshot.depth,
  );
}

async function claimNestOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  locale: string,
  depth: Depth,
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(LOCALE, locale);
  check(DEPTH, depth);
  return claimNestOnServerSide(
    await requireUid(token, Pace.Claim),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    locale,
    depth,
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
  await freshenWindow(snapshot);
  return claimPhenomenonOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    getLocale(),
    snapshot.depth,
  );
}

async function claimPhenomenonOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  locale: string,
  depth: Depth,
): Promise<PhenomenonClaim | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(LOCALE, locale);
  check(DEPTH, depth);
  return claimPhenomenonOnServerSide(
    await requireUid(token, Pace.Claim),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
    locale,
    depth,
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
    snapshot.depth,
  );
}

async function meetSpawnOnServer(
  token: string,
  x: number,
  y: number,
  spawn: string,
  offset: number,
  depth: Depth,
): Promise<EncounterRecord | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(ID, spawn);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return meetSpawn(await requireUid(token), x, y, spawn, await syncServerClock(), offset, depth);
}

function claimKey(query: ClaimQuery): string {
  return `${query.depth}|${query.offset}|${query.x},${query.y}`;
}

async function listClaimsOnServer(token: string, queries: ClaimQuery[]): Promise<ChunkClaims[]> {
  'use server';
  check(TOKEN, token);
  check(CLAIM_QUERIES, queries);
  return listClaimsForOnServerSide(await requireUid(token), queries, await syncServerClock());
}

/**
 * Every claim list the board asks for in the same moment, in one server
 * call. A window turning over asks three lists of every chunk in range,
 * so they all land here together and a chunk's three share one answer
 */
const readChunkClaims = batchedQuery(
  async (queries: ClaimQuery[]): Promise<ChunkClaims[]> =>
    listClaimsOnServer(await getIdToken(), queries),
  // Answered in the order asked, so a query's place in the batch is its answer
  (answers, _query, index): ChunkClaims =>
    answers.at(index) ?? { phenomena: [], patches: [], caches: [], honey: [] },
  { key: claimKey, limit: CLAIM_CHUNK_LIMIT },
);

async function claimsOf(snapshot: ChunkSnapshot): Promise<ChunkClaims> {
  return readChunkClaims({
    x: snapshot.chunk.x,
    y: snapshot.chunk.y,
    offset: snapshot.offset,
    depth: snapshot.depth,
  });
}

/**
 * Which of this chunk's happenings this player has already walked
 * into this hour. The board stops drawing them: a cloud already dug
 * through is a cell that would answer nothing
 */
export async function listClaimedPhenomena(snapshot: ChunkSnapshot): Promise<number[]> {
  return (await claimsOf(snapshot)).phenomena;
}

/**
 * Which of this chunk's patches this player has already picked this
 * window. The board draws those as bare bushes: a patch that would
 * answer nothing should not be drawn in fruit
 */
export async function listPickedBerryPatches(snapshot: ChunkSnapshot): Promise<number[]> {
  return (await claimsOf(snapshot)).patches;
}

/**
 * Which of this chunk's caches this player has already dug up this
 * window. The board draws those open and empty, for the same reason it
 * draws a picked patch bare
 */
export async function listClaimedItemCaches(snapshot: ChunkSnapshot): Promise<number[]> {
  return (await claimsOf(snapshot)).caches;
}

/** Which of this chunk's honey trees this player has lathered this window */
export async function listLatheredHoneyTrees(snapshot: ChunkSnapshot): Promise<number[]> {
  return (await claimsOf(snapshot)).honey;
}

/** Lather a honey tree: one jar spent, and whatever it draws out met on the spot */
export async function latherHoneyTree(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<LatherResult | null> {
  await freshenWindow(snapshot);
  return latherOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function latherOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<LatherResult | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  return latherHoneyTreeOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    await syncServerClock(),
    offset,
  );
}
