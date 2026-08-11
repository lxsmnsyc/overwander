import 'server-only';
import { asNumberArray } from '../auth/__normalize';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { ITEM_STACKS } from '../auth/stacks';
import { type Items, getMachineMove } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { Slots, getSlots } from '../data/constants/slots';
import { getMovesLearnedAt, getSpeciesData } from '../data/species';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { readStackIn, writeStackIn } from './stacks';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Learning a move, written with admin credentials.
 *
 * Three things in the game change what a pokemon knows after it has
 * been met — **growing into one**, a technical machine, and the Move
 * Reminder putting back a level-up move it dropped. Everything else
 * about a move list is decided at the catch or inherited from a
 * parent.
 *
 * All three go through `learnMove`, which is the part none of them may
 * be trusted with: whose pokemon it is, whether it is in a state that
 * can be written at all, how much room the list has, and that the
 * price is actually in the bag. What differs between them is only
 * **which move is allowed and what it is paid in**, so that is all any
 * of them passes in.
 *
 * The price leaves the bag and the move list is written in **one
 * transaction**, so nothing is ever spent on a move that was not
 * learned. A level-up move has no price at all — the candy already
 * paid for it — which is why the price may be null
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
 * `price` is null where there is nothing to pay — a move the pokemon
 * has just levelled into — and nothing is read or written for the bag
 * in that case.
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
  price: Items | null,
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

    // A free move reads nothing and writes nothing to the bag; a paid
    // one is read here, inside the transaction, so the stack cannot
    // move between the check and the spending
    const carried = price == null ? 1 : await readStackIn(transaction, ITEM_STACKS, uid, price);

    if (carried < 1) {
      return null;
    }

    const moves =
      known.length < room ? [...known, move] : known.map((one, at) => (at === over ? move : one));

    if (price != null) {
      writeStackIn(transaction, ITEM_STACKS, uid, price, carried - 1);
    }
    transaction.update(caughtRef, { moves });
    return moves;
  });
}

/**
 * Learn a move the pokemon has **just grown into**: one its species
 * learns at exactly the level the record now sits at.
 *
 * Nothing is charged, because the candy that bought the level already
 * paid for it. What keeps that from being a free Move Reminder is the
 * word *exactly*: the offer is the level the pokemon is standing on
 * and no other, so a move from any earlier level is gone the moment
 * the next candy is spent — and gone for good, unless a Heart Scale
 * and a Move Reminder bring it back.
 *
 * There is no record of the offer being made or declined, which is
 * deliberate: the level itself is the record. A player who says no by
 * accident may say yes again until they level the pokemon past it.
 *
 * Resolves the move list as it now stands, or null when the learning
 * is refused
 */
export async function learnLevelUpMove(
  uid: string,
  catchId: string,
  move: Moves,
  replaces = 0,
): Promise<Moves[] | null> {
  return learnMove(uid, catchId, move, null, replaces, (species, level) =>
    new Set(getMovesLearnedAt(species, level)).has(move),
  );
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
