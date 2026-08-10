import 'server-only';
import { PROFILE_COLLECTION } from '../auth/collections';
import { getAdminFirestore } from './firebase';
import { asNumber, docData } from './read';

/**
 * The gold balance, written with admin credentials. A player edits
 * their own nickname and avatar directly — those are theirs to set —
 * but the balance is currency, so it only moves here
 */

function getProfileRef(uid: string): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(PROFILE_COLLECTION).doc(uid);
}

function readGold(snapshot: FirebaseFirestore.DocumentSnapshot): number {
  return asNumber(docData(snapshot)?.gold);
}

/**
 * Add gold. The read and the write share a transaction so concurrent
 * rewards cannot clobber each other
 */
export async function grantGold(uid: string, amount: number): Promise<void> {
  const db = getAdminFirestore();

  await db.runTransaction(async (transaction) => {
    const ref = getProfileRef(uid);
    const gold = readGold(await transaction.get(ref));

    transaction.set(ref, { gold: gold + amount }, { merge: true });
  });
}

/**
 * Spend gold; resolves false (and changes nothing) when the balance
 * cannot cover the amount
 */
export async function spendGold(uid: string, amount: number): Promise<boolean> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = getProfileRef(uid);
    const gold = readGold(await transaction.get(ref));

    if (gold < amount) {
      return false;
    }
    transaction.set(ref, { gold: gold - amount }, { merge: true });
    return true;
  });
}
