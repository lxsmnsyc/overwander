import { readOnly } from '../utils/server-calls';
import type { Species } from '../data/ids/species';
import check, { TOKEN, UID } from '../server/validate';
import {
  type StoredDex,
  readCaughtEntryCount,
  readPokedex as readStoredDex,
} from '../server/pokedex';
import getIdToken from './session';
import { requireUid } from '../server/auth';
import {
  DEX_CAUGHT,
  DEX_SEEN,
  type DexTally,
  countDexSpecies,
  getDexTally,
  hasCaughtShiny,
  hasSeenSpecies,
  listDexTallies,
} from './pokedex-record';

/**
 * The dex as a screen wants it: every species the player has ever met,
 * in one read, collapsed into the map shape
 * [`pokedex-record.ts`](./pokedex-record.ts) describes.
 *
 * Only the server writes one: a dex is a record of what actually
 * happened, so a client that could write one could claim to have met
 * a Mewtwo it never faced
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

/** The player's whole dex, in one read. Another player's reads as empty */
async function readPokedex(uid: string): Promise<StoredDex> {
  return readPokedexOnServer(await getIdToken(), uid);
}

async function readPokedexOnServer(token: string, player: string): Promise<StoredDex> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireUid(token);

  return player === uid
    ? readStoredDex(uid)
    : { seen: {}, seenShiny: {}, caught: {}, caughtShiny: {} };
}
readOnly(readPokedexOnServer);

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
 * How many species the player has ever owned one of.
 *
 * Counted rather than read whole: it is asked when a safari opens, to
 * scale how often a ball holds on the first shake, and the dex itself
 * is a large read for one number
 */
export async function getCaughtSpeciesCount(uid: string): Promise<number> {
  return getCaughtSpeciesCountOnServer(await getIdToken(), uid);
}

async function getCaughtSpeciesCountOnServer(token: string, player: string): Promise<number> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  const uid = await requireUid(token);

  return player === uid ? readCaughtEntryCount(uid) : 0;
}
readOnly(getCaughtSpeciesCountOnServer);

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
 * than the whole dex.
 *
 * A form answers for **itself**, not for the set it belongs to: each
 * shape has a page of its own, reached from the shapes grid, and an
 * Unown Q that reported the alphabet's numbers would be reporting
 * somebody else's
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
