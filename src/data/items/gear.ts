import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The gear: held items that work for as long as they are carried and
 * are never spent.
 *
 * They are the plainest kind of held item there is. Each one is a
 * single standing rule — a share of health back every second, a tenth
 * more accuracy, a share of what touching the holder costs — and none
 * of them asks anything of the player once it is in the grip. What
 * makes carrying one a decision is the slot: a pokemon holds only so
 * many things at once, and the gear competes with the gems, the
 * berries and the stat items for the same room.
 *
 * The battle side of them lives in
 * [`src/battle/items/gear.ts`](../../battle/items/gear.ts); this is
 * only what they are and what they cost.
 */

/**
 * What the market lists, and what one costs. The price is flat across
 * the shelf on purpose: none of them is strictly better than another,
 * so what a player is choosing between is what their pokemon needs
 * rather than what they can afford
 */
export const MARKET_GEAR: Map<Items, string> = new Map([
  [Items.Leftovers, 'Leftovers'],
  [Items.ShellBell, 'Shell Bell'],
  [Items.BigRoot, 'Big Root'],
  [Items.MuscleBand, 'Muscle Band'],
  [Items.WiseGlasses, 'Wise Glasses'],
  [Items.ExpertBelt, 'Expert Belt'],
  [Items.Metronome, 'Metronome'],
  [Items.WideLens, 'Wide Lens'],
  [Items.ScopeLens, 'Scope Lens'],
  [Items.BrightPowder, 'Bright Powder'],
  [Items.QuickClaw, 'Quick Claw'],
  [Items.FocusBand, 'Focus Band'],
  [Items.RockyHelmet, 'Rocky Helmet'],
  [Items.SafetyGoggles, 'Safety Goggles'],
  [Items.UtilityUmbrella, 'Utility Umbrella'],
  [Items.SmokeBall, 'Smoke Ball'],
  [Items.DestinyKnot, 'Destiny Knot'],
  [Items.LightClay, 'Light Clay'],
  [Items.GripClaw, 'Grip Claw'],
  [Items.BindingBand, 'Binding Band'],
  [Items.DampRock, 'Damp Rock'],
  [Items.HeatRock, 'Heat Rock'],
  [Items.IcyRock, 'Icy Rock'],
  [Items.SmoothRock, 'Smooth Rock'],
  [Items.ZoomLens, 'Zoom Lens'],
  [Items.ShedShell, 'Shed Shell'],
]);

/**
 * The gear nobody sells. A Black Sludge is rubbish somebody dropped
 * and the two lenses are the same kind of thing the Thick Club and the
 * Light Ball are — worth a great deal to one species and nothing to
 * anybody else — so all three are found in the world rather than
 * listed, and a vendor will only take one off a player's hands
 */
export const FOUND_GEAR: Map<Items, string> = new Map([
  [Items.BlackSludge, 'Black Sludge'],
  [Items.LuckyPunch, 'Lucky Punch'],
  [Items.Stick, 'Stick'],
]);

export const GEAR_PRICE = 5000;

const GEAR_RESALE = 0.5;

/**
 * What a found piece of gear fetches. Nothing stocks them, so this is
 * only what somebody will pay to take one away
 */
const FOUND_GEAR_RESALE = 1000;

export function isGear(item: Items): boolean {
  return MARKET_GEAR.has(item) || FOUND_GEAR.has(item);
}

export default function registerGear(): void {
  for (const [item, name] of MARKET_GEAR) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      // Held for as long as its holder keeps it: none is consumed,
      // and none is used on a pokemon
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: GEAR_PRICE,
      sell: GEAR_PRICE * GEAR_RESALE,
    });
  }

  for (const [item, name] of FOUND_GEAR) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: FOUND_GEAR_RESALE,
    });
  }
}
