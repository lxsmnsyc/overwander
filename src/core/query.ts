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

/** Whether a name holds what was asked for, either way round on case */
export function holds(name: string, value: string): boolean {
  return name.toLowerCase().includes(value.trim().toLowerCase());
}

/** Whether any of a list of names holds it */
export function holdsAny(names: string[], value: string): boolean {
  return names.some((name) => holds(name, value));
}

/**
 * A number or a range of them: `30`, `30-60`. An open end is allowed —
 * `30-` is thirty and up — since half a range is what somebody
 * usually means. A number that will not parse leaves NaN, and every
 * comparison against NaN is false, which refuses the term
 */
export function within(value: string, actual: number): boolean {
  const ends = value.split('-');

  if (ends.length < 2) {
    return Number(ends[0]) === actual;
  }

  const floor = ends[0].trim() === '' ? Number.NEGATIVE_INFINITY : Number(ends[0]);
  const ceiling = ends[1].trim() === '' ? Number.POSITIVE_INFINITY : Number(ends[1]);

  return actual >= floor && actual <= ceiling;
}

/**
 * The one thing a word means, when it means exactly one.
 *
 * A search matches part of a name, so "emb" is Ember today and two
 * moves the day a second one is registered. Anything that has to name
 * one thing — a query, a filter on an id — asks through this
 */
export function only<T>(found: T[]): T | null {
  return found.length === 1 ? found[0] : null;
}

/**
 * The one id in a table of names whose name holds the word. A const
 * enum cannot be listed at runtime, so the name table written beside
 * one stands in for a listing of it
 */
export function named(table: Record<number, string>, wanted: string): number | null {
  return only(
    Object.entries(table)
      .filter(([, name]) => holds(name, wanted))
      .map(([id]) => Number(id)),
  );
}
