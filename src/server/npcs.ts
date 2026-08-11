import 'server-only';
import { asCaughtPokemon, isShadow } from '../auth/caught-record';
import { CAUGHT_COLLECTION, NPC_CLAIM_COLLECTION } from '../auth/collections';
import { boostedSteps, isEgg, stepsRemaining } from '../auth/egg';
import { getMaxHealth } from '../auth/health';
import { groomedFriendship } from '../data/constants/friendship';
import Npc, {
  BREEDING_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NURSE_CARE_LIMIT,
} from '../data/overworld/npc';
import type { Species } from '../data/ids/species';
import { isPurifiable, purifyIVs } from '../data/items/purifying-gem';
import { type BreedingParent, getEggSpecies } from '../overworld/breeding';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { grantBredEgg } from './eggs';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { claim, resolveSnapshot } from './overworld';
import { grantGold, spendGold } from './profile';
import { purifiedFields } from './purify';
import { type UpdateFields, docData } from './read';

/**
 * The people a player meets at a wandering-NPC cell, and what they do.
 *
 * Who is standing there is not the caller's to say: it is re-derived
 * from the chunk, the zone and the window before anything happens, so
 * asking a breeder to push an egg along — or asking either of them
 * from a cell that has neither — is refused rather than paid for.
 *
 * **Each of them serves a player once per window.** Whoever is at the
 * cell stands there for `NPC_INTERVAL`, and a marker in `npcClaims`
 * records that this player has been seen; a second ask that window is
 * turned away whatever they can pay. It is taken only where the visit
 * actually lands — a pair that cannot breed, an egg already ready to
 * hatch or a party that needed nothing costs nothing — and it is given
 * back if the write behind it fails.
 *
 * The two that charge take the gold after the visit is claimed and put
 * it back if what it bought was never written. A player who is charged
 * and given nothing is worse off than one who is refused.
 */

/**
 * Who is standing at the cell this window, or null when the player is
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
 * Take this window's visit with whoever is standing at the cell.
 *
 * The marker is per NPC, cell, window and player, so walking to
 * another wandering cell finds somebody who has not seen you yet —
 * that walk is what a second egg costs. It is taken as late as the
 * call can manage, once the visit is known to be one that will land,
 * so a refusal never spends it.
 *
 * Resolves the marker's id, or null when this player has already been
 * seen here this window
 */
async function takeVisit(
  snapshot: ChunkSnapshot,
  tag: string,
  cell: number,
  uid: string,
  record: Record<string, unknown> = {},
): Promise<string | null> {
  const id = `${snapshot.key}@${snapshot.npcTimestamp}$${tag}${cell}:${uid}`;

  return (await claim(NPC_CLAIM_COLLECTION, id, { player: uid, ...record })) ? id : null;
}

/**
 * Give the visit back. What it was taken for did not happen, so the
 * window should not be spent on it
 */
async function releaseVisit(id: string): Promise<void> {
  await getAdminFirestore().collection(NPC_CLAIM_COLLECTION).doc(id).delete();
}

/**
 * One parent as the breeding rules read it, from a stored catch the
 * player must own and must not have fighting
 */
function asParent(caught: Record<string, unknown> | null, uid: string): BreedingParent | null {
  // A locked pokemon may still be a parent: breeding changes nothing
  // about either of them — the egg is a third record — and the two are
  // handed straight back
  if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
    return null;
  }

  const record = asCaughtPokemon(caught);

  return {
    species: record.species,
    gender: record.gender,
    ivs: record.ivs,
    moves: record.moves,
    shadow: isShadow(record),
    egg: isEgg(record),
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

  // Claimed before the fee, since a player already seen this window
  // should not be charged to be told so
  const visit = await takeVisit(snapshot, 'breed', cell, uid, { parents: [left, right] });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, BREEDING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  // Seeded by the pair and the window, so this visit's egg is this
  // visit's egg — and by the instant, so the same pair left again is
  // a different one
  const seed = `${snapshot.key}${snapshot.npcTimestamp}breed${cell}:${uid}:${left}:${right}:${now}`;

  try {
    return await grantBredEgg(uid, snapshot, seed, species, [first, second], now, offset, locale);
  } catch (error) {
    // The fee bought an egg that was never written; the player keeps
    // their gold and their visit rather than the breeder keeping both
    await grantGold(uid, BREEDING_FEE);
    await releaseVisit(visit);
    throw error;
  }
}

/**
 * What Nurse Joy did to one pokemon, or null when there was nothing
 * of hers to do for it
 */
function tended(caught: Record<string, unknown>, uid: string): UpdateFields | null {
  // She heals and purifies, and a guarded pokemon is to be left alone
  // on both counts; it is simply not one of the ones she takes
  if (
    caught.owner !== uid ||
    isCatchLocked(caught) ||
    isEggRecord(caught) ||
    isGuardedRecord(caught)
  ) {
    return null;
  }

  const record = asCaughtPokemon(caught);
  const whole = getMaxHealth(record);
  // A shadow is put right as well as patched up, which is the reason
  // to walk to her with one rather than with a potion in hand
  const purified = isPurifiable(record) ? purifiedFields(caught) : null;
  const healed = record.health < whole || record.statuses !== 0;

  if (purified == null && !healed) {
    return null;
  }
  // Purifying raises the pool, and she fills whatever the pool ends up
  // being: the two are one visit, so the order they are written in
  // must not leave the pokemon short
  return {
    ...purified,
    health: getMaxHealth({ ...record, ivs: purifyIVs(record.ivs) }),
    statuses: 0,
  };
}

/**
 * Walk a party up to Nurse Joy. She takes up to `NURSE_CARE_LIMIT` of
 * them, hands every one back at full health with nothing left on it,
 * and purifies any shadow among them — all of it for nothing.
 *
 * What she charges instead is the window: the claim marker at
 * npcClaims/{cell key}:{uid} is taken once she has actually done
 * something, so a player gets one visit per NPC window and an empty
 * ask — a party already whole — costs them nothing.
 *
 * Resolves the ids she tended, or null when she is not standing there,
 * none of them are the player's to hand over, there was nothing to do,
 * or this window's visit has already been made
 */
export async function visitNurse(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  now: number,
  offset: number,
): Promise<string[] | null> {
  if (catches.length === 0 || catches.length > NURSE_CARE_LIMIT) {
    return null;
  }
  // The same pokemon twice would be one write racing another
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.NurseJoy);

  if (snapshot == null) {
    return null;
  }

  const db = getAdminFirestore();
  const refs = catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id));
  const stored = await db.getAll(...refs);
  const care: [FirebaseFirestore.DocumentReference, UpdateFields][] = [];

  for (const [at, entry] of stored.entries()) {
    const caught = docData(entry);
    const fields = caught == null ? null : tended(caught, uid);

    if (fields != null) {
      care.push([refs[at], fields]);
    }
  }

  // Nothing of hers to do, so the visit is not spent on it
  if (care.length === 0) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'nurse', cell, uid, { catches });

  if (visit == null) {
    return null;
  }

  const batch = db.batch();

  for (const [ref, fields] of care) {
    batch.update(ref, fields);
  }

  try {
    await batch.commit();
  } catch (error) {
    // She was asked and did nothing; the window is given back rather
    // than spent on a write that never landed
    await releaseVisit(visit);
    throw error;
  }

  return care.map(([ref]) => ref.id);
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

  if (stored == null || stored.owner !== uid || !isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // An egg already at the finish line has nothing left to buy
  if (stepsRemaining(caught) === 0) {
    return null;
  }

  const warmed = boostedSteps(caught);
  const visit = await takeVisit(snapshot, 'daycare', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, DAYCARE_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    // The stamp moves with it: the steps were not walked, so the time
    // they would have taken must not be banked for the next report
    await ref.update({ steps: warmed, steppedAt: now });
  } catch (error) {
    await grantGold(uid, DAYCARE_FEE);
    await releaseVisit(visit);
    throw error;
  }
  return warmed;
}

/**
 * Have the groomer see to a pokemon: half of whatever friendship it
 * had left to give is added to what it already thinks of its owner.
 *
 * It is the daycare lady's bargain moved from the egg to the pokemon.
 * A share of the remainder rather than a place on it means the first
 * grooming is worth a great deal to a pokemon fresh out of a ball and
 * almost nothing to one that is already inseparable — gold buys the
 * early half of a friendship and can never buy the last of it.
 *
 * Resolves what the pokemon now thinks, or null when it is not the
 * player's, is still an egg, is fighting, already thinks as well of
 * them as it can, or no groomer is standing there
 */
export async function groomCatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = await resolveNpc(x, y, cell, now, offset, Npc.Groomer);

  if (snapshot == null) {
    return null;
  }

  const db = getAdminFirestore();
  const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
  const stored = docData(await ref.get());

  // An egg thinks nothing of anybody yet: what is inside it has not
  // met the player, and the shell is what the daycare lady is for
  // A locked pokemon is still groomed: friendship is the one thing a
  // lock leaves alone, and being fussed over is not being changed
  if (stored == null || stored.owner !== uid || isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);
  const groomed = groomedFriendship(caught.friendship);

  // Nothing left to buy, so nothing is charged
  if (groomed === caught.friendship) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'groom', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, GROOMING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    await ref.update({ friendship: groomed });
  } catch (error) {
    await grantGold(uid, GROOMING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  return groomed;
}
