import type { Items } from '../data/ids/items';
import healOnServerSide from '../server/healing';
import { requireUid } from '../server/firebase';
import type { HealthState } from './health';
import getIdToken from './session';

/**
 * Healing a pokemon between fights — a berry, a potion, a cure, a
 * revive.
 *
 * What the item does is decided by the server against the stored
 * record; the dialog only says which item and which pokemon. See
 * [`src/auth/health.ts`](./health.ts) for the rules both sides read.
 */

/**
 * Use a healing item from the bag on one of the player's catches.
 * Resolves the health and statuses it now has, or null when the item
 * could not be used: the catch is not the player's, it is fighting,
 * it is still an egg, none of that item is carried, or it would
 * change nothing about the pokemon
 */
export default async function useHealingItem(
  catchId: string,
  item: Items,
): Promise<HealthState | null> {
  return healOnServer(await getIdToken(), catchId, item);
}

async function healOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<HealthState | null> {
  'use server';
  return healOnServerSide(await requireUid(token), catchId, item);
}
