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
  where,
} from 'firebase/firestore';
import type Families from '../data/ids/families';
import { asNumber, asString } from './__normalize';
import { CANDY_COLLECTION, candyStackId } from './collections';
import { useCandy as feedOnServer } from '../server/candy';
import { requireUid } from '../server/firebase';
import { getFirebaseFirestore } from './firebase';
import getIdToken from './session';

export {
  CANDY_PER_CATCH,
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
} from './candy-rules';
export { default as getCandyCost } from './candy-rules';

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

function getStackRef(uid: string, family: Families): DocumentReference<CandyStack> {
  return doc(getFirebaseFirestore(), CANDY_COLLECTION, candyStackId(uid, family)).withConverter(
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
 * Candy is paid out by the server, alongside the catch that earned it
 * — see [`src/server/candy.ts`](../server/candy.ts). A client that
 * could write these stacks could write itself levels
 */

/**
 * Spend candies to raise a catch of the same family by a level — one
 * for an ordinary catch, two for a shadow. The server does the
 * spending: the candy and the level move together in one
 * transaction, so a candy can never be spent without the level
 * landing, and the caller is whoever their token says. Resolves the
 * new level, or null when the feeding is refused: the catch is not
 * theirs, the stack cannot cover the cost, or the catch already sits
 * at MAX_LEVEL
 */
export async function useCandy(catchId: string): Promise<number | null> {
  return feedCandyOnServer(await getIdToken(), catchId);
}

async function feedCandyOnServer(token: string, catchId: string): Promise<number | null> {
  'use server';
  return feedOnServer(await requireUid(token), catchId);
}
