import 'server-only';
import { ITEM_STACKS } from '../auth/stacks';
import { Metric } from '../auth/quest-record';
import { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { takesGigantamaxFactor } from '../data/items/max-mushrooms';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { bumpProgress } from './quest-progress';
import { asNumber } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Feed Max Mushrooms to one of the player's catches, giving it the
 * Gigantamax Factor. The species and the flag are read off the stored
 * record and the item off the bag, in one transaction.
 *
 * Resolves true once the factor is given, or false when refused: the
 * catch is not the player's, it is fighting, an egg or guarded, its
 * species has no Gigantamax form, it has the factor already, or no
 * mushrooms are carried
 */
export default async function useMaxMushrooms(uid: string, catchId: string): Promise<boolean> {
  const given = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId, true, []);

    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught) ||
      !takesGigantamaxFactor({
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        species: asNumber(caught.species) as Species,
        gigantamax: caught.gigantamax === true,
      })
    ) {
      return false;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, Items.MaxMushrooms);

    if (stock < 1) {
      return false;
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, Items.MaxMushrooms, stock - 1);
    await updateCaughtIn(transaction, catchId, { gigantamax: true });
    return true;
  });

  if (given) {
    await bumpProgress(uid, [[Metric.ItemUses, Items.MaxMushrooms, 1]]);
  }
  return given;
}
