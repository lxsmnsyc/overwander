import { Slots } from '../../data/constants/slots';
import { ItemFlags, ItemTypes, type Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Whether the unit holds any item
 */
export function holdsAnyItem(unit: Unit): boolean {
  for (const held of Object.values(unit.items)) {
    if (held) {
      return true;
    }
  }
  return false;
}

/**
 * Holdable items currently occupying the unit's item slots (disabled
 * ones included: a disabled item is still in the grip)
 */
export function countHeldItems(unit: Unit): number {
  let count = 0;

  for (const key in unit.items) {
    // tsc requires the assertion to index the Items-mapped record;
    // tsgolint resolves the const enum to number and disagrees
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const item = Number(key) as Items;

    if (unit.items[item] != null && getItemData(item).flags & ItemFlags.Holdable) {
      count += 1;
    }
  }

  return count;
}

/**
 * Whether the unit has room for another held item. The ceiling is the
 * record's, carried on the unit as `slots` — nothing about the battle
 * decides how much a pokemon can hold
 */
export function hasFreeItemSlot(unit: Unit): boolean {
  return countHeldItems(unit) < unit.checkSlots(Slots.Item);
}

/**
 * Whether the item is used up by its effect, which is what decides
 * whether a foe eating, stealing or flinging it costs the catch record
 * the item once the battle ends
 */
export function isConsumable(item: Items): boolean {
  return (getItemData(item).flags & ItemFlags.Consumable) !== 0;
}

/**
 * The one item a thief could walk off with, or nothing when the unit's
 * hands are empty.
 *
 * Drawn at random rather than taken off the top of the bag: which of
 * two held items goes is nobody's decision, and the bag's order is an
 * accident of what was put in it first. It rolls the battle's own RNG,
 * so two clients watching the same fight see the same thing taken
 */
export function stealableItem(unit: Unit): Items | undefined {
  const held: Items[] = [];

  for (const [item, carried] of Object.entries(unit.items)) {
    if (carried) {
      // The bag is keyed by the item enum, which comes back as a
      // string from Object.entries
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      held.push(Number(item) as Items);
    }
  }
  if (held.length === 0) {
    return undefined;
  }

  // Held inside the bag: a roll of exactly 1, which a pinned RNG
  // hands out, would otherwise point one past the last item
  return held[Math.min(held.length - 1, Math.floor(unit.battle.random() * held.length))];
}

/** Whether a berry the unit ate itself caused this */
export function isOwnBerry(cause: EffectCause, eater: Unit): boolean {
  return (
    cause.type === EffectType.Item &&
    cause.unit === eater &&
    getItemData(cause.item).type === ItemTypes.Berry
  );
}
