import 'server-only';
import { Depth } from '../../overworld/depth';
import type { ItemStack } from '../../data/overworld/item-pool';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { grantItem } from '../inventory';
import { Landmark, Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { claim, resolveSnapshot } from './claims';

/** The berry patches, and the apricorn trees beside them */
export function berryPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$berry`;
}

/**
 * Pick a berry patch: everything on the bush lands in the bag. A
 * patch bears a handful of one kind rather than a single berry
 */
export async function claimBerryPatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  depth: Depth = Depth.Surface,
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset, depth);
  const berries = snapshot?.getBerryPatches().get(cell);

  if (snapshot == null || berries == null) {
    return null;
  }

  const id = `${berryPrefix(snapshot)}${cell}`;

  if (
    !(await claim('berry_claims', id, {
      player: uid,
      item: berries.item,
      amount: berries.amount,
    }))
  ) {
    return null;
  }
  await grantItem(uid, berries.item, berries.amount);
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Berry, 1]]);
  return berries;
}

/**
 * Pick an apricorn tree: everything ripe on it lands in the bag, the
 * way a berry patch's does.
 *
 * It shares the berry ledger rather than keeping one of its own: a
 * marker names a cell in a window, a cell is a patch or a tree and
 * never both, and what is written down either way is a handful of one
 * item picked off a plant
 */
export async function claimApricornTree(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  depth: Depth = Depth.Surface,
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset, depth);
  const picked = snapshot?.getApricornTrees().get(cell);

  if (snapshot == null || picked == null) {
    return null;
  }

  const id = `${berryPrefix(snapshot)}${cell}`;

  if (
    !(await claim('berry_claims', id, {
      player: uid,
      item: picked.item,
      amount: picked.amount,
    }))
  ) {
    return null;
  }
  await grantItem(uid, picked.item, picked.amount);
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Apricorn, 1]]);
  return picked;
}
