import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The one-shots: held against a single moment, and gone once it comes.
 *
 * Every one of them waits for something that may never happen — a blow
 * that would have finished its holder, a hit taken badly, a move that
 * missed — and pays out once when it does. That is what makes them
 * cheaper than the gear: a Leftovers works all fight, a Focus Sash
 * works once, and a fight where the moment never arrives is a fight
 * the item sat out entirely.
 *
 * They are consumed the way a berry is, so what a pokemon spends in a
 * raid comes off its catch record when the fight ends. The battle side
 * lives in
 * [`src/battle/items/one-shots.ts`](../../battle/items/one-shots.ts).
 */

/**
 * What the market lists. One flat price, for the same reason the gear
 * has one: what a player is picking is the moment they expect to have,
 * not the one they can afford
 */
export const ONE_SHOTS: Map<Items, string> = new Map([
  [Items.FocusSash, 'Focus Sash'],
  [Items.AirBalloon, 'Air Balloon'],
  [Items.WeaknessPolicy, 'Weakness Policy'],
  [Items.BlunderPolicy, 'Blunder Policy'],
  [Items.AbsorbBulb, 'Absorb Bulb'],
  [Items.CellBattery, 'Cell Battery'],
  [Items.Snowball, 'Snowball'],
  [Items.LuminousMoss, 'Luminous Moss'],
  [Items.ThroatSpray, 'Throat Spray'],
  [Items.WhiteHerb, 'White Herb'],
  [Items.MentalHerb, 'Mental Herb'],
  [Items.PowerHerb, 'Power Herb'],
  [Items.AdrenalineOrb, 'Adrenaline Orb'],
]);

/**
 * Half again of a gem, which is the other thing in the game that is
 * held for exactly one moment. A gem lifts a hit its holder chose to
 * throw; these answer something done to the holder, which is worth
 * more precisely because it cannot be planned
 */
export const ONE_SHOT_PRICE = 3000;

const ONE_SHOT_RESALE = 0.5;

export function isOneShot(item: Items): boolean {
  return ONE_SHOTS.has(item);
}

export default function registerOneShots(): void {
  for (const [item, name] of ONE_SHOTS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: ONE_SHOT_PRICE,
      sell: ONE_SHOT_PRICE * ONE_SHOT_RESALE,
    });
  }
}
