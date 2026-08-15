import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * Stat-enhancing held items: what a pokemon carries to be stronger
 * than it is.
 *
 * They come in two kinds. The **general** ones are bought, cost a
 * great deal, and each takes something back for what it gives — a
 * Choice item locks its holder into the first move it reaches for, an
 * Assault Vest will not let one use a status move at all. The
 * **relics** are found, worth nothing to anybody but the one species
 * that knows what to do with them, and take nothing back: a Thick
 * Club is a bone to a Cubone and a stick to everyone else.
 *
 * The battle side of them lives in
 * [`src/battle/items/stat-boosters.ts`](../../battle/items/stat-boosters.ts);
 * this is only what they are and what they cost.
 */

/**
 * The items a shop stocks, and what one costs. They are dear because
 * each is worth half again of a stat
 */
export const GENERAL_STAT_BOOSTERS: Map<Items, [name: string, description: string]> = new Map([
  [
    Items.ChoiceBand,
    ['Choice Band', '1.5x Attack, but its holder can only cast the move it opened with.'],
  ],
  [
    Items.ChoiceSpecs,
    ['Choice Specs', '1.5x Special Attack, but its holder can only cast the move it opened with.'],
  ],
  [
    Items.ChoiceScarf,
    ['Choice Scarf', '1.5x Speed, but its holder can only cast the move it opened with.'],
  ],
  [
    Items.AssaultVest,
    ['Assault Vest', '1.5x Special Defense. Its holder cannot cast a status move at all.'],
  ],
  [
    Items.Eviolite,
    ['Eviolite', '1.5x both defenses, for a pokemon with somewhere left to evolve to.'],
  ],
]);

/**
 * The species relics: found in the world, never stocked, and useless
 * in any grip but the right one
 */
export const RELIC_STAT_BOOSTERS: Map<Items, [name: string, description: string]> = new Map([
  [
    Items.LightBall,
    ['Light Ball', 'Doubles a Pikachu’s Attack and Special Attack. Nothing to anybody else.'],
  ],
  [
    Items.ThickClub,
    ['Thick Club', 'Doubles a Cubone’s or Marowak’s Attack. Nothing to anybody else.'],
  ],
  [Items.MetalPowder, ['Metal Powder', 'Doubles a Ditto’s Defense. Nothing to anybody else.']],
  [Items.QuickPowder, ['Quick Powder', 'Doubles a Ditto’s Speed. Nothing to anybody else.']],
]);

export const STAT_BOOSTER_PRICE = 8000;

const STAT_BOOSTER_RESALE = 0.5;

/**
 * What a relic sells for. Nothing stocks them, so the price is only
 * what a shop will take one off a player's hands for
 */
const RELIC_RESALE = 1000;

/**
 * Register the stat-enhancing items. Every one of them is held for as
 * long as its holder keeps it: none is consumed, and none is used on
 * a pokemon
 */
export default function registerStatBoosters(): void {
  for (const [item, [name, description]] of GENERAL_STAT_BOOSTERS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      description,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: STAT_BOOSTER_PRICE,
      sell: STAT_BOOSTER_PRICE * STAT_BOOSTER_RESALE,
    });
  }

  for (const [item, [name, description]] of RELIC_STAT_BOOSTERS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      description,
      icon: nameToIcon('held', name),
      // Found rather than bought: a relic has no listing, only a
      // price somebody will pay for it
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: RELIC_RESALE,
    });
  }
}
