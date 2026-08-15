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
   * How many abilities it may carry, counting only the ones the
   * pokemon chose to have. The special tier — see `SPECIAL_ABILITIES`
   * — rides free
   */
  Ability = 0,
  /**
   * How many items it may hold at once. One by default, and the only
   * ceiling there is: the battle counts nothing itself, so a unit
   * fights carrying exactly what its record allowed
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
 * The abilities nothing has to make room for.
 *
 * They are not things a pokemon has: they are marks of what it is. A
 * Boss carries one because it is a raid, a shadow because of where it
 * came from, and a purified one keeps the mark of having been one. A
 * pokemon that had to spend its only ability slot on the shadow it
 * did not ask for would be a pokemon punished twice
 */
export const SPECIAL_ABILITIES = new Set<Abilities>([
  Abilities.Boss,
  Abilities.Shadow,
  Abilities.Purified,
]);

/**
 * Whether the ability takes up room. Everything outside the special
 * tier does
 */
export function countsAgainstSlots(ability: Abilities): boolean {
  return !SPECIAL_ABILITIES.has(ability);
}

/**
 * How many of these actually occupy slots
 */
export function countAbilitySlots(abilities: Iterable<Abilities>): number {
  let count = 0;

  for (const ability of abilities) {
    if (countsAgainstSlots(ability)) {
      count += 1;
    }
  }

  return count;
}

/**
 * What a fresh catch has room for, by kind
 */
export const DEFAULT_ABILITY_SLOTS = 1;
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
 * What a pokemon starts with. A shadow needs no extra room for the
 * shadow itself — the special tier is exempt — so the only thing that
 * widens this is a pokemon that somehow carries two ordinary abilities
 */
export function defaultSlots(abilities: Abilities[] = []): number {
  const room = Math.max(DEFAULT_ABILITY_SLOTS, countAbilitySlots(abilities));

  return packSlots(room, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS);
}
