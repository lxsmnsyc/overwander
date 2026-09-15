import 'server-only';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import { Depth } from '../../overworld/depth';
import { asOffset, toLocalTime, toZoneKey } from '../../auth/local-time';
import { getSql } from '../db';
import { asNumber, asString } from '../read';
import { berryPrefix } from './berries';
import { cachePrefix } from './caches';
import { phenomenonPrefix } from './phenomena';

/** What a player has already taken out of one chunk this window, by cell */
export interface ChunkClaims {
  phenomena: number[];
  patches: number[];
  caches: number[];
}

/** A chunk whose claims are asked for */
export interface ClaimedChunk {
  x: number;
  y: number;
}

/** The most chunks one call may ask about, so a caller cannot ask for the whole world */
export const CLAIM_CHUNK_LIMIT = 32;

/** The cells of the markers under one chunk's prefix */
function cellsUnder(markers: string[], prefix: string): number[] {
  const cells: number[] = [];

  for (const marker of markers) {
    if (!marker.startsWith(prefix)) {
      continue;
    }

    const cell = Number(marker.slice(prefix.length));

    if (Number.isInteger(cell)) {
      cells.push(cell);
    }
  }
  return cells;
}

/**
 * Which cells of many chunks this player has already taken something
 * from, inside each chunk's live window.
 *
 * One read for the windows and one per kind of claim, whatever the number
 * of chunks. Answers in the order asked, and empty for a chunk with no
 * live window, since nothing in it can have been claimed
 */
export async function listChunkClaims(
  uid: string,
  chunks: ClaimedChunk[],
  now: number,
  offset: number,
  depth: Depth = Depth.Surface,
): Promise<ChunkClaims[]> {
  if (chunks.length > CLAIM_CHUNK_LIMIT) {
    throw new Error('Too many chunks asked about at once.');
  }

  const zone = asOffset(offset);
  const world = getWorld(depth);
  const sql = getSql();
  const seeds: string[] = [];
  const pieces = [];

  for (const { x, y } of chunks) {
    const chunk = world.getChunk(x, y);

    pieces.push(chunk);
    seeds.push(chunk.seed);
  }
  if (seeds.length === 0) {
    return [];
  }

  const windows = new Map<string, number>();

  for (const row of await sql`
    select chunk_seed, window_at from snapshots
    where zone = ${toZoneKey(zone)} and chunk_seed = any(${seeds})
  `) {
    windows.set(asString(row.chunk_seed), asNumber(row.window_at));
  }

  // The same expiry `resolveSnapshot` applies to one chunk
  const snapshots: (ChunkSnapshot | null)[] = [];

  for (const chunk of pieces) {
    const timestamp = windows.get(chunk.seed) ?? 0;

    snapshots.push(
      timestamp === 0 || toLocalTime(now, zone) >= timestamp + SNAPSHOT_INTERVAL
        ? null
        : new ChunkSnapshot(chunk, timestamp, zone),
    );
  }

  const markers = async (
    table: string,
    prefixOf: (snapshot: ChunkSnapshot) => string,
  ): Promise<string[]> => {
    const patterns: string[] = [];

    for (const snapshot of snapshots) {
      if (snapshot != null) {
        patterns.push(`${prefixOf(snapshot)}%`);
      }
    }
    if (patterns.length === 0) {
      return [];
    }

    const found: string[] = [];

    for (const row of await sql`
      select marker from ${sql(table)}
      where player = ${uid} and marker like any(${patterns})
    `) {
      found.push(asString(row.marker));
    }
    return found;
  };

  const [phenomena, patches, caches] = await Promise.all([
    markers('phenomenon_claims', phenomenonPrefix),
    markers('berry_claims', berryPrefix),
    markers('cache_claims', cachePrefix),
  ]);
  const answers: ChunkClaims[] = [];

  for (const snapshot of snapshots) {
    answers.push(
      snapshot == null
        ? { phenomena: [], patches: [], caches: [] }
        : {
            phenomena: cellsUnder(phenomena, phenomenonPrefix(snapshot)),
            patches: cellsUnder(patches, berryPrefix(snapshot)),
            caches: cellsUnder(caches, cachePrefix(snapshot)),
          },
    );
  }
  return answers;
}

/** A chunk asked about with the zone and layer its window is read in */
export interface ClaimQuery extends ClaimedChunk {
  offset: number;
  depth: Depth;
}

/**
 * `listChunkClaims` for chunks that may differ in zone or layer, answered
 * in the order asked. A board asks in one zone and layer, so this is one
 * group in practice
 */
export async function listClaimsFor(
  uid: string,
  queries: ClaimQuery[],
  now: number,
): Promise<ChunkClaims[]> {
  if (queries.length > CLAIM_CHUNK_LIMIT) {
    throw new Error('Too many chunks asked about at once.');
  }

  const groups = new Map<
    string,
    { offset: number; depth: Depth; at: number[]; chunks: ClaimedChunk[] }
  >();

  for (const [at, { x, y, offset, depth }] of queries.entries()) {
    const key = `${depth}|${offset}`;
    const group = groups.get(key) ?? { offset, depth, at: [], chunks: [] };

    group.at.push(at);
    group.chunks.push({ x, y });
    groups.set(key, group);
  }

  const answers: ChunkClaims[] = [];
  const reads: Promise<void>[] = [];

  for (const group of groups.values()) {
    reads.push(
      listChunkClaims(uid, group.chunks, now, group.offset, group.depth).then((found) => {
        for (const [index, answer] of found.entries()) {
          answers[group.at[index]] = answer;
        }
      }),
    );
  }
  await Promise.all(reads);
  return answers;
}
