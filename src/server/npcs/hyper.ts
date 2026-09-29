import 'server-only';
import { asCaughtPokemon, isAuctionableCatch } from '../../auth/caught-record';
import { getMaxHealth, rescaleHealth } from '../../auth/health';
import { Metric } from '../../auth/quest-record';
import { type Stats, getIV } from '../../data/constants/stats';
import { polishIVs } from '../../data/items/bottle-caps';
import Npc, { hyperTrainingCost } from '../../data/overworld/npc';
import { isEggRecord, isGuardedRecord } from '../catch-fields';
import { readCaughtIn, updateCaughtIn } from '../caught-io';
import { tx } from '../db';
import { isCatchLocked } from '../locks';
import { moveGoldIn } from '../profile';
import { bumpProgress } from '../quest-progress';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/**
 * Have the Hyper Trainer take one of a pokemon's values to the top, for
 * gold by the point. The gold and the value move in one transaction.
 *
 * Resolves the values the pokemon now has, or null when refused: the
 * trainer is not standing there, the window's training is already done, the
 * catch is not the player's to train (fighting, an egg, guarded), the
 * value is already at the top, or the purse is short
 */
export default async function hyperTrain(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  stat: Stats,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.HyperTrainer);

  if (snapshot == null) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'hyper', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }

  let trained: { ivs: number; cost: number } | null;

  try {
    trained = await tx(async (transaction) => {
      const caught = await readCaughtIn(transaction, catchId, true, []);

      if (
        caught == null ||
        caught.owner !== uid ||
        isCatchLocked(caught) ||
        isEggRecord(caught) ||
        isGuardedRecord(caught)
      ) {
        return null;
      }

      const record = asCaughtPokemon(caught);
      const cost = hyperTrainingCost(getIV(record.ivs, stat));
      const ivs = polishIVs(record.ivs, [stat]);

      if (ivs == null || !(await moveGoldIn(transaction, uid, -cost, 'hyper-training', true))) {
        return null;
      }

      const whole = getMaxHealth({ ...record, ivs });

      await updateCaughtIn(transaction, catchId, {
        ivs,
        auctionable: isAuctionableCatch({ ...record, ivs }),
        health: rescaleHealth(record.health, getMaxHealth(record), whole),
        maxHealth: whole,
      });
      return { ivs, cost };
    });
  } catch (error) {
    await releaseVisit(visit);
    throw error;
  }

  if (trained == null) {
    await releaseVisit(visit);
    return null;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, trained.cost]]);
  return trained.ivs;
}
