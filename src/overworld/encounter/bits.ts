/**
 * How a spawn's 32-bit individual and trait values are cut up: every
 * derivation below reads its own slice, so two of them never move
 * together
 */
/**
 * The 25 natures of NATURE_EFFECTS' enum
 */
export const NATURE_COUNT = 25;

export const IV_BITS = 5;
export const IV_MASK = 0b11111;

/**
 * Each trait reads one 8-bit slice (0-255) of the trait value
 */
export const TRAIT_BITS = 8;
export const TRAIT_MASK = 0xff;
export const TRAIT_RANGE = 256;

/**
 * The held-item roll reads sixteen bits rather than eight: a slot
 * worth one percent cannot be told apart from nothing at 256 steps
 */
export const HELD_ITEM_MASK = 0xffff;
export const HELD_ITEM_RANGE = 0x10000;

/**
 * Share of the ability slice that lands a hidden ability (1/8)
 */
export const HIDDEN_ABILITY_BAND = TRAIT_RANGE / 8;
