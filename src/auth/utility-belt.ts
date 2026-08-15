import useUtilityBeltOnServerSide from '../server/utility-belt';
import { requireUid } from '../server/firebase';
import getIdToken from './session';

/**
 * Spending a Utility Belt on a pokemon.
 *
 * How much room a catch has is decided by the server against the
 * stored record, the way a bottle cap's polish is: the dialog says
 * which pokemon, and nothing else.
 */

/**
 * Use a Utility Belt from the bag on one of the player's catches.
 *
 * Resolves the item slots the catch now has, or null when the belt
 * could not be used: the catch is not the player's, it is fighting, it
 * is still an egg, none is carried, or it is already as roomy as a
 * pokemon can be
 */
export default async function useUtilityBelt(catchId: string): Promise<number | null> {
  return useUtilityBeltOnServer(await getIdToken(), catchId);
}

async function useUtilityBeltOnServer(token: string, catchId: string): Promise<number | null> {
  'use server';
  return useUtilityBeltOnServerSide(await requireUid(token), catchId);
}
