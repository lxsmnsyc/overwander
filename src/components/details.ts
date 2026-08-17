import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import { getAbilityData } from '../data/abilities';
import { getItemData } from '../data/items';

/**
 * What an ability or an item is called, and what it does, wherever one
 * is named.
 *
 * A lookup that throws would take its screen down with it — a battle
 * card reads a unit's abilities sixty times a second — so an entry the
 * registry does not know is named rather than fatal.
 */

export function describeAbility(ability: Abilities): string {
  try {
    return getAbilityData(ability).name;
  } catch {
    return `Ability #${ability}`;
  }
}

/**
 * What the card over one says. Something unregistered has nothing to
 * say about itself, which is said rather than left blank
 */
export function detailAbility(ability: Abilities): { name: string; description: string } {
  try {
    const data = getAbilityData(ability);

    return { name: data.name, description: data.description };
  } catch {
    return { name: describeAbility(ability), description: 'Nothing is known about this.' };
  }
}

export function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

export function detailItem(item: Items): { name: string; description: string } {
  try {
    const data = getItemData(item);

    return { name: data.name, description: data.description };
  } catch {
    return { name: describeItem(item), description: 'Nothing is known about this.' };
  }
}
