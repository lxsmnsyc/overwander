import { STAT_NAMES } from '../constants/stats';
import { Items } from '../ids/items';
import Natures, { NATURE_EFFECTS, NATURE_NAMES, getNatureFactor } from '../ids/natures';
import { itemText } from './__create';

/**
 * The mints: the only thing that changes a pokemon's nature.
 *
 * A nature is rolled when the encounter is staged and decides two of
 * the six stats for good, so a pokemon that came out Modest was a
 * special attacker whatever its owner wanted. A mint rewrites it
 * outright rather than masking it the way the main games do: the
 * summary goes on telling the truth, and nothing has to store what a
 * pokemon used to be.
 *
 * There is one per nature that does something, and a Serious Mint for
 * a pokemon that should do nothing. A mint is spent on one pokemon and
 * gone, and it is never held.
 */

/**
 * The nature each mint leaves behind. The four other neutral natures
 * (Hardy, Docile, Bashful, Quirky) have no mint of their own, since
 * Serious already says "raise nothing, lower nothing"
 */
export const MINT_NATURES = new Map<Items, Natures>([
  [Items.LonelyMint, Natures.Lonely],
  [Items.BraveMint, Natures.Brave],
  [Items.AdamantMint, Natures.Adamant],
  [Items.NaughtyMint, Natures.Naughty],
  [Items.BoldMint, Natures.Bold],
  [Items.RelaxedMint, Natures.Relaxed],
  [Items.ImpishMint, Natures.Impish],
  [Items.LaxMint, Natures.Lax],
  [Items.TimidMint, Natures.Timid],
  [Items.HastyMint, Natures.Hasty],
  [Items.SeriousMint, Natures.Serious],
  [Items.JollyMint, Natures.Jolly],
  [Items.NaiveMint, Natures.Naive],
  [Items.ModestMint, Natures.Modest],
  [Items.MildMint, Natures.Mild],
  [Items.QuietMint, Natures.Quiet],
  [Items.RashMint, Natures.Rash],
  [Items.CalmMint, Natures.Calm],
  [Items.GentleMint, Natures.Gentle],
  [Items.SassyMint, Natures.Sassy],
  [Items.CarefulMint, Natures.Careful],
]);

/** Whether the item is one of the mints */
export function isMint(item: Items): boolean {
  return MINT_NATURES.has(item);
}

/** The nature this mint leaves behind, or null for anything else */
export function getMintNature(item: Items): Natures | null {
  return MINT_NATURES.get(item) ?? null;
}

/**
 * What a mint says it does, read off the nature rather than written
 * out, so a nature retuned here re-describes every mint that makes it
 */
export function describeMint(nature: Natures): string {
  const effect = NATURE_EFFECTS[nature];

  if (effect == null) {
    return itemText('mints', 'neutral', { nature: NATURE_NAMES[nature] });
  }
  return itemText('mints', 'mint', {
    nature: NATURE_NAMES[nature],
    up: getNatureFactor(nature, effect.up),
    raised: STAT_NAMES[effect.up],
    down: getNatureFactor(nature, effect.down),
    lowered: STAT_NAMES[effect.down],
  });
}

/** The same line, for the mint item rather than its nature */
export function describeMintItem(item: Items): string {
  const nature = MINT_NATURES.get(item);

  if (nature == null) {
    throw new Error(`Item ${item} is not a mint`);
  }
  return describeMint(nature);
}
