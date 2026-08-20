/**
 * A search box that can be asked precise questions.
 *
 * The syntax is one pair per word — `is:shiny`, `type:fire` — with
 * quotes around anything holding a space: `move:"Solar Beam"`. A word
 * with no colon in it is a plain search, so somebody who types a name
 * and nothing else is answered the way they always were.
 *
 * This only takes the string apart. What a field *means* belongs to
 * whatever is being searched, since the list knows its own rows.
 */

export interface QueryTerm {
  /**
   * What was named before the colon, lower-cased. Empty for a plain
   * word, which is every search that came before this one
   */
  field: string;
  /** What was asked for, as typed: matching decides about case */
  value: string;
}

/**
 * Split on spaces, but not inside quotes. The quotes themselves are
 * dropped — they are punctuation for the parser, not part of the name
 */
function split(query: string): string[] {
  const words: string[] = [];
  let word = '';
  let quoted = false;

  for (const character of query) {
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && /\s/.test(character)) {
      if (word !== '') {
        words.push(word);
        word = '';
      }
      continue;
    }
    word += character;
  }
  if (word !== '') {
    words.push(word);
  }
  return words;
}

/**
 * What a search is asking, term by term. Every term has to be
 * answered — the terms narrow rather than widen — and an empty search
 * asks nothing, which is what makes clearing the box the way back to
 * the whole list
 */
export default function parseQuery(query: string): QueryTerm[] {
  return split(query).map((word) => {
    const colon = word.indexOf(':');
    // A colon at the start is not a field, and neither is one inside a
    // quoted phrase: a name is allowed to hold punctuation
    const field = colon > 0 ? word.slice(0, colon) : '';

    return /\s/.test(field)
      ? { field: '', value: word }
      : { field: field.toLowerCase(), value: word.slice(colon + 1) };
  });
}
