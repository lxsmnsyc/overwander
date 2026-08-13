import { MAX_IV, STAT_ORDER, getIV, setIV } from '../constants/stats';
import Abilities from '../ids/abilities';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The Purifying Gem: the only thing that takes a shadow off a pokemon.
 *
 * A shadow catch comes out of a shadow raid carrying the Shadow
 * ability for good and paying twice the candy at every level. That is
 * the trade — a stronger thing to have caught, dearer to raise — and
 * until now it was permanent. The gem undoes it: the ability becomes
 * `Purified`, which does nothing at all, the levelling cost drops back
 * to what any other pokemon pays, and the pokemon comes out of it a
 * little better than it went in.
 *
 * The mark is left on purpose. `Purified` is cosmetic, and it is the
 * only record on the pokemon itself that it was ever a shadow — a
 * player who purifies one has changed what it costs, not what it was.
 */

/**
 * What purifying adds to every one of the six values. It is small, and
 * it is the only reason to purify a pokemon you were going to raise
 * anyway: a gem is worth spending on a shadow worth keeping
 */
export const PURIFY_IV_BOOST = 2;

/**
 * Whether the item is the gem
 */
export function isPurifyingGem(item: Items): boolean {
  return item === Items.PurifyingGem;
}

/**
 * Whether the pokemon is one the gem has anything to do: a shadow, and
 * nothing else. Purifying what is already purified would spend a rare
 * item on nothing
 */
export function isPurifiable(caught: { shadow: boolean }): boolean {
  return caught.shadow;
}

/**
 * The values a purified pokemon keeps: every stat two higher than it
 * was, and none of them past the cap. A stat already at 30 gains one
 * rather than overshooting
 */
export function purifyIVs(ivs: number): number {
  let purified = ivs;

  for (const stat of STAT_ORDER) {
    purified = setIV(purified, stat, Math.min(MAX_IV, getIV(ivs, stat) + PURIFY_IV_BOOST));
  }
  return purified;
}

/**
 * The abilities it walks away with: the Shadow ability becomes
 * `Purified` where it stands, so the rest of what it has — the one it
 * rolled — is left exactly where it was
 */
export function purifyAbilities(abilities: Abilities[]): Abilities[] {
  return abilities.map((ability) => (ability === Abilities.Shadow ? Abilities.Purified : ability));
}

export default function registerPurifyingGem(): void {
  registerItem(Items.PurifyingGem, {
    name: 'Purifying Gem',
    // Spent on a pokemon to change what it is rather than what it can
    // do, the way a bottle cap is
    type: ItemTypes.Training,
    // Nothing on the sheets is a purifying gem; the sparkling stone
    // is the one drawn thing that reads as a stone that cleanses
    icon: 'key/sparkling-stone',
    flags: ItemFlags.Usable | ItemFlags.Consumable,
    buy: 0,
    sell: 0,
  });
}
