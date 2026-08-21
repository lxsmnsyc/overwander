import 'server-only';
import { asCaughtPokemon } from '../auth/caught-record';
import { ITEM_STACKS } from '../auth/stacks';
import { type HealthState, healedByItem } from '../auth/health';
import { gainFriendship } from '../data/constants/friendship';
import type { Items } from '../data/ids/items';
import { bitterness } from '../data/items/medicine';
import { readStackIn, writeStackIn } from './stacks';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';

/**
 * Healing between battles, written with admin credentials.
 *
 * A fight leaves a party hurt, statused or down, and the bag is what
 * puts it right without waiting for a candy: a berry off the bush, a
 * potion, a cure, a revive. The item leaves the bag and the pokemon's
 * health is written in the same transaction, so an item is never
 * spent on nothing and nothing is healed for free.
 *
 * What each item does is the item's own business — for a berry, the
 * same tables the battle reads — so the only decisions here are
 * whether the pokemon is the player's, whether it is in a state the
 * item can do something about, and whether the item is carried.
 */

/**
 * Use a healing item from the bag on one of the player's catches.
 *
 * A pokemon that is **down** can only be reached by a revive, and a
 * revive can only reach one that is down. Everything else is refused
 * where it would do nothing at all, since using it would spend it.
 *
 * Herbal medicine costs friendship on top of the item, docked in the
 * same write as the healing so the two can never come apart.
 *
 * Resolves the health and statuses the catch now has, or null when
 * the use is refused: the catch is not the player's, it is fighting,
 * it is still an egg, the item is not carried, or the item would
 * change nothing
 */
export default async function useHealingItem(
  uid: string,
  catchId: string,
  item: Items,
): Promise<HealthState | null> {
  return tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // A pokemon in a live battle is fighting on a frozen snapshot;
    // healing the record under it would leave the two disagreeing.
    // An egg has nothing to heal yet
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
    const healed = healedByItem(record, item);

    // The wrong cure, a pokemon already whole, a potion on a fainted
    // one, a revive on a standing one, or a berry that only does
    // anything inside a battle
    if (healed == null) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (stock < 1) {
      return null;
    }

    // Herbal medicine is swallowed rather than sipped, and the pokemon
    // holds it against whoever administered it. The loss is taken once
    // per mouthful, and the Luxury Ball does not soften it: a
    // comfortable ball is a reason to think better of somebody, never
    // a reason to mind a mouthful of root less
    const mouthfuls = bitterness(item);
    const fields: Record<string, unknown> = { health: healed.health, statuses: healed.statuses };

    if (mouthfuls > 0) {
      fields.friendship = gainFriendship(record.friendship, 'herb', mouthfuls);
    }

    await writeStackIn(transaction, ITEM_STACKS, uid, item, stock - 1);
    await updateCaughtIn(transaction, catchId, fields);
    return healed;
  });
}
