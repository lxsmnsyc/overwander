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
import type { Items } from '../data/ids/items';
import { asNumber, asString } from './__normalize';
import { getFirebaseFirestore } from './firebase';

/**
 * One item stack a user carries, stored per item at
 * inventories/{uid}:{item} so a grant or a spend touches one small
 * document instead of rewriting the whole bag. Firestore security
 * rules must restrict writes to the owning uid. Gold is not here —
 * the balance lives on the user's profile
 */
export interface InventoryEntry {
  /**
   * The owning uid
   */
  user: string;
  /**
   * Which item the stack holds
   */
  item: Items;
  /**
   * How many are carried; entries never drop below zero
   */
  amount: number;
}

const INVENTORY_COLLECTION = 'inventories';

const converter: FirestoreDataConverter<InventoryEntry> = {
  toFirestore: (entry) => entry,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      user: asString(data.user),
      item: asNumber(data.item) as Items,
      amount: asNumber(data.amount),
    };
  },
};

/**
 * The stack's document id: one per user and item pair, so the same
 * item can never split across two documents
 */
function entryId(uid: string, item: Items): string {
  return `${uid}:${item}`;
}

function getEntryRef(uid: string, item: Items): DocumentReference<InventoryEntry> {
  return doc(getFirebaseFirestore(), INVENTORY_COLLECTION, entryId(uid, item)).withConverter(
    converter,
  );
}

/**
 * Every stack the user carries, as stored. Stacks that fell to zero
 * are left out
 */
export async function getInventory(uid: string): Promise<InventoryEntry[]> {
  const entries = collection(getFirebaseFirestore(), INVENTORY_COLLECTION).withConverter(converter);
  const result = await getDocs(query(entries, where('user', '==', uid)));

  return result.docs.map((entry) => entry.data()).filter((entry) => entry.amount > 0);
}

/**
 * How many of one item the user carries
 */
export async function getItemCount(uid: string, item: Items): Promise<number> {
  const snapshot = await getDoc(getEntryRef(uid, item));

  return snapshot.data()?.amount ?? 0;
}

/**
 * Add items to the user's inventory, creating the stack on first
 * acquisition
 */
export async function grantItem(uid: string, item: Items, count = 1): Promise<void> {
  await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getEntryRef(uid, item);
    const current = (await transaction.get(ref)).data()?.amount ?? 0;

    transaction.set(ref, { user: uid, item, amount: current + count });
  });
}

/**
 * Consume items; resolves false (and changes nothing) when the user
 * does not carry enough. A stack spent to zero stays as a zero
 * document and is filtered out on read
 */
export async function consumeItem(uid: string, item: Items, count = 1): Promise<boolean> {
  return runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getEntryRef(uid, item);
    const current = (await transaction.get(ref)).data()?.amount ?? 0;

    if (current < count) {
      return false;
    }
    transaction.set(ref, { user: uid, item, amount: current - count });
    return true;
  });
}
