import 'server-only';
import { asCaughtPokemon, isShadow } from '../../auth/caught-record';
import { groomedFriendship } from '../../data/constants/friendship';
import Npc, { GROOMING_FEE } from '../../data/overworld/npc';
import { isEggRecord } from '../catch-fields';
import { readCaughtIn } from '../caught-io';
import { getSql } from '../db';
import { isCatchLocked } from '../locks';
import { grantGold, spendGold } from '../profile';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/** The groomer, who raises what a walk cannot */
/**
 * Have the groomer see to a pokemon: half of whatever friendship it
 * had left to give. A share of the remainder rather than a place on
 * it, so gold buys the early half of a friendship and never the last.
 *
 * Resolves what the pokemon now thinks, or null when it is not the
 * player's, is an egg, is fighting, already thinks as well of them as
 * it can, or no groomer is standing there
 */
export default async function groomCatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<number | null> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.Groomer);

  if (snapshot == null) {
    return null;
  }

  const stored = await readCaughtIn(getSql(), catchId, false);

  // An egg thinks nothing of anybody yet: what is inside it has not
  // met the player, and the shell is what the daycare lady is for
  // A locked pokemon is still groomed: friendship is the one thing a
  // lock leaves alone, and being fussed over is not being changed
  if (stored == null || stored.owner !== uid || isEggRecord(stored) || isCatchLocked(stored)) {
    return null;
  }

  const caught = asCaughtPokemon(stored);

  // A shadow will not be fussed over. Nothing it thinks of anybody can
  // be bought while it is one, which is what makes purifying worth
  // walking for
  if (isShadow(caught)) {
    return null;
  }

  const groomed = groomedFriendship(caught.friendship);

  // Nothing left to buy, so nothing is charged
  if (groomed === caught.friendship) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'groom', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }
  if (!(await spendGold(uid, GROOMING_FEE))) {
    await releaseVisit(visit);
    return null;
  }

  try {
    await getSql()`update caught set friendship = ${groomed} where id = ${catchId}`;
  } catch (error) {
    await grantGold(uid, GROOMING_FEE);
    await releaseVisit(visit);
    throw error;
  }
  await bumpProgress(uid, [[Metric.GoldSpent, 0, GROOMING_FEE]]);
  return groomed;
}
