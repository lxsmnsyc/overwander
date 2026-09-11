import 'server-only';
import { Items } from '../data/ids/items';
import Landmark from '../data/overworld/landmark';
import getWorld from '../overworld/current';
import { type PortalDestination, portalInRegion } from '../overworld/portal';
import { Metric, Landmark as QuestLandmark } from '../auth/quest-record';
import { consumeItem } from './inventory';
import { resolveSnapshot } from './overworld';
import { bumpProgress } from './quest-progress';
import { isTownFound } from './towns';

/**
 * Crossing the world by portal, written with admin credentials.
 *
 * A crossing takes a Portal Key, which is the whole cost of it, so the
 * key has to leave the bag on the server's word rather than the
 * client's. Everything else about it is derived: whether the cell the
 * player is standing at is a portal at all, and where the named town's
 * own portal stands. The caller names a **region**, never a
 * destination, and it has to be a region somebody actually walked a
 * town in: there is nothing for them to lie about except which way
 * they want to go.
 *
 * Where the player *is* remains theirs. The game stores no position,
 * so this cannot move anybody: it authorizes the crossing, takes the
 * key, and answers with the far end. What walks through is the client
 */

/**
 * Step through a portal to the town named.
 *
 * Resolves the chunk and cell the player comes out at, or null when
 * they are not standing at a portal in a live window, nobody has
 * walked into the town they asked for, or they are not carrying a
 * key.
 *
 * The key is taken **last**, once the crossing is known to be a real
 * one: a player refused a destination should still have their key
 */
export default async function usePortal(
  uid: string,
  x: number,
  y: number,
  cell: number,
  regionX: number,
  regionY: number,
  now: number,
  offset: number,
): Promise<PortalDestination | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  // A portal is a landmark of the chunk itself, so this is the chunk
  // seed's answer rather than the caller's
  if (snapshot == null || snapshot.chunk.getLandmarkCells().get(cell) !== Landmark.Portal) {
    return null;
  }

  // A town nobody has walked into is not somewhere anybody can cross
  // to, however well a player guesses at its name
  if (!(await isTownFound(regionX, regionY))) {
    return null;
  }

  // The register says which region was named and nothing more. Where
  // its portal stands is sited again here, so a hand-written row
  // cannot put anybody somewhere the world does not have a gate
  const destination = portalInRegion(getWorld(), regionX, regionY);

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
