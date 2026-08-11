import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { ITEM_STACKS } from '../auth/stacks';
import { assignEffort as assignedValues, unusedEffort } from '../auth/effort';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { MAX_EFFORT_PER_STAT, type Stats } from '../data/constants/stats';
import { friendshipFactor, gainFriendship } from '../data/constants/friendship';
import type { Items } from '../data/ids/items';
import { BERRY_EFFORT_DROP, BERRY_EFFORT_DROPS } from '../data/items/berries';
import { WING_EFFORT, WING_STATS } from '../data/items/wings';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { getAdminFirestore } from './firebase';
import { readStackIn, writeStackIn } from './stacks';
import { isCatchLocked } from './locks';
import { docData } from './read';

/**
 * Training, written with admin credentials.
 *
 * Three things move a pokemon's effort and all of them are here: the
 * points its levels came with, being spent; a wing, adding three more
 * on top of them; and a bitter berry, taking ten back off a stat and
 * handing them to the pool to be spent again.
 *
 * The arithmetic itself is in [`src/auth/effort.ts`](../auth/effort.ts)
 * so the catch sheet can say what is possible before asking for it.
 * What is here is the part that has to be decided against the stored
 * record: a client that worked out its own budget would simply work
 * out a bigger one.
 */

/**
 * What a training call comes back with: the values the pokemon now
 * has, so the sheet can redraw without re-reading
 */
export interface TrainingResult {
  effortValues: Record<Stats, number>;
  effortBonus: number;
  friendship: number;
  unused: number;
}

/**
 * The record read back as a result, once whatever changed has been
 * written into it
 */
function asResult(caught: {
  level: number;
  effortValues: Record<Stats, number>;
  effortBonus: number;
  friendship: number;
}): TrainingResult {
  return {
    effortValues: caught.effortValues,
    effortBonus: caught.effortBonus,
    friendship: caught.friendship,
    unused: unusedEffort(caught),
  };
}

/**
 * Put some of a pokemon's unspent effort into one stat, or take some
 * back out of it.
 *
 * Nothing is spent to do this and nothing is consumed: the points came
 * with the levels, and moving them about is the player's to do. What
 * it will not do is invent points — the budget is worked out here from
 * the stored level and the stored wings.
 *
 * Resolves what the pokemon now has, or null when the move is refused:
 * the catch is not the player's, it is fighting, it is still an egg,
 * or the pokemon has not got the points
 */
export async function trainEffort(
  uid: string,
  catchId: string,
  stat: Stats,
  amount: number,
): Promise<TrainingResult | null> {
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const stored = docData(await transaction.get(ref));

    // A pokemon fights as the snapshot froze it, and an egg has not
    // taken a level of its own yet. A locked one is refused as well:
    // nothing is spent moving effort about, but where the points sit
    // is still the sheet being rewritten
    if (
      stored == null ||
      stored.owner !== uid ||
      isCatchLocked(stored) ||
      isEggRecord(stored) ||
      isGuardedRecord(stored)
    ) {
      return null;
    }

    const record = asCaughtPokemon(stored);
    const effortValues = assignedValues(record, stat, amount);

    if (effortValues == null) {
      return null;
    }

    const trained = { ...record, effortValues };

    transaction.update(ref, {
      effortValues,
      // Effort in health is a bigger pool, and the share of it the
      // pokemon was carrying is what it keeps
      health: rescaleHealth(record.health, getMaxHealth(record), getMaxHealth(trained)),
    });
    return asResult(trained);
  });
}

/**
 * Use a wing on one of the player's catches: three points of effort
 * in the wing's own stat, granted rather than spent, so a pokemon
 * with nothing left in its pool still gains from one.
 *
 * Resolves what the pokemon now has, or null when the wing is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg, none of that wing is carried, or the stat is already
 * trained as far as it goes
 */
export async function useWing(
  uid: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  const stat = WING_STATS.get(item);

  if (stat == null) {
    return null;
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const stored = docData(await transaction.get(ref));

    if (
      stored == null ||
      stored.owner !== uid ||
      isCatchLocked(stored) ||
      isEggRecord(stored) ||
      isGuardedRecord(stored)
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    const record = asCaughtPokemon(stored);
    const trainedTo = Math.min(MAX_EFFORT_PER_STAT, record.effortValues[stat] + WING_EFFORT);

    // Nothing to gain, so nothing is spent
    if (trainedTo === record.effortValues[stat]) {
      return null;
    }

    const gained = trainedTo - record.effortValues[stat];
    const effortValues = { ...record.effortValues, [stat]: trainedTo };
    // The wing pays for what it granted, so a pokemon's own pool is
    // untouched by it — that is the whole of what makes a wing worth
    // finding at any level
    const trained = { ...record, effortValues, effortBonus: record.effortBonus + gained };

    writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    transaction.update(ref, {
      effortValues,
      effortBonus: trained.effortBonus,
      health: rescaleHealth(record.health, getMaxHealth(record), getMaxHealth(trained)),
    });
    return asResult(trained);
  });
}

/**
 * Feed a bitter berry to one of the player's catches: ten points of
 * training off one stat, and a pokemon that thinks the better of them
 * for it.
 *
 * The points are not lost. What paid for them was a level, and the
 * level has not been un-taken, so they go back to the pool to be put
 * somewhere else — which is the whole reason to feed one.
 *
 * Resolves what the pokemon now has, or null when the berry is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg, none of that berry is carried, or the stat has no training
 * on it to take off
 */
export async function feedEffortBerry(
  uid: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  const stat = BERRY_EFFORT_DROPS.get(item);

  if (stat == null) {
    return null;
  }

  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(CAUGHT_COLLECTION).doc(catchId);
    const stored = docData(await transaction.get(ref));

    if (
      stored == null ||
      stored.owner !== uid ||
      isCatchLocked(stored) ||
      isEggRecord(stored) ||
      isGuardedRecord(stored)
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    const record = asCaughtPokemon(stored);
    const trainedTo = Math.max(0, record.effortValues[stat] - BERRY_EFFORT_DROP);

    if (trainedTo === record.effortValues[stat]) {
      return null;
    }

    const effortValues = { ...record.effortValues, [stat]: trainedTo };
    const friendship = gainFriendship(record.friendship, 'berry', 1, friendshipFactor(record.ball));
    const trained = { ...record, effortValues, friendship };

    writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    transaction.update(ref, {
      effortValues,
      friendship,
      // A smaller pool takes the same share of health with it, so a
      // pokemon is never left holding more than it can
      health: rescaleHealth(record.health, getMaxHealth(record), getMaxHealth(trained)),
    });
    return asResult(trained);
  });
}
