import type { Items } from '../data/ids/items';
import feedBerryOnServerSide from '../server/berries';
import { requireUid } from '../server/firebase';
import type { HealthState } from './health';
import getIdToken from './session';

/**
 * Feeding a berry to a hurt pokemon.
 *
 * What the berry does is decided by the server against the stored
 * record, from the same tables the battle reads; the dialog only says
 * which berry and which pokemon. See
 * [`src/auth/health.ts`](./health.ts) for the rules both sides read.
 */

/**
 * Feed one of the player's catches a berry from the bag. Resolves the
 * health and status it now has, or null when the berry could not be
 * used: the catch is not the player's, it is fighting, it is still an
 * egg, none of that berry is carried, or the berry would change
 * nothing about it
 */
export default async function feedBerry(catchId: string, item: Items): Promise<HealthState | null> {
  return feedBerryOnServer(await getIdToken(), catchId, item);
}

async function feedBerryOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<HealthState | null> {
  'use server';
  return feedBerryOnServerSide(await requireUid(token), catchId, item);
}
