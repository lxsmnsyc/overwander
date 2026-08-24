import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import { type Items, getBall } from '../data/ids/items';
import { isEggRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { Metric } from '../auth/quest-record';
import { bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Putting a pokemon in a different ball.
 *
 * A spare ball out of the bag replaces the one it is in, and is spent
 * doing it — it was thrown once already, so it does not come back.
 *
 * **The ball is not only decoration.** A Luxury Ball doubles friendship
 * gains for whatever is in it, and that is read off the record, so
 * re-balling into one buys the bonus for a pokemon caught in something
 * else. What a ball did at the *moment of the catch* — a Heal Ball
 * mending the catch, the odds a Dusk Ball improved — is long since
 * settled and is not revisited.
 *
 * The history is left alone on purpose. Each entry says which ball its
 * owner received the pokemon in, and re-balling it today does not
 * change how it arrived.
 */

/**
 * Put one of the player's catches in the ball this item is.
 *
 * Resolves the ball it is now in, or null when the swap is refused:
 * the catch is not theirs, it is fighting, it is still an egg, the item
 * is not a ball, none is carried, or it is already in that ball
 */
export default async function useBall(
  uid: string,
  catchId: string,
  item: Items,
): Promise<number | null> {
  const ball = getBall(item);

  if (ball == null) {
    return null;
  }

  const swapped = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // An egg is refused because the ball on an egg is the nest it came
    // from, and a fighting pokemon because the battle is running
    // against the record as it was frozen
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      caught.ball === ball
    ) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    await updateCaughtIn(transaction, catchId, { ball });

    return ball;
  });

  if (swapped != null) {
    await bumpProgress(uid, [[Metric.ItemUses, item, 1]]);
  }
  return swapped;
}
