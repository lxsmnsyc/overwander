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
export const ONE_SHOTS: Map<Items, [name: string, description: string]> = new Map([
  [
    Items.FocusSash,
    ['Focus Sash', 'Leaves its holder on 1 HP the first time a blow would take it from full.'],
  ],
  [
    Items.AirBalloon,
    ['Air Balloon', 'Its holder floats, so Ground moves miss. Pops on the first hit that lands.'],
  ],
  [
    Items.WeaknessPolicy,
    ['Weakness Policy', '+2 Attack and +2 Special Attack after a super-effective blow lands.'],
  ],
  [Items.BlunderPolicy, ['Blunder Policy', '+1 Speed after its holder misses.']],
  [Items.AbsorbBulb, ['Absorb Bulb', '+1 Special Attack after a Water move lands on its holder.']],
  [Items.CellBattery, ['Cell Battery', '+1 Attack after an Electric move lands on its holder.']],
  [Items.Snowball, ['Snowball', '+1 Attack after an Ice move lands on its holder.']],
  [
    Items.LuminousMoss,
    ['Luminous Moss', '+1 Special Defense after a Water move lands on its holder.'],
  ],
  [Items.ThroatSpray, ['Throat Spray', '+1 Special Attack after its holder casts a sound move.']],
  [Items.WhiteHerb, ['White Herb', 'Puts back every lowered stage at once, then is gone.']],
  [Items.MentalHerb, ['Mental Herb', 'Clears infatuation the moment it lands.']],
  [
    Items.PowerHerb,
    ['Power Herb', 'Its holder\u2019s next cast goes off instantly, with no wind-up.'],
  ],
  [
    Items.AdrenalineOrb,
    ['Adrenaline Orb', '+1 Speed when its holder is stared down by an Intimidate.'],
  ],
  [
    Items.RedCard,
    [
      'Red Card',
      'Sends the attacker away — an enemy for their weakest, an ally for their strongest.',
    ],
  ],
  [
    Items.EjectButton,
    ['Eject Button', 'Swaps its holder out for the strongest of their bench when a blow lands.'],
  ],
  [
    Items.EjectPack,
    [
      'Eject Pack',
      'Swaps its holder out for the strongest of their bench when a stat is knocked down.',
    ],
  ],
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
  for (const [item, [name, description]] of ONE_SHOTS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: ONE_SHOT_PRICE,
      sell: ONE_SHOT_PRICE * ONE_SHOT_RESALE,
    });
  }
}
