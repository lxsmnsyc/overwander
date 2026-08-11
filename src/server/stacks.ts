import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { BAG_COLLECTION, type StackSpec, bagId, getStack } from '../auth/stacks';
import { getAdminFirestore } from './firebase';
import { docData } from './read';

/**
 * The bag, written with admin credentials.
 *
 * What a player carries is currency whichever map it is in: a client
 * that could write the items map could mint Master Balls, and one
 * that could write the candies map could mint levels. So every change
 * comes through here.
 *
 * There are two layers on purpose. Most callers change a stack **and
 * something else** in the same breath — an item leaves the bag as a
 * move is learned, a candy leaves the pile as a level lands — and
 * those have to share one transaction, so they take the `In`
 * functions and pass their own. The rest take the self-contained
 * ones, which open a transaction of their own.
 *
 * Every write is a **merge at one field path**, never a whole
 * document: two kinds changed in one transaction are two mutations
 * against `items.114` and `items.117`, so the second cannot overwrite
 * the first. A stack spent to its last is **deleted** from the map
 * rather than left at zero, so the bag holds what is carried and
 * nothing else
 */

export function bagRef(uid: string): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(BAG_COLLECTION).doc(bagId(uid));
}

/**
 * How many of it the player holds, read inside a transaction the
 * caller already opened.
 *
 * Two kinds read in one transaction are two reads of the same
 * document, which is what makes the reads-before-writes rule hold for
 * a caller that gathers several before writing any
 */
export async function readStackIn(
  transaction: FirebaseFirestore.Transaction,
  spec: StackSpec,
  uid: string,
  key: number,
): Promise<number> {
  return getStack(docData(await transaction.get(bagRef(uid))), spec, key);
}

/**
 * Write one count to a known figure inside the caller's transaction.
 * Nothing is checked here — the caller has already read the map and
 * decided what it should say
 */
export function writeStackIn(
  transaction: FirebaseFirestore.Transaction,
  spec: StackSpec,
  uid: string,
  key: number,
  count: number,
): void {
  const held = Math.max(0, Math.floor(count));

  transaction.set(
    bagRef(uid),
    { [spec.field]: { [key]: held > 0 ? held : FieldValue.delete() } },
    { merge: true },
  );
}

/**
 * Take some of it inside the caller's transaction, given the figure
 * they have already read. Answers false — and writes nothing — when
 * the player does not hold enough, so a refusal costs nothing
 */
export function spendStackIn(
  transaction: FirebaseFirestore.Transaction,
  spec: StackSpec,
  uid: string,
  key: number,
  held: number,
  count = 1,
): boolean {
  if (held < count) {
    return false;
  }
  writeStackIn(transaction, spec, uid, key, held - count);
  return true;
}

/**
 * How many of it the player holds
 */
export async function readStack(spec: StackSpec, uid: string, key: number): Promise<number> {
  return getStack(docData(await bagRef(uid).get()), spec, key);
}

/**
 * Add to a stack, creating the bag on first acquisition
 */
export async function grantStack(
  spec: StackSpec,
  uid: string,
  key: number,
  count = 1,
): Promise<void> {
  await getAdminFirestore().runTransaction(async (transaction) => {
    const held = await readStackIn(transaction, spec, uid, key);

    writeStackIn(transaction, spec, uid, key, held + count);
  });
}

/**
 * Spend from a stack. Resolves false (and changes nothing) when the
 * player does not hold enough
 */
export async function spendStack(
  spec: StackSpec,
  uid: string,
  key: number,
  count = 1,
): Promise<boolean> {
  return getAdminFirestore().runTransaction(async (transaction) => {
    const held = await readStackIn(transaction, spec, uid, key);

    return spendStackIn(transaction, spec, uid, key, held, count);
  });
}

/**
 * Hand over several kinds at once, in **one** write.
 *
 * A bag is one document, so a caller that grants three kinds one at a
 * time is three writes queueing behind each other for no reason —
 * and three chances to land half a stash. This is what the pickups, a
 * dug-up cache and a released pokemon's held items use
 */
export async function grantStacks(
  spec: StackSpec,
  uid: string,
  granted: Iterable<[key: number, count: number]>,
): Promise<void> {
  const owed = [...granted].filter(([, count]) => count > 0);

  if (owed.length === 0) {
    return;
  }

  await getAdminFirestore().runTransaction(async (transaction) => {
    const bag = docData(await transaction.get(bagRef(uid)));

    for (const [key, count] of owed) {
      transaction.set(
        bagRef(uid),
        { [spec.field]: { [key]: getStack(bag, spec, key) + count } },
        { merge: true },
      );
    }
  });
}
