import { requireUid } from '../server/auth';
import {
  discoverTown as discoverOnServerSide,
  listTowns as listOnServerSide,
} from '../server/towns';
import { syncServerClock } from './clock';
import getIdToken from './session';
import type { TownRecord } from './town-record';

export type { TownRecord } from './town-record';

/**
 * Towns as the client asks for them.
 *
 * What a town is called is not one of these questions: a name is
 * worked out from where the town stands, so the client already knows
 * it, for every town in the world, without asking. See
 * [`townName`](../overworld/town.ts).
 *
 * What the server is for is the **register**: which towns anybody has
 * actually walked into. That is the one fact about a town nothing can
 * derive, and it is what the portals cross by
 */

/**
 * Walk into a town and put it on everybody's map. It costs nothing and
 * takes nothing; the first player in is simply who found it.
 *
 * Resolves the town, whoever found it first, or null when the region
 * holds none
 */
export async function discoverTown(regionX: number, regionY: number): Promise<TownRecord | null> {
  return discoverOnServer(await getIdToken(), regionX, regionY);
}

async function discoverOnServer(
  token: string,
  regionX: number,
  regionY: number,
): Promise<TownRecord | null> {
  'use server';
  return discoverOnServerSide(await requireUid(token), regionX, regionY, await syncServerClock());
}

/**
 * Every town anybody has found, by name. This is the knowledgebase the
 * portals travel by: a town one player walked into is one everybody
 * can cross to
 */
export async function listTowns(): Promise<TownRecord[]> {
  return listOnServer(await getIdToken());
}

async function listOnServer(token: string): Promise<TownRecord[]> {
  'use server';
  await requireUid(token);
  return listOnServerSide();
}
