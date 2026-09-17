import 'server-only';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../overworld/chunk-snapshot';
import getWorld, { WORLD_GENERATION } from '../../overworld/current';
import { Depth } from '../../overworld/depth';
import { asOffset, toLocalTime } from '../../auth/local-time';
import { CLAIM_CHUNK_LIMIT } from '../../auth/snapshot-record';
import { getSql } from '../db';
import { asString } from '../read';
import { berryPrefix } from './berries';
import { cachePrefix } from './caches';
import { honeyPrefix } from './honey';
import { phenomenonPrefix } from './phenomena';

/** What a player has already taken out of one chunk this window, by cell */
export interface ChunkClaims {
  phenomena: number[];
  patches: number[];
  caches: number[];
  /** Honey trees lathered, kept in the berry ledger under their own prefix */
  honey: number[];
}

/** A chunk whose claims are asked for */
export interface ClaimedChunk {
  x: number;
  y: number;
}

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
 * from this window.
 *
 * One read per kind of claim, whatever the number of chunks. A claim is
 * stamped with its landmark or phenomenon window, which the clock alone
 * decides, so a chunk nobody has published this quarter hour still
 * answers: the board draws its caches and honey trees all the same.
 * Answers in the order asked
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
  const current = Math.floor(toLocalTime(now, zone) / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
  const snapshots: ChunkSnapshot[] = [];

  for (const { x, y } of chunks) {
    snapshots.push(new ChunkSnapshot(world.getChunk(x, y), current, zone));
  }
  if (snapshots.length === 0) {
    return [];
  }

  const markers = async (
    table: string,
    prefixOf: (snapshot: ChunkSnapshot) => string,
  ): Promise<string[]> => {
    const patterns: string[] = [];

    for (const snapshot of snapshots) {
      patterns.push(`${prefixOf(snapshot)}%`);
    }

    const found: string[] = [];

    for (const row of await sql`
      select marker from ${sql(table)}
      where generation = ${WORLD_GENERATION} and player = ${uid} and marker like any(${patterns})
    `) {
      found.push(asString(row.marker));
    }
    return found;
  };

  const [phenomena, patches, caches, honey] = await Promise.all([
    markers('phenomenon_claims', phenomenonPrefix),
    markers('berry_claims', berryPrefix),
    markers('cache_claims', cachePrefix),
    markers('berry_claims', honeyPrefix),
  ]);
  const answers: ChunkClaims[] = [];

  for (const snapshot of snapshots) {
    answers.push({
      phenomena: cellsUnder(phenomena, phenomenonPrefix(snapshot)),
      patches: cellsUnder(patches, berryPrefix(snapshot)),
      caches: cellsUnder(caches, cachePrefix(snapshot)),
      honey: cellsUnder(honey, honeyPrefix(snapshot)),
    });
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
