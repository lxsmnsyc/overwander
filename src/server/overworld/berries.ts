import 'server-only';
import type { ItemStack } from '../../data/overworld/item-pool';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { getSql } from '../db';
import { asString } from '../read';
import { grantItem } from '../inventory';
import { Landmark, Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { claim, resolveSnapshot } from './claims';

/** The berry patches, and the apricorn trees beside them */
function berryPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$berry`;
}

/**
 * Which of this chunk's patches this player has already picked, inside
 * the window they grew in.
 *
 * The board draws a picked patch as the bare bush it now is, which is
 * the same thing the refusal says in words. It is per player, so a
 * bush one trainer stripped is still in fruit for the next, and the
 * markers are keyed by the window, so the answer empties itself when
 * the patches grow again
 */
export async function listPickedBerryPatches(
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

  const prefix = berryPrefix(snapshot);
  const rows = await getSql()`
    select marker from berry_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
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
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
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
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
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
