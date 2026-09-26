import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { ITEM_STACKS } from '../auth/stacks';
import type { Items } from '../data/ids/items';
import { MAX_IV, STAT_ORDER, type Stats, getIV } from '../data/constants/stats';
import { getMaxHealth, rescaleHealth } from '../auth/health';
import { capAsksForStat, capStats, isBottleCap, polishIVs } from '../data/items/bottle-caps';
import { Metric } from '../auth/quest-record';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';

/**
 * Using a bottle cap, written with admin credentials. Individual
 * values are the one part of a catch that nothing else can move, so
 * the only thing that moves them does it here: the cap is checked
 * against the bag, the stats against the stored record, and both are
 * written in one transaction — a cap is never spent on a pokemon that
 * did not change, and a pokemon never changes without one being spent
 */

/**
 * The stat a plain cap goes on when the caller named none: the lowest
 * that is not yet perfect. Only a tab from before the player chose
 * asks this way
 */
function weakestStat(ivs: number): Stats | null {
  let weakest: Stats | null = null;

  for (const stat of STAT_ORDER) {
    const value = getIV(ivs, stat);

    if (value < MAX_IV && (weakest == null || value < getIV(ivs, weakest))) {
      weakest = stat;
    }
  }
  return weakest;
}

/**
 * Use a bottle cap on one of the player's catches. A golden cap
 * raises every value it can reach; a plain one raises the stat the
 * player chose.
 *
 * Resolves the values the catch now has, or null when the use is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg, the item is not a cap, none is carried, or the stats it
 * would raise are already perfect
 */
export default async function useBottleCap(
  uid: string,
  catchId: string,
  item: Items,
  stat: Stats | null,
): Promise<number | null> {
  if (!isBottleCap(item)) {
    return null;
  }

  const capped = await tx(async (transaction) => {
    // The values a cap polishes are on the row, and so is everything
    // the refusals ask about
    const caught = await readCaughtIn(transaction, catchId, true, []);

    // A pokemon fights as the snapshot froze it, and an egg is not a
    // pokemon yet: what is inside it was decided when it was found,
    // and it stays that way until it hatches
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    const record = asCaughtPokemon(caught);
    const chosen = stat ?? (capAsksForStat(item) ? weakestStat(record.ivs) : null);
    const polished = polishIVs(record.ivs, capStats(item, chosen));

    // Nothing left to polish, so nothing is spent
    if (polished == null) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);

    const whole = getMaxHealth({ ...record, ivs: polished });

    // Only the per-stat values move. `individualValue` is the roll the
    // encounter was staged from and stays the record of it — the
    // stored stats are what every reader uses, which is what lets a
    // bred egg and a capped pokemon differ from their own roll
    await updateCaughtIn(transaction, catchId, {
      ivs: polished,
      // A cap is the one thing that can make a pokemon perfect after
      // the fact, so the stored answer moves with the values
      auctionable: isAuctionableCatch({ ...record, ivs: polished }),
      // A polished health value is a bigger pool, and the share of it
      // the pokemon was carrying is what it keeps
      health: rescaleHealth(record.health, getMaxHealth(record), whole),
      maxHealth: whole,
    });
    return polished;
  });

  if (capped != null) {
    await bumpProgress(uid, [[Metric.ItemUses, item, 1]]);
  }
  return capped;
}
