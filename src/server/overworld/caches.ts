import 'server-only';
import type { ItemStack } from '../../data/overworld/item-pool';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { getSql } from '../db';
import { asString } from '../read';
import { grantItems } from '../inventory';
import { Landmark, Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { claim, resolveSnapshot } from './claims';

/** The item caches buried in a chunk */
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

  const id = `${cachePrefix(snapshot)}${cell}`;

  // The marker records the whole stash, so what a cache paid is
  // readable afterwards rather than only that it paid
  if (!(await claim('cache_claims', id, { player: uid, items: stash }))) {
    return null;
  }
  await grantStash(uid, stash);
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Cache, 1]]);
  return stash;
}

/**
 * Put a whole stash in the bag, in one transaction, so a stash cannot
 * half-land
 */
export async function grantStash(uid: string, stash: ItemStack[]): Promise<void> {
  await grantItems(
    uid,
    stash.map(({ item, amount }) => [item, amount]),
  );
}

function cachePrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$`;
}

/**
 * Which of this chunk's caches this player has already dug up, inside
 * the window they were buried in.
 *
 * The board draws one of those open and empty, which is the same thing
 * the refusal says in words. Per player and keyed by the window, so a
 * stash one trainer carried off is still buried for the next and the
 * answer empties itself when the window turns over
 */
export async function listClaimedItemCaches(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = cachePrefix(snapshot);
  const rows = await getSql()`
    select marker from cache_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}
