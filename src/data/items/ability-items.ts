import { Slots, mostSlots } from '../constants/slots';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

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

export default function registerAbilityItems(): void {
  registerItem(Items.AbilityCapsule, {
    name: 'Ability Capsule',
    description: `Draws another ability its line can reach into one pokemon, up to ${mostSlots(
      ABILITY_CAPSULE_SLOT,
    )} of them. Which one is a roll. Spent on use.`,
    type: ItemTypes.Training,
    // Drawn on the medicine sheet, which is where the collection
    // packed it
    icon: 'medicine/ability-capsule',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });

  registerItem(Items.AbilityPatch, {
    name: 'Ability Patch',
    description:
      "Writes its family's signature ability into one pokemon for good, replacing an ability you choose when no slot is free. Spent on use.",
    type: ItemTypes.Training,
    // Drawn on the other sheet, beside the bottle caps
    icon: 'other/ability-patch',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
