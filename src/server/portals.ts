import 'server-only';
import type Biome from '../data/ids/biome';
import { Items } from '../data/ids/items';
import Landmark from '../data/overworld/landmark';
import getWorld from '../overworld/current';
import { type PortalDestination, findPortal } from '../overworld/portal';
import { Landmark as QuestLandmark, Metric } from '../auth/quest-record';
import { consumeItem } from './inventory';
import { resolveSnapshot } from './overworld';
import { bumpProgress } from './quest-progress';

/**
 * Crossing the world by portal, written with admin credentials.
 *
 * A crossing takes a Portal Key, which is the whole cost of it, so the
 * key has to leave the bag on the server's word rather than the
 * client's. Everything else about it is derived: whether the cell the
 * player is standing at is a portal at all, and where a portal there
 * comes out for the biome they named. The caller names a **biome**,
 * never a destination — there is nothing for them to lie about except
 * which way they want to go.
 *
 * Where the player *is* remains theirs. The game stores no position,
 * so this cannot move anybody: it authorizes the crossing, takes the
 * key, and answers with the far end. What walks through is the client
 */

/**
 * Step through a portal.
 *
 * Resolves the chunk and cell the player comes out at, or null when
 * they are not standing at a portal in a live window, no portal of
 * that biome is in reach, or they are not carrying a key.
 *
 * The key is taken **last**, once the crossing is known to be a real
 * one: a player refused a destination should still have their key
 */
export default async function usePortal(
  uid: string,
  x: number,
  y: number,
  cell: number,
  biome: Biome,
  now: number,
  offset: number,
): Promise<PortalDestination | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  // A portal is a landmark of the chunk itself, so this is the chunk
  // seed's answer rather than the caller's
  if (snapshot == null || snapshot.chunk.getLandmarkCells().get(cell) !== Landmark.Portal) {
    return null;
  }

  const destination = findPortal(getWorld(), x, y, biome);

  if (destination == null) {
    return null;
  }
  if (!(await consumeItem(uid, Items.PortalKey))) {
    return null;
  }

  // A crossing made is a crossing counted, on the same ledger the
  // ground landmarks use
  await bumpProgress(uid, [[Metric.Landmarks, QuestLandmark.Portal, 1]]);
  return destination;
}
