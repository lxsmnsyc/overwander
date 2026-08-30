import { isEgg } from '../auth/egg';
import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import type { Buddy } from '../overworld/core';
import { readCaughtIn } from './caught-io';
import { getSql } from './db';
import { asString } from './read';

/**
 * The pokemon at the player's side as it is stored: its id and its
 * record shape, for the callers that have to write to it rather than
 * only read what it changes. Resolves null on the same terms as
 * `resolveBuddy` below: no buddy, or one they no longer own
 */
export async function resolveBuddyCatch(
  uid: string,
): Promise<[string, Record<string, unknown>] | null> {
  const sql = getSql();
  // The profile and the catch in one question rather than two. Every
  // landmark a player touches asks this, and a round trip saved here
  // is one saved on each of them
  const rows = await sql`
    select caught.id from profiles
    join caught on caught.id = profiles.buddy_id
    where profiles.id = ${uid} and caught.owner = ${uid}
  `;
  const catchId = asString(rows.at(0)?.id);

  if (catchId === '') {
    return null;
  }

  // Read rather than read-then-write, so it wants no transaction: a
  // BEGIN and a COMMIT round the outside would be two round trips
  // buying no lock
  const stored = await readCaughtIn(sql, catchId, false);

  return stored == null ? null : [catchId, stored];
}

/**
 * What the overworld reads off a stored buddy, or null for one that is
 * not out here doing anything. Separate from the lookup so a caller
 * that already holds the record does not go back for it
 */
export function asBuddy(stored: Record<string, unknown>): Buddy | null {
  const caught = asCaughtPokemon(stored);

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

/**
 * The buddy's abilities, nature, gender and held items: everything
 * the overworld reads off the pokemon at a player's side. Resolves
 * null when they have no buddy, or when the record points at one they
 * no longer own
 */
export default async function resolveBuddy(uid: string): Promise<Buddy | null> {
  const resolved = await resolveBuddyCatch(uid);

  return resolved == null ? null : asBuddy(resolved[1]);
}
