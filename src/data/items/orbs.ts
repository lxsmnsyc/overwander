import { Items } from '../ids/items';

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
export const ORBS: Set<Items> = new Set([Items.FlameOrb, Items.ToxicOrb, Items.LifeOrb]);
