import type { Items } from '../ids/items';
import type { Species } from '../ids/species';
import { getBaseFormSpecies } from '../ids/forms';
import { getSpeciesData } from '../species/__create';
import { getMegaBase } from '../species/megas';
import { itemText } from './__create';
import recordsFile from './records/mega-stones.yaml';
import { readFamilyRecords } from './yaml';

/**
 * The Mega Stones: held for the Mega a pokemon takes in a fight.
 *
 * Unlike a form item, holding one is not enough on its own. A team
 * Mega Evolves once, so the battle side in
 * [`src/battle/gimmicks/mega.ts`](../../battle/gimmicks/mega.ts) picks
 * which holder gets to.
 */

interface MegaStone {
  mega: Species;
  /**
   * The Megas the stone opens for the species' other forms: a female
   * Meowstic and each Tatsugiri wear their own
   */
  forms?: Species[];
}

/** Each stone and the Mega it opens, in the order its records file writes them */
export const MEGA_STONES = new Map<Items, MegaStone>();

for (const [item, { mega, forms }] of readFamilyRecords('mega-stones', recordsFile)) {
  if (mega != null) {
    MEGA_STONES.set(item, forms == null ? { mega } : { mega, forms });
  }
}

/** The Mega this stone puts its holder in, or null for everything else in the bag */
export function getStoneMega(item: Items): Species | null {
  return MEGA_STONES.get(item)?.mega ?? null;
}

/** Every Mega one stone opens, one for each form that can hold it */
function stoneMegas(stone: MegaStone): Species[] {
  return [stone.mega, ...(stone.forms ?? [])];
}

/** Every Mega this stone opens, or none for anything that is not one */
export function getStoneMegas(item: Items): Species[] {
  const stone = MEGA_STONES.get(item);

  return stone == null ? [] : stoneMegas(stone);
}

/**
 * The Mega this stone puts this holder in, or null where it is not the
 * holder's. A stone names a form, so an Alolan Raichu holding a
 * Raichunite stays as it is, and each Tatsugiri wears its own
 */
export function getHolderMega(item: Items, holder: Species): Species | null {
  const stone = MEGA_STONES.get(item);

  if (stone == null) {
    return null;
  }
  for (const mega of stoneMegas(stone)) {
    if (getMegaBase(mega) === holder) {
      return mega;
    }
  }
  return null;
}

/** Every stone this species can hold for a Mega of its own: two for a Charizard, none for most */
export function getSpeciesStones(species: Species): Items[] {
  const stones: Items[] = [];

  for (const item of MEGA_STONES.keys()) {
    if (getHolderMega(item, species) != null) {
      stones.push(item);
    }
  }
  return stones;
}

/** The stone that puts a pokemon in this Mega, or null for anything that is not one */
export function getMegaStone(mega: Species): Items | null {
  for (const [item, stone] of MEGA_STONES) {
    if (stoneMegas(stone).includes(mega)) {
      return item;
    }
  }
  return null;
}

/** Every stone's line names the pokemon that holds it */
export function describeMegaStone(item: Items): string {
  const stone = MEGA_STONES.get(item);

  if (stone == null) {
    throw new Error(`${item} is not a Mega Stone`);
  }
  return itemText('mega-stones', 'stone', {
    holder: getSpeciesData(getMegaBase(stone.mega) ?? getBaseFormSpecies(stone.mega)).name,
  });
}
