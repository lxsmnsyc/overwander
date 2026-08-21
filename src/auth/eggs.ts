import type { Species } from '../data/ids/species';
import { type WalkReport, hatchEgg as hatchOnServerSide, recordSteps } from '../server/eggs';
import { requireUid } from '../server/auth';
import { syncServerClock } from './clock';
import { getLocalOffset } from './local-time';
import getIdToken from './session';

export type { EggWalk, WalkReport } from '../server/eggs';

/**
 * Walking, and what walking is for.
 *
 * Steps are counted by the client — it is the one reading the
 * keyboard — and reported in small batches to whatever egg the player
 * is carrying. The server credits them against its own clock, so a
 * report is worth at most what the time since the last one could have
 * been walked in; see [`src/auth/egg.ts`](./egg.ts) for the rules
 * both sides read.
 */

/**
 * Report steps walked. They go to the player's buddy: an egg is
 * carried closer to hatching, a hatched buddy warms to the player, and
 * a buddy with Pickup turns something up off the path every so often.
 *
 * Resolves what the walk came to, or null when the player walks alone
 */
export async function walk(steps: number): Promise<WalkReport | null> {
  return walkOnServer(await getIdToken(), steps);
}

async function walkOnServer(token: string, steps: number): Promise<WalkReport | null> {
  'use server';
  return recordSteps(await requireUid(token), steps, await syncServerClock());
}

/**
 * Open an egg that has been carried far enough. What is inside was
 * decided when the egg was found, so this reveals rather than rolls —
 * and pays the family's candy, as meeting the pokemon any other way
 * would have.
 *
 * Resolves the species that hatched, or null when the egg is not the
 * player's or has not been walked far enough
 */
export async function hatchEgg(catchId: string): Promise<Species | null> {
  return hatchOnServer(await getIdToken(), catchId, getLocalOffset());
}

async function hatchOnServer(
  token: string,
  catchId: string,
  offset: number,
): Promise<Species | null> {
  'use server';
  return hatchOnServerSide(await requireUid(token), catchId, await syncServerClock(), offset);
}
