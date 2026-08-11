import 'server-only';
import { asNumberArray } from '../auth/__normalize';
import { CAUGHT_COLLECTION, INVENTORY_COLLECTION, inventoryEntryId } from '../auth/collections';
import { type Items, getMachineMove } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { getSpeciesData } from '../data/species';
import { MOVE_LIMIT } from '../overworld/encounter';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Teaching a move, written with admin credentials.
 *
 * A machine is the only thing in the game that changes what a pokemon
 * knows after it has been met — everything else about a move list is
 * decided at the catch or inherited from a parent — so what a machine
 * may write is checked here rather than trusted from the caller: the
 * move has to be the machine's own, the species has to be able to
 * learn it, and the pokemon has to be the player's.
 *
 * The machine leaves the bag and the move list is written in **one
 * transaction**, so a machine is never spent on a move that was not
 * learned, and a move is never learned for free
 */

/**
 * Use a technical machine on one of the player's catches.
 *
 * `replaces` names which of the four the new move goes over, and is
 * ignored by a pokemon that still has room — a machine used on one
 * that knows three moves teaches a fourth rather than replacing
 * anything.
 *
 * Resolves the move list as it now stands, or null when the teaching
 * is refused: the catch is not the player's, it is fighting, locked or
 * still an egg, the item is not a machine, the species cannot learn
 * the move, it knows it already, the machine is not carried, or the
 * move it would go over does not exist
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
    const teachable = new Set(getSpeciesData(species).learnSet.teachable);

    // What this species can be taught is the species' own business,
    // and a move it already knows is a machine spent on nothing
    if (!teachable.has(move) || new Set(known).has(move)) {
      return null;
    }

    // A pokemon with room learns a fourth move; one that is full puts
    // the new one over whichever the player named
    const over = Math.floor(replaces);

    if (known.length >= MOVE_LIMIT && (over < 0 || over >= known.length)) {
      return null;
    }

    const stackRef = db.collection(INVENTORY_COLLECTION).doc(inventoryEntryId(uid, item));
    const carried = asNumber(docData(await transaction.get(stackRef))?.amount);

    if (carried < 1) {
      return null;
    }

    const moves =
      known.length < MOVE_LIMIT
        ? [...known, move]
        : known.map((one, at) => (at === over ? move : one));

    transaction.set(stackRef, { user: uid, item, amount: carried - 1 });
    transaction.update(caughtRef, { moves });
    return moves;
  });
}
