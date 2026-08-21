import { isEgg } from './egg';
import type { Buddy } from '../overworld/core';
import { type CaughtPokemon, getCaught } from './caught';
import { getProfile, setBuddyField } from './profile';

/**
 * The pokemon a player keeps at their side.
 *
 * It is `profiles.buddy_id` rather than a table of its own, because
 * nearly every overworld action asks who the buddy is: a table would
 * be a second read for one id. A column grant keeps the player to
 * writing their own, and a trigger keeps it to a catch they own
 */

/**
 * The catch the player is walking with, or null when they walk alone.
 * It may still point at a pokemon they no longer own — `resolveBuddy`
 * checks that
 */
export async function getBuddy(uid: string): Promise<string | null> {
  const buddy = (await getProfile(uid))?.buddy ?? '';

  return buddy === '' ? null : buddy;
}

/**
 * Set the player's buddy. Resolves false (and writes nothing) when
 * the catch does not exist or the player does not own it, so a
 * traded-away pokemon cannot be kept at someone else's side
 */
export async function setBuddy(uid: string, catchId: string): Promise<boolean> {
  const caught = await getCaught(catchId);

  if (caught == null || caught.owner !== uid) {
    return false;
  }
  await setBuddyField(uid, catchId);
  return true;
}

/**
 * Send the buddy back; the player walks alone afterwards
 */
export async function clearBuddy(uid: string): Promise<void> {
  await setBuddyField(uid, '');
}

/**
 * The buddy as the overworld's field effects read it, or null when
 * the player walks alone. The client needs this to show what its
 * abilities change — which pokemon the chunk is holding, and how many
 * of them — before the player walks up to any of them
 */
export async function getBuddyEffects(uid: string): Promise<Buddy | null> {
  const buddy = await resolveBuddy(uid);

  if (buddy == null) {
    return null;
  }

  const [, caught] = buddy;

  // An egg is carried rather than accompanied: what is written inside
  // it changes nothing about the world until it hatches
  if (isEgg(caught)) {
    return null;
  }

  return {
    species: caught.species,
    abilities: caught.abilities,
    items: caught.items,
    nature: caught.nature,
    gender: caught.gender,
  };
}

/**
 * The buddy as a catch id and its record, for the effects that need
 * the species, ability or held items. Resolves null when the player
 * has no buddy, or when the record points at a pokemon that has
 * since changed hands — a trade leaves the buddy record behind, and
 * this is where that is caught
 */
export async function resolveBuddy(uid: string): Promise<[string, CaughtPokemon] | null> {
  const catchId = await getBuddy(uid);

  if (catchId == null) {
    return null;
  }

  const caught = await getCaught(catchId);

  if (caught == null || caught.owner !== uid) {
    return null;
  }
  return [catchId, caught];
}
