import { doc, getDoc } from 'firebase/firestore';
import type { Species } from '../data/ids/species';
import { getFirebaseFirestore } from './firebase';
import {
  DEX_CAUGHT,
  DEX_SEEN,
  type DexTally,
  POKEDEX_COLLECTION,
  countDexSpecies,
  getDexTally,
  hasCaughtShiny,
  hasSeenSpecies,
  listDexTallies,
  pokedexId,
} from './pokedex-record';

/**
 * The dex as a screen wants it: one read of one document, and every
 * species the player has ever met comes back with it. What it is
 * *stored* as is four maps in that document — see
 * [`pokedex-record.ts`](./pokedex-record.ts).
 *
 * It is read here and written only by the server: a dex is a record of
 * what actually happened, so a client that could write one could claim
 * to have met a Mewtwo it never faced.
 */

/**
 * What a player's dex says, as a whole
 */
export interface PokedexView {
  /**
   * How many distinct species have been met, and how many owned. The
   * two headline figures a dex is read for
   */
  seenSpecies: number;
  caughtSpecies: number;
  /**
   * Every species met, ascending, with the ordinary and sparkling
   * counts behind each
   */
  seen: DexTally[];
  /**
   * Every species owned, on the same terms
   */
  caught: DexTally[];
}

/**
 * The player's whole dex, in one read
 */
async function readPokedex(uid: string): Promise<unknown> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), POKEDEX_COLLECTION, pokedexId(uid)));

  return snapshot.data();
}

/**
 * Everything the dex holds for this player. A dex that was never
 * written reads as an empty one rather than as nothing, so a player
 * who has met nobody yet still has a dex to look at
 */
export async function getPokedex(uid: string): Promise<PokedexView> {
  const stored = await readPokedex(uid);

  return {
    seenSpecies: countDexSpecies(stored, DEX_SEEN),
    caughtSpecies: countDexSpecies(stored, DEX_CAUGHT),
    seen: listDexTallies(stored, DEX_SEEN),
    caught: listDexTallies(stored, DEX_CAUGHT),
  };
}

/**
 * What the dex says about one species: whether it has been met, whether
 * one has been owned, whether a sparkling one ever has, and the counts
 * behind each
 */
export interface SpeciesDexEntry {
  species: Species;
  seen: DexTally;
  caught: DexTally;
  met: boolean;
  owned: boolean;
  shiny: boolean;
}

/**
 * One species' entry, for a sheet that is showing that species rather
 * than the whole dex
 */
export async function getSpeciesDexEntry(uid: string, species: Species): Promise<SpeciesDexEntry> {
  const stored = await readPokedex(uid);
  const caught = getDexTally(stored, DEX_CAUGHT, species);

  return {
    species,
    seen: getDexTally(stored, DEX_SEEN, species),
    caught,
    met: hasSeenSpecies(stored, species),
    owned: caught.total > 0,
    shiny: hasCaughtShiny(stored, species),
  };
}
