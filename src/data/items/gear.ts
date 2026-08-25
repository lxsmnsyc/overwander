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
export const MARKET_GEAR: Map<Items, [name: string, description: string]> = new Map([
  [Items.ShellBell, ['Shell Bell', 'Hands its holder back 1/8 of the damage it deals.']],
  [Items.MuscleBand, ['Muscle Band', '1.1x damage from physical moves.']],
  [Items.WiseGlasses, ['Wise Glasses', '1.1x damage from special moves.']],
  [Items.ExpertBelt, ['Expert Belt', '1.2x damage, but only from super-effective blows.']],
  [
    Items.Metronome,
    ['Metronome', '1.2x damage for each repeat of the same move, up to 2x. Resets on a change.'],
  ],
  [Items.WideLens, ['Wide Lens', '1.1x accuracy on everything its holder throws.']],
  [Items.ScopeLens, ['Scope Lens', '2x its holder’s odds of a critical.']],
  [Items.BrightPowder, ['Bright Powder', 'Anything aimed at its holder is 10% likelier to miss.']],
  [
    Items.QuickClaw,
    ['Quick Claw', '1/5 of the time, its holder’s next move winds up a bracket faster.'],
  ],
  [Items.FocusBand, ['Focus Band', '1/10 of the time, its holder is left standing on 1 HP.']],
  [Items.RockyHelmet, ['Rocky Helmet', 'Anything that touches its holder pays 1/6 of its own HP.']],
  [
    Items.SafetyGoggles,
    ['Safety Goggles', 'No sandstorm or hail damage, and powder moves do nothing.'],
  ],
  [
    Items.UtilityUmbrella,
    ['Utility Umbrella', 'Its holder stands under clear sky: sun and rain change nothing for it.'],
  ],
  [Items.SmokeBall, ['Smoke Ball', 'Its holder can always flee a wild encounter.']],
  [Items.DestinyKnot, ['Destiny Knot', 'Whoever infatuates its holder is infatuated back.']],
  [Items.GripClaw, ['Grip Claw', 'Binds its holder lands hold 1.75x as long.']],
  [Items.BindingBand, ['Binding Band', 'Binds its holder lands chip 1/3 harder.']],
  [Items.ZoomLens, ['Zoom Lens', '1.2x accuracy against a target already casting or channelling.']],
  [Items.IronBall, ['Iron Ball', 'Halves its holder’s Speed and drags it to the ground.']],
  [
    Items.LaggingTail,
    ['Lagging Tail', 'Its holder winds up a bracket slower than it otherwise would.'],
  ],
  [Items.RingTarget, ['Ring Target', 'Its holder loses every type immunity it has.']],
  [Items.FloatStone, ['Float Stone', 'Halves what its holder weighs.']],
  [Items.ProtectivePads, ['Protective Pads', 'Nothing its holder throws counts as contact.']],
  [
    Items.ClearAmulet,
    ['Clear Amulet', 'Refuses every stat drop anybody else tries, and is never spent.'],
  ],
]);

/**
 * The gear nobody sells; a vendor will only take one off a player's
 * hands.
 *
 * The line against the shelf is manufacture: a Wide Lens is ground and
 * a Muscle Band is woven, so a shop stocks as many as a player can pay
 * for, while rubbish, a leek, a moult and a rock have no supplier but
 * the ground. Keeping the Leftovers here is also what keeps the flat
 * shelf price honest — every party wants one, so a listing would make
 * it the first purchase and everything else the second
 */
export const FOUND_GEAR: Map<Items, [name: string, description: string]> = new Map([
  [
    Items.BlackSludge,
    ['Black Sludge', 'Feeds a Poison type 1/8 of its HP per move; costs anybody else 1/8.'],
  ],
  [
    Items.LuckyPunch,
    ['Lucky Punch', 'Sharpens a Chansey’s criticals by 2 stages. Nothing to anybody else.'],
  ],
  [
    Items.Stick,
    ['Stick', 'Sharpens a Farfetch’d’s criticals by 2 stages. Nothing to anybody else.'],
  ],
  [Items.ShedShell, ['Shed Shell', 'Its holder can always flee, whatever is holding it.']],
  [Items.Leftovers, ['Leftovers', 'Hands its holder 1/16 of its HP back every time it acts.']],
  [Items.DampRock, ['Damp Rock', 'Rain its holder calls lasts 1.6x as long.']],
  [Items.HeatRock, ['Heat Rock', 'Sun its holder calls lasts 1.6x as long.']],
  [Items.IcyRock, ['Icy Rock', 'Hail and snow its holder calls last 1.6x as long.']],
  [Items.SmoothRock, ['Smooth Rock', 'A sandstorm its holder calls lasts 1.6x as long.']],
  [Items.LightClay, ['Light Clay', 'Screens its holder puts up last 1.6x as long.']],
  [Items.BigRoot, ['Big Root', '1.3x on everything its holder drains.']],
  // A burr off a bush, which is why nobody sells one
  [
    Items.StickyBarb,
    ['Sticky Barb', 'Costs its holder 1/8 of its HP per move, and sticks to whoever touches it.'],
  ],
]);

export const GEAR_PRICE = 5000;

const GEAR_RESALE = 0.5;

/**
 * What a found piece of gear fetches. Nothing stocks them, so this is
 * only what somebody will pay to take one away
 */
const FOUND_GEAR_RESALE = 1000;

/**
 * TODO: the Clear Amulet has no picture of its own cut yet, so it
 * borrows the Oval Charm — a charm hanging from a cord, which is the
 * only amulet shape the sheets carry. Give it `held/clear-amulet`
 * once the art exists
 */
const GEAR_ICONS: Map<Items, string> = new Map([[Items.ClearAmulet, 'key/oval-charm']]);

function gearIcon(item: Items, name: string): string {
  return GEAR_ICONS.get(item) ?? nameToIcon('held', name);
}

export function isGear(item: Items): boolean {
  return MARKET_GEAR.has(item) || FOUND_GEAR.has(item);
}

export default function registerGear(): void {
  for (const [item, [name, description]] of MARKET_GEAR) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: gearIcon(item, name),
      // Held for as long as its holder keeps it: none is consumed,
      // and none is used on a pokemon
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: GEAR_PRICE,
      sell: GEAR_PRICE * GEAR_RESALE,
    });
  }

  for (const [item, [name, description]] of FOUND_GEAR) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: gearIcon(item, name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: FOUND_GEAR_RESALE,
    });
  }
}
