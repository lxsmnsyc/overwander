import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The orbs: held for what they do to their own holder.
 *
 * Every one of them is a cost paid up front. A Life Orb hits harder
 * and takes a tenth of its holder with every blow; a Flame Orb and a
 * Toxic Orb simply burn or poison whoever carries them, which is
 * ruinous unless the holder wanted the status — a Guts pokemon, or
 * one that would rather choose its own affliction than be handed a
 * worse one.
 *
 * The battle side lives in
 * [`src/battle/items/orbs.ts`](../../battle/items/orbs.ts).
 */
export const ORBS = new Map<Items, string>([
  [Items.FlameOrb, 'Flame Orb'],
  [Items.ToxicOrb, 'Toxic Orb'],
  [Items.LifeOrb, 'Life Orb'],
]);

export const ORB_PRICE = 6000;

const ORB_RESALE = 0.5;

/**
 * Register the orbs. None of them is consumed: an orb keeps doing
 * what it does for as long as it is carried, which is the point of it
 */
export default function registerOrbs(): void {
  for (const [item, name] of ORBS) {
    registerItem(item, {
      name,
      type: ItemTypes.Held,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: ORB_PRICE,
      sell: ORB_PRICE * ORB_RESALE,
    });
  }
}
