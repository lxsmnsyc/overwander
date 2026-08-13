import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import type { Species } from '../data/ids/species';
import {
  DEX_CAUGHT,
  DEX_SEEN,
  type DexSpec,
  POKEDEX_COLLECTION,
  pokedexId,
} from '../auth/pokedex-record';
import { getAdminFirestore } from './firebase';

/**
 * The dex, written with admin credentials.
 *
 * A dex is a record of what happened rather than something a player
 * owns, so nothing a browser sends may touch it: a client that could
 * write one could claim to have met whatever it liked, and the dex is
 * the game's memory of the player's own history.
 *
 * Every write is an **increment at one field path** — `seen.25`,
 * `caughtShiny.130` — so two species logged in the same breath cannot
 * overwrite each other, and a dex that has never been written is
 * created by the first thing the player meets. Nothing here reads
 * before it writes: the counts only ever go up, so there is no figure
 * to check first and no transaction to hold one still.
 *
 * The counts are historical and permanent. Nothing in the game calls a
 * function that takes one back down — releasing a pokemon, selling it
 * or losing it at auction leaves the dex saying what it always said,
 * which is that the player once had one.
 */

function pokedexRef(uid: string): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(POKEDEX_COLLECTION).doc(pokedexId(uid));
}

/**
 * Add one to a tally. The sparkling ones are counted in the map of
 * their own rather than in both, so the two maps are separate totals
 * and the sum of them is how many were met altogether
 */
async function logSpecies(
  uid: string,
  spec: DexSpec,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await pokedexRef(uid).set(
    { [shiny ? spec.shinyField : spec.field]: { [species]: FieldValue.increment(1) } },
    { merge: true },
  );
}

/**
 * Write down that the player has met one.
 *
 * It is called where an encounter is **staged** rather than where one
 * is finished, so a pokemon that fled, or one a player walked away
 * from, is still one they have seen. The encounter document is written
 * once per spawn and player, so a meeting walked back into is not
 * counted twice
 */
export async function recordSeenSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await logSpecies(uid, DEX_SEEN, species, shiny);
}

/**
 * Write down that the player has come to own one: caught, hatched or
 * given.
 *
 * The **seen** tally is deliberately not touched here. A wild catch was
 * already counted when the meeting was staged, and counting it again
 * would say a player met two Pidgey where they met one. What a gift
 * leaves — something owned that was never met — is answered by
 * `hasSeenSpecies`, which reads both tallies
 */
export async function recordCaughtSpecies(
  uid: string,
  species: Species,
  shiny: boolean,
): Promise<void> {
  await logSpecies(uid, DEX_CAUGHT, species, shiny);
}
