import { isEgg } from '../auth/egg';
import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { BUDDY_COLLECTION, CAUGHT_COLLECTION } from '../auth/collections';
import type { Buddy } from '../overworld/core';
import { getAdminFirestore } from './firebase';
import { docData } from './read';

/**
 * The pokemon at the player's side as it is stored: its id and its
 * raw record, for the callers that have to write to it rather than
 * only read what it changes. Resolves null on the same terms as
 * `resolveBuddy` below — no buddy, or one they no longer own
 */
export async function resolveBuddyCatch(
  uid: string,
): Promise<[string, Record<string, unknown>] | null> {
  const db = getAdminFirestore();
  const buddy = docData(await db.collection(BUDDY_COLLECTION).doc(uid).get());
  const catchId = buddy?.caught;

  if (typeof catchId !== 'string' || catchId === '') {
    return null;
  }

  const stored = docData(await db.collection(CAUGHT_COLLECTION).doc(catchId).get());

  if (stored == null || stored.owner !== uid) {
    return null;
  }
  return [catchId, stored];
}

/**
 * The buddy's abilities, nature, gender and held items — everything
 * the overworld reads off the pokemon at a player's side. Resolves
 * null when they have no buddy, or when the record points at one they
 * no longer own: a trade leaves the buddy record behind, and this is
 * where that is caught
 */
export default async function resolveBuddy(uid: string): Promise<Buddy | null> {
  const resolved = await resolveBuddyCatch(uid);

  if (resolved == null) {
    return null;
  }

  const caught = asCaughtPokemon(resolved[1]);

  // An egg is carried rather than accompanied: it has an ability and
  // a nature written down already, and neither of them is out here
  // doing anything until it hatches
  if (isEgg(caught)) {
    return null;
  }

  return {
    species: caught.species,
    abilities: caught.abilities,
    nature: caught.nature,
    gender: caught.gender,
    items: caught.items,
  };
}
