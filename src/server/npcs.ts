import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { boostedSteps, stepsRemaining } from '../auth/egg';
import Npc, { BREEDING_FEE, DAYCARE_FEE } from '../data/overworld/npc';
import type { Species } from '../data/ids/species';
import { type BreedingParent, getEggSpecies } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { grantBredEgg } from './eggs';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { resolveSnapshot } from './overworld';
import { grantGold, spendGold } from './profile';
import { docData } from './read';

/**
 * The people a player meets at a wandering-NPC cell, and what they
 * do for a fee.
 *
 * Who is standing there is not the caller's to say: it is re-derived
 * from the chunk, the zone and the hour before anything is charged,
 * so asking a breeder to push an egg along — or asking either of them
 * from a cell that has neither — is refused rather than paid for.
 *
 * Both services take gold first and hand over afterwards, and both
 * put the gold back if the write behind it fails. A player who is
 * charged and given nothing is worse off than one who is refused.
 */

/**
 * Who is standing at the cell this hour, or null when the player is
 * not at a live window, the cell holds no wandering NPC, or somebody
 * else is standing there
 */
async function resolveNpc(
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  expected: Npc,
): Promise<ChunkSnapshot | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const standing = snapshot?.getWanderingNpcs().get(cell);

  return snapshot != null && standing === expected ? snapshot : null;
}

/**
 * One parent as the breeding rules read it, from a stored catch the
 * player must own and must not have fighting
 */
function asParent(caught: Record<string, unknown> | null, uid: string): BreedingParent | null {
  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }

  const record = asCaughtPokemon(caught);

  return {
    species: record.species,
    gender: record.gender,
    ivs: record.ivs,
    moves: record.moves,
    shadow: record.shadow,
    egg: record.egg,
  };
}

/**
 * Leave two pokemon with the breeder. The pair is checked against the
 * breeding rules here, from the stored records rather than from what
 * the caller says about them, and the fee is only taken once the two
 * are known to be compatible.
 *
 * Neither parent is consumed or held: they are handed back the moment
 * the egg is written, which is why nothing about them is locked.
 *
 * Resolves the new egg's catch id, or null when the pair cannot
 * breed, the player cannot pay, or no breeder is standing there
 */
export async function breedCatches(
  uid: string,
  x: number,
  y: number,
  cell: number,
  parents: [string, string],
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const [left, right] = parents;

  // A pokemon cannot be both parents; the pair has to be two
  if (left === right || left === '' || right === '') {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Breeder);

  if (snapshot == null) {
    return null;
  }

  const db = getAdminFirestore();
  const stored = await db.getAll(
    db.collection(CAUGHT_COLLECTION).doc(left),
    db.collection(CAUGHT_COLLECTION).doc(right),
  );
  const pair = stored.map((entry) => asParent(docData(entry), uid));
  const [first, second] = pair;

  if (first == null || second == null) {
    return null;
  }

  const species: Species | null = getEggSpecies(first, second);

  if (species == null) {
    return null;
  }
  if (!(await spendGold(uid, BREEDING_FEE))) {
    return null;
  }

  // Seeded by the pair and the hour, so this visit's egg is this
  // visit's egg — and by the instant, so the same pair left again is
  // a different one
  const seed = `${snapshot.key}${snapshot.raidTimestamp}breed${cell}:${uid}:${left}:${right}:${now}`;

  try {
    return await grantBredEgg(uid, snapshot, seed, species, [first, second], now, offset, locale);
  } catch (error) {
    // The fee bought an egg that was never written; the player keeps
    // their gold rather than the breeder keeping both
    await grantGold(uid, BREEDING_FEE);
    throw error;
  }
}

/**
 * Have the daycare lady warm an egg along: half of what hatching
 * costs is added to wherever it already was, so an egg a quarter of
 * the way along comes out three quarters of the way.
 *
 * The boost is a share of the requirement rather than a place on it,
 * which means an egg past the half-way mark is finished by one and
 * any egg is finished by two. That is what the fee is for.
 *
 * Resolves how far along the egg now is, or null when it is not the
 * player's, is not an egg, is already ready to hatch, or no daycare
 * lady is standing there
 */
export async function boostEgg(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.DaycareLady);

  if (snapshot == null) {
    return null;
  }

  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
  const stored = docData(await ref.get());

  if (stored == null || stored.owner !== uid || stored.egg !== true || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // An egg already at the finish line has nothing left to buy
  if (stepsRemaining(caught) === 0) {
    return null;
  }

  const warmed = boostedSteps(caught);

  if (!(await spendGold(uid, DAYCARE_FEE))) {
    return null;
  }

  try {
    // The stamp moves with it: the steps were not walked, so the time
    // they would have taken must not be banked for the next report
    await ref.update({ steps: warmed, steppedAt: now });
  } catch (error) {
    await grantGold(uid, DAYCARE_FEE);
    throw error;
  }
  return warmed;
}
