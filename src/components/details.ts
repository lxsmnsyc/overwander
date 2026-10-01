import type Abilities from '../data/ids/abilities';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { getAbilityData, getSignatureAbility } from '../data/abilities';
import type { Species } from '../data/ids/species';
import { getSpeciesAbilityPools, getSpeciesData } from '../data/species';
import { getItemData } from '../data/items';
import { getMoveData } from '../data/moves';
import { type CaughtPokemon, getCatchName } from '../auth/caught-record';
import { isEgg } from '../auth/egg';

/**
 * What an ability, a move or an item is called, and what it does,
 * wherever one is named.
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

/**
 * Where an ability comes from for this species: its family's signature,
 * its hidden pool, or the ordinary one. Each is drawn in its own colour
 */
export type AbilityKind = 'regular' | 'hidden' | 'signature';

export function abilityKind(species: Species, ability: Abilities): AbilityKind {
  try {
    if (getSignatureAbility(getSpeciesData(species).family) === ability) {
      return 'signature';
    }
    return getSpeciesAbilityPools(species).hidden.includes(ability) ? 'hidden' : 'regular';
  } catch {
    return 'regular';
  }
}

/** The small pill an ability is drawn as on a card, by where it comes from */
export const ABILITY_PILLS: Record<AbilityKind, string> = {
  regular: 'border-line-soft bg-tide-soft text-tide-dark',
  hidden: 'border-arcane/40 bg-arcane/15 text-arcane',
  signature: 'border-gold/50 bg-gold-soft text-gold',
};

export function describeMove(move: Moves): string {
  try {
    return getMoveData(move).name;
  } catch {
    return `Move #${move}`;
  }
}

export function detailMove(move: Moves): { name: string; description: string } {
  try {
    const data = getMoveData(move);

    return { name: data.name, description: data.description };
  } catch {
    return { name: describeMove(move), description: 'Nothing is known about this.' };
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

/**
 * What a hover card over a catch is titled. An egg is only an egg: its
 * species is what hatching it tells you
 */
export function titleCatch(caught: CaughtPokemon | undefined): string {
  if (caught == null) {
    return 'Pokémon';
  }
  return isEgg(caught) ? 'Egg' : getCatchName(caught);
}
