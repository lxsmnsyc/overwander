import type Biome from '../data/ids/biome';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { PortalDestination } from '../overworld/portal';
import { requireUid } from '../server/auth';
import usePortalOnServerSide from '../server/portals';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * Stepping through a portal.
 *
 * Where a portal comes out derives from the chunk it stands in and the
 * biome the traveller names, so the client already knows every
 * destination on offer — `findPortals` in
 * [`src/overworld/portal.ts`](../overworld/portal.ts) is what the
 * dialog lists. This is for the part that is not the client's: the key
 * leaving the bag.
 */

/**
 * Cross to the nearest portal of the biome named. The key is spent in
 * the crossing.
 *
 * Resolves where the player comes out, or null when they are not at a
 * portal, no portal of that biome is in reach, or they carry no key
 */
export default async function usePortal(
  snapshot: ChunkSnapshot,
  cell: number,
  biome: Biome,
): Promise<PortalDestination | null> {
  return usePortalOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    biome,
    snapshot.offset,
  );
}

async function usePortalOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  biome: Biome,
  offset: number,
): Promise<PortalDestination | null> {
  'use server';
  return usePortalOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    biome,
    await syncServerClock(),
    offset,
  );
}
