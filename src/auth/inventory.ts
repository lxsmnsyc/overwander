// Firestore returns untyped documents; the converter below restores
// const-enum keys via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type DocumentReference,
  type FirestoreDataConverter,
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import type { Items } from '../data/ids/items';
import { asNumber, asRecord } from './__normalize';
import { getFirebaseFirestore } from './firebase';

/**
 * A user's belongings: their gold balance and how many of each item
 * they carry. Stored at inventories/{uid}; Firestore security rules
 * must restrict writes to the owning uid
 */
export interface Inventory {
  /**
   * The in-game currency balance
   */
  gold: number;
  /**
   * Item counts; absent means none
   */
  items: Partial<Record<Items, number>>;
}

const INVENTORY_COLLECTION = 'inventories';

function asItemCounts(value: unknown): Partial<Record<Items, number>> {
  const source = asRecord(value);
  const items: Partial<Record<Items, number>> = {};

  for (const [key, count] of Object.entries(source)) {
    if (typeof count === 'number' && count > 0) {
      items[Number(key) as Items] = count;
    }
  }
  return items;
}

const converter: FirestoreDataConverter<Inventory> = {
  toFirestore: (inventory) => inventory,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      gold: asNumber(data.gold),
      items: asItemCounts(data.items),
    };
  },
};

function getInventoryRef(uid: string): DocumentReference<Inventory> {
  return doc(getFirebaseFirestore(), INVENTORY_COLLECTION, uid).withConverter(converter);
}

function emptyInventory(): Inventory {
  return { gold: 0, items: {} };
}

export async function getInventory(uid: string): Promise<Inventory> {
  const snapshot = await getDoc(getInventoryRef(uid));

  return snapshot.data() ?? emptyInventory();
}

/**
 * Add gold to the user's balance
 */
export async function grantGold(uid: string, amount: number): Promise<void> {
  await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getInventoryRef(uid);
    const inventory = (await transaction.get(ref)).data() ?? emptyInventory();

    transaction.set(ref, { ...inventory, gold: inventory.gold + amount });
  });
}

/**
 * Spend gold; resolves false (and changes nothing) when the balance
 * cannot cover the amount
 */
export async function spendGold(uid: string, amount: number): Promise<boolean> {
  return runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getInventoryRef(uid);
    const inventory = (await transaction.get(ref)).data() ?? emptyInventory();

    if (inventory.gold < amount) {
      return false;
    }
    transaction.set(ref, { ...inventory, gold: inventory.gold - amount });
    return true;
  });
}

/**
 * Add items to the user's inventory
 */
export async function grantItem(uid: string, item: Items, count = 1): Promise<void> {
  await runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getInventoryRef(uid);
    const inventory = (await transaction.get(ref)).data() ?? emptyInventory();
    const current = inventory.items[item] ?? 0;

    transaction.set(ref, {
      ...inventory,
      items: { ...inventory.items, [item]: current + count },
    });
  });
}

/**
 * Consume items; resolves false (and changes nothing) when the
 * user does not carry enough. Entries consumed to zero are dropped
 * by the read-side normalization
 */
export async function consumeItem(uid: string, item: Items, count = 1): Promise<boolean> {
  return runTransaction(getFirebaseFirestore(), async (transaction) => {
    const ref = getInventoryRef(uid);
    const inventory = (await transaction.get(ref)).data() ?? emptyInventory();
    const current = inventory.items[item] ?? 0;

    if (current < count) {
      return false;
    }
    transaction.set(ref, {
      ...inventory,
      items: { ...inventory.items, [item]: current - count },
    });
    return true;
  });
}
