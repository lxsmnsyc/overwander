/**
 * What a name may be made of, and how long it may run.
 *
 * Two things carry a name a player writes: a pokemon, and the player
 * themselves. Both are drawn beside other things — a nickname over a
 * sprite, a trainer's name in a lobby row next to a badge and a party
 * — so both want a ceiling, and both want the same alphabet.
 *
 * A name is shown to **other people**, in lists they cannot inspect,
 * so what it may hold is a question about them rather than about the
 * player writing it. Nothing outside the set is refused with an error:
 * it is simply not written, so a player pasting one sees what they
 * will get.
 */

/**
 * The characters a name may hold: any letter, any decimal digit, a
 * space, and the little punctuation a real name needs.
 *
 * **Letters of every script**, so a player writes their own name
 * rather than a transliteration of it: 田中, Ольга and José are names
 * the way Ash is.
 *
 * What is left out is what is not a letter. Combining marks are out,
 * which is what a stack of them piled on one character is; so are the
 * bidirectional overrides that reorder the text around them, the
 * zero-width characters that hide inside it, and everything else the
 * `C` and `M` categories hold. The allowlist does that on its own:
 * none of them is a letter or a digit, so none of them survives.
 *
 * A lookalike letter still gets through, and that is the known cost of
 * admitting every script: Cyrillic А and Latin A are different letters
 * that draw the same, and nothing short of a one-script-per-name rule
 * separates them.
 *
 * The apostrophe, the full stop and the hyphen are here because the
 * species themselves need them — Farfetch'd, Mr. Mime, Porygon-Z — and
 * a nickname that cannot spell a species name is too narrow. The
 * gender signs are the mainline's own, which writes Nidoran with one.
 *
 * Mirrored in SQL as `[[:alpha:][:digit:] ''.♀♂-]`, which answers the
 * same under this database's ctype. A test holds the two together
 */
const ALLOWED = /[\p{L}\p{Nd} '.♀♂-]/u;

/**
 * The longest a pokemon's nickname may be. Longer than the mainline's
 * twelve, because the alphabet is every script: a name that is four
 * characters in Japanese is twenty transliterated, and a ceiling that
 * suits one of those starves the other
 */
export const NICKNAME_LIMIT = 24;

/**
 * The longest a player's name may be. The same as a pokemon's today,
 * and a number of its own rather than an alias of it: what a lobby row
 * can hold beside a badge and a party is a different question from
 * what fits as a heading over a sprite, and the day one of them moves
 * the other should not have to
 */
export const PLAYER_NAME_LIMIT = 24;

/** What a player is called before they have called themselves anything */
export const DEFAULT_PLAYER_NAME = 'Trainer';

/**
 * A name as it will be stored: anything outside the alphabet dropped,
 * runs of spaces collapsed, ends trimmed, cut to `limit`. Applied on
 * both sides of the wire, so the field shows what the record will
 * hold. A name that comes to nothing answers the empty string
 */
export function asNickname(name: string, limit = NICKNAME_LIMIT): string {
  // Collapsed on both sides of the strip: once so a tab between words
  // becomes the space it stood for rather than vanishing and joining
  // them, and again so a dropped character does not leave a gap where
  // it was
  const written = [...name.replace(/\s+/gu, ' ')]
    .filter((character) => ALLOWED.test(character))
    .join('')
    .replace(/ +/gu, ' ')
    .trim();

  // Trimmed again after the cut: a name shortened mid-word can end on
  // the space before it
  return [...written].slice(0, limit).join('').trim();
}

/**
 * A player's name as it will be stored. Alone among names it cannot
 * come to nothing: a blank one is nobody, and every list that draws
 * players would draw a gap, so it falls back to the name a fresh
 * account is given
 */
export function asPlayerName(name: string): string {
  const written = asNickname(name, PLAYER_NAME_LIMIT);

  return written === '' ? DEFAULT_PLAYER_NAME : written;
}
