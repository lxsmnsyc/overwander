// Firestore returns untyped documents; the converter below restores
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type DocumentReference,
  type FirestoreDataConverter,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { MAX_LEVEL } from '../data/constants/levels';
import type Families from '../data/ids/families';
import type { Species } from '../data/ids/species';
import { getSpeciesData, isFeaturedSpecies } from '../data/species';
import { asNumber, asString } from './__normalize';
import { type CaughtPokemon, getCaughtRef } from './caught';
import { getFirebaseFirestore } from './firebase';

/**
 * One family's candy stack, stored per family at
 * candies/{uid}:{family} the same way inventory stacks are. A candy
 * feeds any catch of its family, so the stack is keyed by family
 * rather than by species. Firestore security rules must restrict
 * writes to the owning uid
 */
export interface CandyStack {
  /**
   * The owning uid
   */
  user: string;
  /**
   * The evolution family the candy feeds
   */
  family: Families;
  /**
   * How many are held; never goes below zero
   */
  count: number;
}

const CANDY_COLLECTION = 'candies';

const converter: FirestoreDataConverter<CandyStack> = {
  toFirestore: (stack) => stack,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      user: asString(data.user),
      family: asNumber(data.family) as Families,
      count: asNumber(data.count),
    };
  },
};

function stackId(uid: string, family: Families): string {
  return `${uid}:${family}`;
}

function getStackRef(uid: string, family: Families): DocumentReference<CandyStack> {
  return doc(getFirebaseFirestore(), CANDY_COLLECTION, stackId(uid, family)).withConverter(
    converter,
  );
}

/**
 * Every candy stack the user holds; families spent to zero are left
 * out
 */
export async function getCandies(uid: string): Promise<CandyStack[]> {
  const stacks = collection(getFirebaseFirestore(), CANDY_COLLECTION).withConverter(converter);
  const result = await getDocs(query(stacks, where('user', '==', uid)));

  return result.docs.map((entry) => entry.data()).filter((stack) => stack.count > 0);
}

/**
 * How many candies of one family the user holds
 */
export async function getCandyCount(uid: string, family: Families): Promise<number> {
  const snapshot = await getDoc(getStackRef(uid, family));

  return snapshot.data()?.count ?? 0;
}

/**
 * What one catch is worth in candies, and what the family's own day
 * multiplies that to — the same fourfold bonus the species day gives
 * the spawn pool
 */
export const CANDY_PER_CATCH = 1;
export const SPECIES_DAY_CANDY_BOOST = 4;

/**
 * Reward a catch with its family's candy. Catching on the family's
 * own day pays four times as much
 */
export async function grantCatchCandy(
  uid: string,
  species: Species,
  timestamp: number,
): Promise<number> {
  const { family } = getSpeciesData(species);
  const count = isFeaturedSpecies(species, timestamp)
    ? CANDY_PER_CATCH * SPECIES_DAY_CANDY_BOOST
    : CANDY_PER_CATCH;

  await grantCandy(uid, family, count);
  return count;
}

/**
 * Add candies to a family's stack, creating it on first acquisition
 */
export async function grantCandy(uid: string, family: Families, count = 1): Promise<void> {
  await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getStackRef(uid, family);
    const current = (await transaction.get(ref)).data()?.count ?? 0;

    transaction.set(ref, { user: uid, family, count: current + count });
  });
}

/**
 * What one level costs in candies. A shadow is harder to raise: the
 * Shadow ability it keeps is paid for twice over at every level
 */
export const CANDY_PER_LEVEL = 1;
export const SHADOW_CANDY_MULTIPLIER = 2;

/**
 * What raising this catch by one level costs
 */
export function getCandyCost(caught: Pick<CaughtPokemon, 'shadow'>): number {
  return caught.shadow ? CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER : CANDY_PER_LEVEL;
}

/**
 * Spend candies to raise a catch of the same family by a level — one
 * for an ordinary catch, two for a shadow.
 * The candy and the level move together in one transaction, so a
 * candy can never be spent without the level landing. Resolves the
 * new level, or null when the feeding is refused: the catch is not
 * the user's, the family does not match the stack, the user cannot
 * cover the cost, or the catch already sits at MAX_LEVEL
 */
export async function useCandy(uid: string, catchId: string): Promise<number | null> {
  return runTransaction(getFirebaseFirestore(), async (transaction) => {
    const caughtRef = getCaughtRef(catchId);
    const caught = (await transaction.get(caughtRef)).data();

    if (caught == null || caught.owner !== uid || caught.level >= MAX_LEVEL) {
      return null;
    }

    const { family } = getSpeciesData(caught.species);
    const stackRef = getStackRef(uid, family);
    const count = (await transaction.get(stackRef)).data()?.count ?? 0;
    const cost = getCandyCost(caught);

    if (count < cost) {
      return null;
    }

    const level = caught.level + 1;

    transaction.set(stackRef, { user: uid, family, count: count - cost });
    transaction.set(caughtRef, { ...caught, level });
    return level;
  });
}
