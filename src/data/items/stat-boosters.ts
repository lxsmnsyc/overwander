import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

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
export const GENERAL_STAT_BOOSTERS: Map<Items, string> = new Map([
  [Items.ChoiceBand, 'Choice Band'],
  [Items.ChoiceSpecs, 'Choice Specs'],
  [Items.ChoiceScarf, 'Choice Scarf'],
  [Items.AssaultVest, 'Assault Vest'],
  [Items.Eviolite, 'Eviolite'],
]);

/**
 * The species relics: found in the world, never stocked, and useless
 * in any grip but the right one
 */
export const RELIC_STAT_BOOSTERS: Map<Items, string> = new Map([
  [Items.LightBall, 'Light Ball'],
  [Items.ThickClub, 'Thick Club'],
  [Items.MetalPowder, 'Metal Powder'],
  [Items.QuickPowder, 'Quick Powder'],
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
  for (const [item, name] of GENERAL_STAT_BOOSTERS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: STAT_BOOSTER_PRICE,
      sell: STAT_BOOSTER_PRICE * STAT_BOOSTER_RESALE,
    });
  }

  for (const [item, name] of RELIC_STAT_BOOSTERS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      // Found rather than bought: a relic has no listing, only a
      // price somebody will pay for it
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: RELIC_RESALE,
    });
  }
}
