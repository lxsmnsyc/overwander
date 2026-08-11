/**
 * How many of each thing one pokemon has room for.
 *
 * A catch's abilities, held items and moves are all lists with a
 * ceiling, and every one of those ceilings was a constant the whole
 * game shared: one ability, one held item, four moves. That is the
 * right default and the wrong rule — a shadow carries two abilities,
 * and anything the game grows later (a second held item, a fifth move
 * bought with something) is a property of the **individual** rather
 * than of the game.
 *
 * So the three live on the record, packed into one integer three bits
 * at a time. Three bits is eight, which is more room than anything is
 * ever likely to want, and the whole field still costs nine bits of
 * one number rather than three fields of their own.
 *
 * The counts are stored **0-based**: a stored zero is one slot, which
 * is what makes a record written before the field existed read as the
 * old defaults for everything but the move list
 */

import Abilities from '../ids/abilities';

export const enum Slots {
  /**
   * How many abilities it may carry. One for almost everything; a
   * shadow carries its own on top of the rolled one, and keeps the
   * room after it is purified
   */
  Ability = 0,
  /**
   * How many items it may hold at once. One, matching the battle's
   * per-unit limit
   */
  Item = 1,
  /**
   * How many moves it may know. Four, as the mainline has it
   */
  Move = 2,
}

/**
 * How wide one count is. Three bits: eight slots, which is further
 * than any of the three is likely to grow
 */
export const SLOT_BITS = 3;

const SLOT_MASK = 0b111;

/**
 * The most any one of them can be. It is the width's own ceiling
 * rather than a rule about pokemon — what a slot count is *allowed*
 * to be is the caller's business
 */
export const MAX_SLOTS = 1 << SLOT_BITS;

/**
 * What a fresh catch has room for, by kind
 */
export const DEFAULT_ABILITY_SLOTS = 1;
export const SHADOW_ABILITY_SLOTS = 2;
export const DEFAULT_ITEM_SLOTS = 1;
export const DEFAULT_MOVE_SLOTS = 4;

/**
 * How many of that kind the pokemon has room for. Counts are stored
 * one less than they are read, so an unwritten field answers one
 */
export function getSlots(packed: number, kind: Slots): number {
  return ((packed >>> (kind * SLOT_BITS)) & SLOT_MASK) + 1;
}

/**
 * The same field with one count changed. Anything outside what three
 * bits can hold is brought inside it rather than wrapping around into
 * the neighbouring count
 */
export function withSlots(packed: number, kind: Slots, count: number): number {
  const held = Math.max(1, Math.min(MAX_SLOTS, Math.floor(count))) - 1;
  const at = kind * SLOT_BITS;

  return (packed & ~(SLOT_MASK << at)) | (held << at);
}

/**
 * All three at once, which is how a record is written
 */
export function packSlots(abilities: number, items: number, moves: number): number {
  return withSlots(
    withSlots(withSlots(0, Slots.Ability, abilities), Slots.Item, items),
    Slots.Move,
    moves,
  );
}

/**
 * What a pokemon starts with. A **shadow** is the one thing that
 * changes it: it carries the Shadow ability alongside the rolled one,
 * and a purified pokemon keeps that room — the mark of what it was is
 * the ability that replaced the shadow, not a slot taken back
 */
export function defaultSlots(abilities: Abilities[] = []): number {
  const carried = new Set(abilities);
  const room =
    carried.has(Abilities.Shadow) || carried.has(Abilities.Purified)
      ? SHADOW_ABILITY_SLOTS
      : DEFAULT_ABILITY_SLOTS;

  return packSlots(Math.max(room, abilities.length), DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS);
}
