import 'server-only';
import { asCaughtPokemon, getMovePoints } from '../auth/caught-record';
import { CAUGHT_COLLECTION } from '../auth/collections';
import { ITEM_STACKS } from '../auth/stacks';
import { assignEffort as assignedValues, unusedEffort } from '../auth/effort';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { MAX_EFFORT_PER_STAT, type Stats } from '../data/constants/stats';
import type { Moves } from '../data/ids/moves';
import { friendshipFactor, gainFriendship } from '../data/constants/friendship';
import type { Items } from '../data/ids/items';
import { BERRY_EFFORT_DROP, BERRY_EFFORT_DROPS } from '../data/items/berries';
import { PP_ITEMS, VITAMIN_EFFORT, VITAMIN_STATS } from '../data/items/vitamins';
import { WING_EFFORT, WING_STATS } from '../data/items/wings';
import { PP_UP_LIMIT, getMovePP } from '../data/moves';
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
 * What one of the training items is worth, and where it goes: the
 * stat it feeds and how many points it grants.
 *
 * A wing and a vitamin do the same thing at different sizes — three
 * points found on the ground, ten bought off a shelf — so they are
 * one call rather than two that would drift apart
 */
function effortGrant(item: Items): [stat: Stats, amount: number] | null {
  const wing = WING_STATS.get(item);

  if (wing != null) {
    return [wing, WING_EFFORT];
  }

  const vitamin = VITAMIN_STATS.get(item);

  return vitamin == null ? null : [vitamin, VITAMIN_EFFORT];
}

/**
 * Use a wing or a vitamin on one of the player's catches: points of
 * effort in the item's own stat, granted rather than spent, so a
 * pokemon with nothing left in its pool still gains from one.
 *
 * Resolves what the pokemon now has, or null when it is refused: the
 * catch is not the player's, it is fighting, it is still an egg, none
 * of that item is carried, or the stat is already trained as far as it
 * goes
 */
export async function useEffortItem(
  uid: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  const grant = effortGrant(item);

  if (grant == null) {
    return null;
  }

  const [stat, amount] = grant;
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
    const trainedTo = Math.min(MAX_EFFORT_PER_STAT, record.effortValues[stat] + amount);

    // Nothing to gain, so nothing is spent
    if (trainedTo === record.effortValues[stat]) {
      return null;
    }

    const gained = trainedTo - record.effortValues[stat];
    const effortValues = { ...record.effortValues, [stat]: trainedTo };
    // The item pays for what it granted, so a pokemon's own pool is
    // untouched by it — that is the whole of what makes a wing worth
    // finding, or a vitamin worth buying, at any level
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
 * What a PP call comes back with: how many points that move now
 * carries, and what its PP has become — which is what decides how
 * quickly it comes back in a fight
 */
export interface MovePointsResult {
  move: Moves;
  points: number;
  pp: number;
}

/**
 * Spend a PP Up or a PP Max on one of a pokemon's moves.
 *
 * The points are permanent and nothing takes them back: a stat can be
 * trained back down with a bitter berry, a move's points cannot. What
 * they buy in this game is a **shorter cooldown** rather than more
 * uses — see `getMovePP` — and a move at the limit is refused rather
 * than charged for nothing.
 *
 * A PP Max is worth the whole allowance at once, so it is accepted on
 * a move with anything less than the limit and takes it straight
 * there; what it grants is however much was missing.
 *
 * Resolves what the move now carries, or null when it is refused: the
 * catch is not the player's, it is fighting, it is still an egg, it
 * does not know that move, none of the item is carried, or the move
 * has already had everything it will take
 */
export async function usePPItem(
  uid: string,
  catchId: string,
  move: Moves,
  item: Items,
): Promise<MovePointsResult | null> {
  const worth = PP_ITEMS.get(item);

  if (worth == null) {
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

    const record = asCaughtPokemon(stored);

    // The move has to be one it actually knows: points on a move it
    // does not would sit in the record forever, since nothing would
    // ever prune them
    if (!new Set(record.moves).has(move)) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    const points = Math.min(PP_UP_LIMIT, getMovePoints(record, move) + worth);

    // Already as far as it goes, so nothing is spent
    if (points === getMovePoints(record, move)) {
      return null;
    }

    writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    // Written at the one field path, so two moves trained in the same
    // breath cannot overwrite each other's points
    transaction.update(ref, { [`movePoints.${move}`]: points });
    return { move, points, pp: getMovePP(move, points) };
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
