import 'server-only';
import { Depth } from '../../overworld/depth';
import type { ItemStack } from '../../data/overworld/item-pool';
import type { Items } from '../../data/ids/items';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
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
  depth: Depth = Depth.Surface,
): Promise<ItemStack[] | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset, depth);
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
  const granted: [Items, number][] = [];

  for (const { item, amount } of stash) {
    granted.push([item, amount]);
  }
  await grantItems(uid, granted);
}

export function cachePrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$`;
}
