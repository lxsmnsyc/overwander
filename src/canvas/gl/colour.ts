/**
 * A CSS colour as four numbers from 0 to 1.
 *
 * The board's colours are written the way a 2D context wants them, as
 * `#rrggbb` and `rgba(...)` strings, and they stay that way: a GL pass
 * over the same board reads the same table rather than a second one
 * kept in step by hand. Parsed once each and remembered, since the
 * board asks for the same handful every frame.
 */

export type Colour = [red: number, green: number, blue: number, alpha: number];

const known = new Map<string, Colour>();

/** How many colours are remembered before the oldest are let go. */
const LIMIT = 64;

function hex(css: string): Colour | null {
  const digits = css.slice(1);
  // Shorthand doubles each digit, which is the only reason a three is
  // not simply a truncated six
  const full =
    digits.length === 3 || digits.length === 4
      ? digits.replace(/./g, (digit) => digit + digit)
      : digits;

  if (full.length !== 6 && full.length !== 8) {
    return null;
  }
  const value = Number.parseInt(full, 16);

  if (!Number.isFinite(value)) {
    return null;
  }
  if (full.length === 6) {
    return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, 1];
  }
  return [
    ((value >>> 24) & 255) / 255,
    ((value >>> 16) & 255) / 255,
    ((value >>> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function functional(css: string): Colour | null {
  const inside = css.slice(css.indexOf('(') + 1, css.lastIndexOf(')'));
  const parts = inside
    .split(/[\s,/]+/)
    .filter((part) => part.length > 0)
    .map((part) => (part.endsWith('%') ? Number(part.slice(0, -1)) * 2.55 : Number(part)));

  if (parts.length < 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  // The channels are 0 to 255 and the alpha is 0 to 1, which is the
  // one place the notation is not consistent with itself
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts.length > 3 ? parts[3] : 1];
}

/**
 * Read a colour, or null where it is written in a notation this does
 * not know. Only the notations the board actually uses are handled:
 * anything else is a caller's mistake rather than a case to guess at
 */
export default function parseColour(css: string): Colour | null {
  const remembered = known.get(css);

  if (remembered != null) {
    return remembered;
  }
  const trimmed = css.trim();
  let found: Colour | null = null;

  if (trimmed.startsWith('#')) {
    found = hex(trimmed);
  } else if (trimmed.startsWith('rgb')) {
    found = functional(trimmed);
  }

  if (found == null) {
    return null;
  }
  if (known.size >= LIMIT) {
    known.clear();
  }
  known.set(css, found);
  return found;
}
