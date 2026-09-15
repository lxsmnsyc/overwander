import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { PortalDestination } from '../overworld/portal';
import { requireUid } from '../server/auth';
import usePortalOnServerSide from '../server/portals';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * Stepping through a portal.
 *
 * A crossing is named by the **town** at the far end. Everything about
 * that town derives from the seed, its name included, so the client
 * already knows where it is going; what it cannot know on its own is
 * whether anybody has ever been there, which is the register in
 * [`src/auth/towns.ts`](towns.ts). This is for the parts that are not
 * the client's: that check, and the key leaving the bag.
 */

/**
 * Cross to the portal in the town of the region named. The key is
 * spent in the crossing.
 *
 * Resolves where the player comes out, or null when they are not at a
 * portal, nobody has walked into that town, or they carry no key
 */
export default async function usePortal(
  snapshot: ChunkSnapshot,
  cell: number,
  regionX: number,
  regionY: number,
): Promise<PortalDestination | null> {
  return usePortalOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    regionX,
    regionY,
    snapshot.offset,
  );
}

async function usePortalOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  regionX: number,
  regionY: number,
  offset: number,
): Promise<PortalDestination | null> {
  'use server';
  return usePortalOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    regionX,
    regionY,
    await syncServerClock(),
    offset,
  );
}
