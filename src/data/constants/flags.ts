/**
 * What is true about one pokemon, as bits.
 *
 * These used to be four boolean fields on the catch record and two on
 * an encounter. They are a bitfield now for the same reason the
 * individual values are one integer: a record that answers half a
 * dozen yes-or-no questions answers them in one field, a snapshot
 * copies one field, and a new question costs a bit rather than a
 * migration.
 *
 * The bits are permanent. A flag may be retired, but its bit is never
 * reused for something else — a stored record has no version number,
 * and the day one bit means two things is the day old records start
 * lying.
 */
export const enum PokemonFlags {
  /**
   * The shiny verdict as seen by the original catcher, frozen at
   * catch time so trades cannot change it
   */
  Shiny = 0b0001,
  /**
   * Came out of a shadow raid, or inherited it in the egg. A shadow
   * keeps its Shadow ability and costs twice the candy to raise
   */
  Shadow = 0b0010,
  /**
   * Still an egg: everything about the pokemon inside is written
   * already, but an egg shows none of it, cannot be edited and
   * cannot fight
   */
  Egg = 0b0100,
  /**
   * Fielded in a battle right now. The record cannot be edited while
   * it holds — the fight runs on a frozen snapshot — and the stamp
   * beside it says which battle claimed it
   */
  Locked = 0b1000,
  /**
   * Kept. The player has said this one is not to be parted with, so
   * nothing that would hand it to somebody else — releasing it,
   * putting it on the block, a trade when there is one — will take it.
   * It changes nothing about what the pokemon can *do*
   */
  Favorite = 0b0001_0000,
  /**
   * Put away by the player: not to be disturbed.
   *
   * It is the other half of a favorite. A favorite cannot leave the
   * player's hands; a guarded pokemon cannot be rewritten — no level,
   * no training, no values moved, no evolution, no battle, no heal, no
   * purifying gem, and nothing given to it or taken back off it. What
   * only adds to it is left alone: it still walks, still comes to
   * think more of its owner, and can still be a parent. Both flags are
   * the player's own doing and both come off the same way they went on
   */
  Guarded = 0b0010_0000,
}

/**
 * Whether the field carries the flag
 */
export function hasFlag(flags: number, flag: PokemonFlags): boolean {
  return (flags & flag) !== 0;
}

/**
 * The field with one flag set or cleared. Everything else is left
 * exactly as it was, so a writer that cares about one bit cannot
 * quietly drop another
 */
export function withFlag(flags: number, flag: PokemonFlags, on: boolean): number {
  return on ? flags | flag : flags & ~flag;
}
