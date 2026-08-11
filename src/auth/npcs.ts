import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { requireUid } from '../server/firebase';
import {
  boostEgg as boostOnServerSide,
  breedCatches as breedOnServerSide,
  visitNurse as visitNurseOnServerSide,
} from '../server/npcs';
import { syncServerClock } from './clock';
import { getLocale } from './local-time';
import getIdToken from './session';

/**
 * The wandering NPCs, as the client asks them for things.
 *
 * Which of them is standing at a cell derives from the chunk, the
 * zone and the window, so the client already knows who it is walking up
 * to — `ChunkSnapshot.getWanderingNpcs`. The calls below are for what
 * they *do*, all of which costs gold and none of which the client is
 * trusted with: the server re-derives who is standing there before it
 * charges anything.
 */

/**
 * Leave two pokemon with the breeder and take the egg. Both must be
 * the player's, neither may be an egg or in a battle, and the two
 * have to be compatible — the pairing rules are checked again on the
 * server, from the stored records.
 *
 * Resolves the new egg's catch id, or null when the breeder refuses
 * or the fee cannot be paid
 */
export async function breed(
  snapshot: ChunkSnapshot,
  cell: number,
  parents: [string, string],
): Promise<string | null> {
  return breedOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    parents,
    snapshot.offset,
    getLocale(),
  );
}

async function breedOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  parents: [string, string],
  offset: number,
  locale: string,
): Promise<string | null> {
  'use server';
  return breedOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    parents,
    await syncServerClock(),
    offset,
    locale,
  );
}

/**
 * Have the daycare lady warm an egg: half of what hatching costs is
 * added to wherever it already was, so an egg a quarter of the way
 * along comes out three quarters of the way. An egg already ready to
 * hatch is refused.
 *
 * Resolves the egg's new step count, or null when she refuses
 */
export async function boostEgg(
  snapshot: ChunkSnapshot,
  cell: number,
  catchId: string,
): Promise<number | null> {
  return boostOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catchId,
    snapshot.offset,
  );
}

async function boostOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  offset: number,
): Promise<number | null> {
  'use server';
  return boostOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catchId,
    await syncServerClock(),
    offset,
  );
}

/**
 * Hand a party to Nurse Joy. Up to `NURSE_CARE_LIMIT` of them come
 * back at full health with nothing left on them, and any shadow among
 * them comes back purified — the Shadow ability replaced, the doubled
 * candy cost gone, every value two higher.
 *
 * She takes nothing for it. What she asks instead is that it be once:
 * the server marks the visit against her window, and a party that
 * needed nothing is turned away without spending it.
 *
 * Resolves the ids she actually tended, or null when she is not
 * standing there, there was nothing to do, or this window's visit has
 * already been made
 */
export async function visitNurse(
  snapshot: ChunkSnapshot,
  cell: number,
  catches: string[],
): Promise<string[] | null> {
  return visitNurseOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catches,
    snapshot.offset,
  );
}

async function visitNurseOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  offset: number,
): Promise<string[] | null> {
  'use server';
  return visitNurseOnServerSide(
    await requireUid(token),
    x,
    y,
    cell,
    catches,
    await syncServerClock(),
    offset,
  );
}
