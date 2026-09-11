import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import type { Items } from '../data/ids/items';
import type Natures from '../data/ids/natures';
import { getMintNature } from '../data/items/mints';
import { Metric } from '../auth/quest-record';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber } from './read';

/**
 * Using a mint, written with admin credentials.
 *
 * A nature is rolled when the encounter is staged and is the other
 * half of what a catch was born with, so a mint is written the way a
 * bottle cap is: the item is checked against the bag and the nature
 * against the stored record, both in one transaction. A mint is never
 * spent on a pokemon that did not change.
 *
 * Nothing is recomputed afterwards. A nature moves two of the six
 * stats and never HP, and every stat but health is worked out from
 * the record as it is read, so the stored pool is still right.
 */

/**
 * Use a mint on one of the player's catches, leaving the nature the
 * mint stands for.
 *
 * Resolves the nature the catch now has, or null when the use is
 * refused: the catch is not the player's, it is fighting, it is still
 * an egg or guarded, the item is not a mint, none is carried, or the
 * pokemon already has that nature
 */
export default async function useMint(
  uid: string,
  catchId: string,
  item: Items,
): Promise<Natures | null> {
  const nature = getMintNature(item);

  if (nature == null) {
    return null;
  }

  const eaten = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId, true, []);

    // A pokemon fights as the snapshot froze it, and an egg's nature
    // was decided when it was found: it keeps it until it hatches
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    // Nothing to change, so nothing is spent. The assertion is what
    // oxlint wants to compare two of the same enum; tsgolint resolves
    // the const enum to number and calls it redundant
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    if ((asNumber(caught.nature) as Natures) === nature) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    await updateCaughtIn(transaction, catchId, { nature });
    return nature;
  });

  if (eaten != null) {
    await bumpProgress(uid, [[Metric.ItemUses, item, 1]]);
  }
  return eaten;
}
