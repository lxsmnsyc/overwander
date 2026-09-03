import 'server-only';
import { asNumberArray } from '../auth/__normalize';
import { ITEM_STACKS } from '../auth/stacks';
import AleaRNG from '../core/alea';
import { MAX_SLOTS, Slots, countAbilitySlots, getSlots, withSlots } from '../data/constants/slots';
import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { getAwakenableAbilities } from '../data/overworld/npc';
import { isEggRecord, isGuardedRecord } from './catch-fields';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber } from './read';
import { readStackIn, writeStackIn } from './stacks';

/**
 * Drawing a second ability out of a pokemon, written with admin
 * credentials.
 *
 * Two things move together and must not come apart: the room the
 * record has for abilities, and the ability that fills it. A widened
 * pokemon with nothing in the new slot is worse than one that was
 * refused, so the slot, the ability and the scale are one write.
 */

/**
 * What the Channeler left behind: the ability she drew out and how
 * much room the pokemon now has for them
 */
export interface Awakening {
  ability: Abilities;
  slots: number;
}

/**
 * Widen one of the player's catches by an ability slot and fill it
 * from what its line is capable of.
 *
 * `seed` fixes which ability comes out, so a player who asks twice in
 * the same window is asking the same question rather than rerolling
 * it.
 *
 * Resolves what was drawn out, or null when the use is refused: the
 * catch is not the player's, it is fighting, it is still an egg or
 * guarded, no scale is carried, the field has no room left, or the
 * line has nothing it does not already have
 */
export default async function awakenAbility(
  uid: string,
  catchId: string,
  price: Items,
  seed: string,
): Promise<Awakening | null> {
  return tx(async (transaction) => {
    // Its abilities, since a second is being drawn beside them; the
    // rest of what it keeps is not read
    const caught = await readCaughtIn(transaction, catchId, true, ['abilities']);

    // A pokemon fights on the snapshot its battle froze, so an
    // ability written mid-raid lands on a record the fight is not
    // reading; an egg has not hatched into anything to draw from
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const known = asNumberArray(caught.abilities) as Abilities[];
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;
    const slots = asNumber(caught.slots);
    const room = getSlots(slots, Slots.Ability);

    if (room >= MAX_SLOTS) {
      return null;
    }

    // The room may already be wider than what fills it — a shadow's
    // mark rides free, and an admin gift can be written roomy — so
    // what is asked for is a slot the pokemon can actually use
    if (countAbilitySlots(known) < room) {
      return null;
    }

    const pool = getAwakenableAbilities(species, known);

    if (pool.length === 0) {
      return null;
    }

    const stock = await readStackIn(transaction, ITEM_STACKS, uid, price);

    if (stock < 1) {
      return null;
    }

    const ability = pool[Math.floor(new AleaRNG(seed).random() * pool.length)];

    await writeStackIn(transaction, ITEM_STACKS, uid, price, stock - 1);
    await updateCaughtIn(transaction, catchId, {
      abilities: [...known, ability],
      slots: withSlots(slots, Slots.Ability, room + 1),
    });

    return { ability, slots: room + 1 };
  });
}
