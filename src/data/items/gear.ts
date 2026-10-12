import { Items } from '../ids/items';

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
 * only which items they are.
 */

/** What the market lists */
export const MARKET_GEAR = new Set<Items>([
  Items.ShellBell,
  Items.MuscleBand,
  Items.WiseGlasses,
  Items.ExpertBelt,
  Items.Metronome,
  Items.WideLens,
  Items.ScopeLens,
  Items.BrightPowder,
  Items.QuickClaw,
  Items.FocusBand,
  Items.RockyHelmet,
  Items.SafetyGoggles,
  Items.UtilityUmbrella,
  Items.SmokeBall,
  Items.DestinyKnot,
  Items.GripClaw,
  Items.BindingBand,
  Items.ZoomLens,
  Items.IronBall,
  Items.LaggingTail,
  Items.RingTarget,
  Items.FloatStone,
  Items.ProtectivePads,
  Items.ClearAmulet,
]);

/**
 * The gear nobody sells; a vendor will only take one off a player's
 * hands.
 *
 * The line against the shelf is manufacture: a Wide Lens is ground and
 * a Muscle Band is woven, so a shop stocks as many as a player can pay
 * for, while rubbish, a leek, a moult and a rock have no supplier but
 * the ground
 */
export const FOUND_GEAR = new Set<Items>([
  Items.BlackSludge,
  Items.LuckyPunch,
  Items.Stick,
  Items.ShedShell,
  Items.Leftovers,
  Items.DampRock,
  Items.HeatRock,
  Items.IcyRock,
  Items.SmoothRock,
  Items.LightClay,
  Items.TerrainExtender,
  Items.BigRoot,
  Items.SoulDew,
  Items.LoadedDice,
  Items.HeavyDutyBoots,
  // A burr off a bush, which is why nobody sells one
  Items.StickyBarb,
]);

/**
 * The found gear the geologist also sells, since each is a rock or a
 * clay he can dig up: the sky stones and the Light Clay. Still found
 * where they always were, and priced like the rest of the gear
 */
export const QUARRIED_GEAR = new Set<Items>([
  Items.DampRock,
  Items.HeatRock,
  Items.IcyRock,
  Items.SmoothRock,
  Items.LightClay,
]);

export function isGear(item: Items): boolean {
  return MARKET_GEAR.has(item) || FOUND_GEAR.has(item);
}
