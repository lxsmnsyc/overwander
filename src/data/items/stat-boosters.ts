import { Items } from '../ids/items';

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
 * this is only which items they are.
 */

/** The items a shop stocks */
export const GENERAL_STAT_BOOSTERS = new Set<Items>([
  Items.ChoiceBand,
  Items.ChoiceSpecs,
  Items.ChoiceScarf,
  Items.AssaultVest,
  Items.Eviolite,
]);

/**
 * The species relics: found in the world, never stocked, and useless
 * in any grip but the right one
 */
export const RELIC_STAT_BOOSTERS = new Set<Items>([
  Items.LightBall,
  Items.ThickClub,
  Items.MetalPowder,
  Items.QuickPowder,
]);
