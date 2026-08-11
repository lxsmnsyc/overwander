/**
 * A pokemon's two rolls, drawn.
 *
 * Every individual in the game is two 32-bit numbers: the
 * `individualValue` its six values are sliced out of, and the
 * `traitValue` behind its level, gender, ability and nature. Together
 * they are what makes one Rattata a different Rattata from the next,
 * and printing them is printing two ten-digit numbers nobody can read.
 *
 * Eight-dot braille draws them instead. Each cell is a byte — the
 * Unicode block is laid out so that dot *n* is bit *n − 1* of the
 * offset from `BRAILLE_BASE` — so sixty-four bits fit in eight
 * characters exactly, with nothing thrown away and nothing invented.
 * Two pokemon with the same sigil are the same roll.
 *
 * It is **cosmetic**. Nothing reads a sigil back, nothing is decided
 * by one, and the bytes are shown in the order the numbers are written
 * rather than in any order the game cares about
 */

/**
 * Where the braille block starts. `U+2800` is the empty cell, and
 * every pattern above it is that cell with the dots of its offset
 * filled in
 */
export const BRAILLE_BASE = 0x2800;

/**
 * How many cells a sigil is: four for each of the two rolls
 */
export const SIGIL_CELLS = 8;

/**
 * How many cells one 32-bit roll takes
 */
const CELLS_PER_VALUE = SIGIL_CELLS / 2;

const BITS_PER_CELL = 8;

const BYTE_MASK = 0xff;

/**
 * One 32-bit value as four braille cells, most significant byte
 * first, so the drawing runs the way the number is written
 */
function draw(value: number): string {
  let cells = '';

  for (let at = CELLS_PER_VALUE - 1; at >= 0; at--) {
    // The shift coerces whatever it is given to a 32-bit unsigned
    // integer, so a missing roll draws as empty cells rather than
    // throwing
    cells += String.fromCodePoint(BRAILLE_BASE + ((value >>> (at * BITS_PER_CELL)) & BYTE_MASK));
  }
  return cells;
}

/**
 * The sigil of one individual: `SIGIL_CELLS` braille cells carrying
 * all sixty-four bits of what it was rolled from, the individual
 * value first and the trait value after it
 */
export default function getSigil(individualValue: number, traitValue: number): string {
  return draw(individualValue) + draw(traitValue);
}
