import type { CaughtPokemon } from '../../auth/caught';
import { isShadow } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { getHeldPowerStat } from '../../data/items/power-items';
import type { BreedingParent } from '../breeding';

/** A catch as the breeding rules read one */
export function asParent(caught: CaughtPokemon): BreedingParent {
  const held = new Set(caught.items);

  return {
    species: caught.species,
    gender: caught.gender,
    ivs: caught.ivs,
    moves: caught.moves,
    shadow: isShadow(caught),
    nature: caught.nature,
    ability: caught.abilities[0],
    ball: caught.ball,
    everstone: held.has(Items.Everstone),
    destinyKnot: held.has(Items.DestinyKnot),
    powerStat: getHeldPowerStat(caught.items),
    egg: isEgg(caught),
  };
}

/**
 * What one of these costs, from whichever side of the counter it is
 * looked at: a shop charges `buy` and pays `sell`
 */
export function priceOf(item: Items, buying: boolean): number {
  const data = getItemData(item);

  return buying ? data.buy : data.sell;
}

/** What the player holds of a gold fee, as a counter's chip says it */
export function goldHeld(gold: number, fee = 0): { amount: number; short: boolean; unit: string } {
  return { amount: gold, short: gold < fee, unit: 'gold' };
}

/** And of the Heart Scales one charges */
export function scalesHeld(scales: number): { amount: number; short: boolean; unit: string } {
  return { amount: scales, short: scales < 1, unit: scales === 1 ? 'Heart Scale' : 'Heart Scales' };
}
