import { Slots, mostSlots } from '../constants/slots';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The two that work on a pokemon's abilities.
 *
 * A Capsule is the Channeler in the bag: it widens the pokemon and
 * draws one more of the abilities its line can reach into the new
 * slot, which is her whole trade. What it buys is not a thing she
 * cannot do, it is being able to ask without finding her and without
 * waiting for the next window. A Patch writes the family's signature
 * instead, and a signature is the one ability nothing rolls and she
 * never calls up.
 *
 * Both are found rather than sold, for the reason a Utility Belt is:
 * a shop that stocked them would sell every pokemon in the game a
 * wider record.
 */

/** What a Capsule widens */
export const ABILITY_CAPSULE_SLOT = Slots.Ability;

export function isAbilityCapsule(item: Items): boolean {
  return item === Items.AbilityCapsule;
}

export function isAbilityPatch(item: Items): boolean {
  return item === Items.AbilityPatch;
}

export function describeAbilityItem(item: Items): string {
  if (!isAbilityCapsule(item)) {
    throw new Error(`No ability item description for item ${item}`);
  }
  return itemText('ability-items', 'capsule', { slots: mostSlots(ABILITY_CAPSULE_SLOT) });
}
