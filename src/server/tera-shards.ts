import 'server-only';
import { ITEM_STACKS } from '../model/stacks';
import { Metric } from '../model/quest-record';
import type { Types } from '../data/constants/types';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { TERA_SHARD_COST, getTeraShardType, takesTeraShard } from '../data/items/tera-shards';
import { isTeraType } from '../data/species/tera-type';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { bumpProgress } from './quest-progress';
import { asNumber } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Spend Tera Shards of one type on one of the player's catches,
 * changing its Tera type to the shards'. The record and the bag are
 * read in one transaction.
 *
 * Resolves the new Tera type, or null when refused: the item is not a
 * shard something spends, the catch is not the player's, it is
 * fighting, an egg or guarded, it has that Tera type already, or fewer
 * than `TERA_SHARD_COST` of the shard are carried
 */
export default async function useTeraShards(
  uid: string,
  catchId: string,
  item: Items,
): Promise<Types | null> {
  const type = getTeraShardType(item);

  if (type == null) {
    return null;
  }

  const changed = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId, true, []);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught) ||
      !takesTeraShard(
        {
          // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
          species: asNumber(caught.species) as Species,
          teraType: isTeraType(caught.teraType) ? caught.teraType : null,
        },
        item,
      )
    ) {
      return false;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < TERA_SHARD_COST) {
      return false;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, item, stock - TERA_SHARD_COST);
    await updateCaughtIn(transaction, catchId, { teraType: type });
    return true;
  });

  if (!changed) {
    return null;
  }
  await bumpProgress(uid, [[Metric.ItemUses, item, 1]]);
  return type;
}
