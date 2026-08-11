import 'server-only';
import { asNumberArray } from '../auth/__normalize';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { ITEM_STACKS } from '../auth/stacks';
import { type Items, getMachineMove } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { Slots, getSlots } from '../data/constants/slots';
import { getSpeciesData } from '../data/species';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { readStackIn, writeStackIn } from './stacks';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Learning a move, written with admin credentials.
 *
 * Two things in the game change what a pokemon knows after it has been
 * met — a technical machine, and the Move Reminder putting back a
 * level-up move it dropped. Everything else about a move list is
 * decided at the catch or inherited from a parent.
 *
 * Both go through `learnMove`, which is the part neither of them may
 * be trusted with: whose pokemon it is, whether it is in a state that
 * can be written at all, how much room the list has, and that the
 * price is actually in the bag. What differs between them is only
 * **which move is allowed and what it is paid in**, so that is all
 * either passes in.
 *
 * The price leaves the bag and the move list is written in **one
 * transaction**, so nothing is ever spent on a move that was not
 * learned, and no move is ever learned for free
 */

/**
 * Whether this pokemon may be given this move at all, asked of the
 * stored record: its species, the level it has reached, and what it
 * already knows. A machine asks the species' teachable list; the Move
 * Reminder asks what it has learned by levelling and lost
 */
export type MoveSource = (species: Species, level: number, known: Moves[]) => boolean;

/**
 * Put one move on one of the player's catches and take the price for
 * it out of the bag, in one transaction.
 *
 * `replaces` names which of the known moves the new one goes over, and
 * is ignored by a pokemon that still has room — one that knows three
 * moves learns a fourth rather than replacing anything.
 *
 * Resolves the move list as it now stands, or null when the teaching
 * is refused: the catch is not the player's, it is fighting, locked or
 * still an egg, `allowed` says no, it knows the move already, the
 * price is not carried, or the move it would go over does not exist
 */
export async function learnMove(
  uid: string,
  catchId: string,
  move: Moves,
  price: Items,
  replaces: number,
  allowed: MoveSource,
): Promise<Moves[] | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const caughtRef = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const caught = docData(await transaction.get(caughtRef));

    // An egg has learned nothing yet, a pokemon in a live battle is
    // fighting on a frozen copy of this list, and a locked one is
    // being kept exactly as it is — which is what a lock is for
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const known = asNumberArray(caught.moves) as Moves[];
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;

    // What may be written is the caller's rule, read off the stored
    // record rather than off anything the client said — and a move it
    // already knows is a price spent on nothing whichever rule applies
    if (!allowed(species, asNumber(caught.level), known) || new Set(known).has(move)) {
      return null;
    }

    // A pokemon with room learns another move; one that is full puts
    // the new one over whichever the player named. How much room that
    // is belongs to the record rather than to the game
    const room = getSlots(asNumber(caught.slots), Slots.Move);
    const over = Math.floor(replaces);

    if (known.length >= room && (over < 0 || over >= known.length)) {
      return null;
    }

    const carried = await readStackIn(transaction, ITEM_STACKS, uid, price);

    if (carried < 1) {
      return null;
    }

    const moves =
      known.length < room ? [...known, move] : known.map((one, at) => (at === over ? move : one));

    writeStackIn(transaction, ITEM_STACKS, uid, price, carried - 1);
    transaction.update(caughtRef, { moves });
    return moves;
  });
}

/**
 * Use a technical machine on one of the player's catches. The move is
 * the machine's own — there is exactly one machine per move — and the
 * species has to have it on its teachable list.
 *
 * Resolves the move list as it now stands, or null when the teaching
 * is refused
 */
export default async function teachMove(
  uid: string,
  catchId: string,
  item: Items,
  replaces = 0,
): Promise<Moves[] | null> {
  const move = getMachineMove(item);

  if (move == null) {
    return null;
  }
  return learnMove(uid, catchId, move, item, replaces, (species) =>
    new Set(getSpeciesData(species).learnSet.teachable).has(move),
  );
}
