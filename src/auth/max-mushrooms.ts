import useMaxMushroomsOnServerSide from '../server/max-mushrooms';
import { requireUid } from '../server/auth';
import check, { ID, TOKEN } from '../server/validate';
import getIdToken from './session';

/**
 * Feeding Max Mushrooms to a pokemon. Whether its species can take
 * the Gigantamax Factor is decided by the server against the stored
 * record; the dialog says which pokemon and nothing else.
 */

/**
 * Use Max Mushrooms from the bag on one of the player's catches.
 *
 * Resolves true once it carries the Gigantamax Factor, or false when
 * refused: see `useMaxMushrooms` in `src/server/max-mushrooms.ts`
 */
export default async function useMaxMushrooms(catchId: string): Promise<boolean> {
  return useMaxMushroomsOnServer(await getIdToken(), catchId);
}

async function useMaxMushroomsOnServer(token: string, catchId: string): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, catchId);
  return useMaxMushroomsOnServerSide(await requireUid(token), catchId);
}
