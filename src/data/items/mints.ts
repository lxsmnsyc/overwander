import { STAT_NAMES, Stats } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import Natures, { NATURE_EFFECTS, NATURE_NAMES, getNatureFactor } from '../ids/natures';
import { registerItem } from './__create';

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
 * What a mint costs. Dearer than a vitamin, which moves one stat by a
 * little: a nature is two stats for the rest of the pokemon's life
 */
export const MINT_PRICE = 12_000;

/**
 * Which picture a mint takes. There is one per stat a nature can
 * raise rather than one per mint, so the four that raise Attack share
 * a jar and a neutral one has its own
 */
const MINT_ICONS: Record<Stats, string> = {
  [Stats.HP]: 'mints/neutral',
  [Stats.Attack]: 'mints/attack',
  [Stats.Defense]: 'mints/defense',
  [Stats.SpecialAttack]: 'mints/special-attack',
  [Stats.SpecialDefense]: 'mints/special-defense',
  [Stats.Speed]: 'mints/speed',
};

function mintIcon(nature: Natures): string {
  const effect = NATURE_EFFECTS[nature];

  return effect == null ? 'mints/neutral' : MINT_ICONS[effect.up];
}

/**
 * What a mint says it does, read off the nature rather than written
 * out, so a nature retuned here re-describes every mint that makes it
 */
export function describeMint(nature: Natures): string {
  const effect = NATURE_EFFECTS[nature];
  const made = `Makes it ${NATURE_NAMES[nature]}`;

  if (effect == null) {
    return `${made}, which raises and lowers nothing. Spent on use.`;
  }
  const up = getNatureFactor(nature, effect.up);
  const down = getNatureFactor(nature, effect.down);

  return `${made}: ${up}x ${STAT_NAMES[effect.up]}, ${down}x ${STAT_NAMES[effect.down]}. Spent on use.`;
}

export default function registerMints(): void {
  for (const [item, nature] of MINT_NATURES) {
    registerItem(item, {
      name: `${NATURE_NAMES[nature]} Mint`,
      description: describeMint(nature),
      type: ItemTypes.Training,
      icon: mintIcon(nature),
      flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: MINT_PRICE,
      sell: MINT_PRICE / 2,
    });
  }
}
