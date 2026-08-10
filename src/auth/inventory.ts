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
import type { Items } from '../data/ids/items';
import { asNumber, asString } from './__normalize';
import { INVENTORY_COLLECTION, inventoryEntryId } from './collections';
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
 * The stack's document reference, converter attached
 */
function getEntryRef(uid: string, item: Items): DocumentReference<InventoryEntry> {
  return doc(
    getFirebaseFirestore(),
    INVENTORY_COLLECTION,
    inventoryEntryId(uid, item),
  ).withConverter(converter);
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
 * The bag is read here and written only by the server: items are
 * value, so `grantItem` and `consumeItem` live in
 * [`src/server/inventory.ts`](../server/inventory.ts) behind a
 * verified caller, and the rules leave this collection read-only to
 * clients
 */
