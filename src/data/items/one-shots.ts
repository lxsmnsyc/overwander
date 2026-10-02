import { Items } from '../ids/items';

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

/** What the market lists */
export const ONE_SHOTS = new Set<Items>([
  Items.FocusSash,
  Items.AirBalloon,
  Items.WeaknessPolicy,
  Items.BlunderPolicy,
  Items.AbsorbBulb,
  Items.CellBattery,
  Items.Snowball,
  Items.LuminousMoss,
  Items.ThroatSpray,
  Items.WhiteHerb,
  Items.MentalHerb,
  Items.PowerHerb,
  Items.AdrenalineOrb,
  Items.ElectricSeed,
  Items.GrassySeed,
  Items.MistySeed,
  Items.PsychicSeed,
  Items.RedCard,
  Items.EjectButton,
  Items.EjectPack,
]);

export function isOneShot(item: Items): boolean {
  return ONE_SHOTS.has(item);
}
