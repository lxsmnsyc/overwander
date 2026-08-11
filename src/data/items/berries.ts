import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { Statuses } from '../ids/status';
import { registerItem } from './__create';

/**
 * The berries, and what each one is for.
 *
 * A berry is held to trigger on its own in a battle — the field side
 * of that is in [`src/battle/items/berries.ts`](../../battle/items/berries.ts)
 * — but the same two tables answer what it does when a player hands
 * one to a hurt pokemon between fights. What a berry cures and what
 * it restores is a property of the berry, not of the battle, so it is
 * written once here and read from both sides.
 *
 * All of them are consumed by their use, whichever side spends them.
 */

/**
 * What each curing berry takes off. A berry that covers a status
 * cures it in a battle the moment it lands, and out of one the moment
 * it is handed over
 */
export const BERRY_STATUS_CURES = new Map<Items, Set<Statuses>>([
  [Items.CheriBerry, new Set([Statuses.Paralyzed])],
  [Items.ChestoBerry, new Set([Statuses.Sleeping])],
  [Items.PechaBerry, new Set([Statuses.Poisoned, Statuses.BadlyPoisoned])],
  [Items.RawstBerry, new Set([Statuses.Burned])],
  [Items.AspearBerry, new Set([Statuses.Frozen])],
  [Items.PersimBerry, new Set([Statuses.Confused])],
  [
    Items.LumBerry,
    new Set([
      Statuses.Paralyzed,
      Statuses.Sleeping,
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Burned,
      Statuses.Frozen,
      Statuses.Confused,
    ]),
  ],
]);

export interface BerryHeal {
  /**
   * Fraction of maximum health at (or below) which the berry
   * triggers on its own in a battle. It is a battle rule only: a
   * player handing one over out of a fight decides for themselves
   * whether it is worth it
   */
  threshold: number;
  heal: (maxHealth: number) => number;
}

/**
 * What each restoring berry gives back
 */
export const BERRY_HEALS = new Map<Items, BerryHeal>([
  [Items.OranBerry, { threshold: 0.5, heal: () => 10 }],
  [Items.SitrusBerry, { threshold: 0.5, heal: (max) => max / 4 }],
]);

/**
 * Whether the item is a berry at all
 */
export function isBerry(item: Items): boolean {
  return BERRY_STATUS_CURES.has(item) || BERRY_HEALS.has(item) || item === Items.LeppaBerry;
}

export default function registerBattleBerries(): void {
  // Cures paralysis
  registerItem(Items.CheriBerry, {
    name: 'Cheri Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures sleep
  registerItem(Items.ChestoBerry, {
    name: 'Chesto Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures poison
  registerItem(Items.PechaBerry, {
    name: 'Pecha Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures a burn
  registerItem(Items.RawstBerry, {
    name: 'Rawst Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Thaws the holder
  registerItem(Items.AspearBerry, {
    name: 'Aspear Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores PP of a depleted move
  registerItem(Items.LeppaBerry, {
    name: 'Leppa Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores a small amount of health when low
  registerItem(Items.OranBerry, {
    name: 'Oran Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures confusion
  registerItem(Items.PersimBerry, {
    name: 'Persim Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Cures any status condition
  registerItem(Items.LumBerry, {
    name: 'Lum Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
  // Restores a quarter of max health when low
  registerItem(Items.SitrusBerry, {
    name: 'Sitrus Berry',
    type: ItemTypes.Berry,
    flags: ItemFlags.Holdable | ItemFlags.Consumable,
    buy: 0,
    sell: 20,
  });
}
