/**
 * A search box that can be asked precise questions.
 *
 * The syntax is one pair per word — `is:shiny`, `type:fire` — with
 * quotes around anything holding a space: `move:"Solar Beam"`. A word
 * with no colon in it is a plain search, so somebody who types a name
 * and nothing else is answered the way they always were.
 *
 * Three things widen a term. A leading `!` refuses it (`!type:fire`),
 * a `|` inside a value accepts any of them (`type:fire|water`), and a
 * numeric value takes a comparison (`level:>50`) or a range
 * (`level:30-60`, `caught:2026-01..2026-06`) as well as an exact
 * number.
 *
 * `sort:` and `order:` are the exception to all of it: they say how
 * the answers are arranged rather than which ones they are, so a
 * matcher skips them and the list reads them for itself.
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
  /**
   * Whether the term was written with a `-` in front of it, which
   * asks for everything it does not describe
   */
  negated: boolean;
}

/**
 * The fields that arrange the answers rather than narrowing them. A
 * matcher skips them: a row cannot fail `sort:level`, and one that
 * tried would empty the box the moment somebody typed it
 */
const CONTROLS = new Set(['sort', 'order']);

export function isControlField(field: string): boolean {
  return CONTROLS.has(field);
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
    // A bare `!` is somebody mid-word, not a refusal of everything.
    // The mark is `!` rather than `-` because a value carries dashes of
    // its own: a range and a written date are both full of them
    const negated = word.startsWith('!') && word.length > 1;
    const rest = negated ? word.slice(1) : word;
    const colon = rest.indexOf(':');
    // A colon at the start is not a field, and neither is one inside a
    // quoted phrase: a name is allowed to hold punctuation
    const field = colon > 0 ? rest.slice(0, colon) : '';

    return /\s/.test(field)
      ? { field: '', value: rest, negated }
      : { field: field.toLowerCase(), value: rest.slice(colon + 1), negated };
  });
}

/**
 * The terms a matcher answers: everything but the two that only say
 * how the list is arranged
 */
export function askedTerms(query: string): QueryTerm[] {
  return parseQuery(query).filter((term) => !isControlField(term.field));
}

/**
 * What one value offers, split on `|`. A value with no bar in it is
 * one alternative, which is why every field gets this for free
 */
export function alternatives(value: string): string[] {
  return value
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

/**
 * Whether a name holds what was asked for, either way round on case.
 * Any one alternative is enough
 */
export function holds(name: string, value: string): boolean {
  const wanted = alternatives(value);

  if (wanted.length === 0) {
    return true;
  }
  return wanted.some((part) => name.toLowerCase().includes(part.toLowerCase()));
}

/** Whether any of a list of names holds it */
export function holdsAny(names: string[], value: string): boolean {
  return names.some((name) => holds(name, value));
}

/**
 * One band of numbers a term accepts. The ends are open where they
 * were asked for with `>` or `<`, which is the difference between
 * "over 50" and "50 and up"
 */
export interface Bounds {
  low: number;
  high: number;
  lowOpen: boolean;
  highOpen: boolean;
}

/** A band with both ends shut, which is what a plain range asks for */
function closed(low: number, high: number): Bounds {
  return { low, high, lowOpen: false, highOpen: false };
}

/** The number a comparison names, or NaN where it names nothing */
function ends(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

/**
 * One alternative as a band of numbers, or null where it will not
 * parse. `..` is read before `-` so a value that carries dashes of
 * its own (a date) can still be given two ends
 */
function bounds(value: string): Bounds | null {
  const wanted = value.trim();
  const comparison = /^(>=|<=|>|<|=)(.*)$/.exec(wanted);

  if (comparison != null) {
    const at = ends(comparison[2]);

    if (Number.isNaN(at)) {
      return null;
    }
    switch (comparison[1]) {
      case '>':
        return { low: at, high: Number.POSITIVE_INFINITY, lowOpen: true, highOpen: false };
      case '>=':
        return closed(at, Number.POSITIVE_INFINITY);
      case '<':
        return { low: Number.NEGATIVE_INFINITY, high: at, lowOpen: false, highOpen: true };
      case '<=':
        return closed(Number.NEGATIVE_INFINITY, at);
      default:
        return closed(at, at);
    }
  }

  const parts = wanted.includes('..') ? wanted.split('..') : wanted.split('-');

  if (parts.length < 2) {
    const at = ends(parts[0]);

    return Number.isNaN(at) ? null : closed(at, at);
  }

  const low = parts[0].trim() === '' ? Number.NEGATIVE_INFINITY : ends(parts[0]);
  const high = parts[1].trim() === '' ? Number.POSITIVE_INFINITY : ends(parts[1]);

  return Number.isNaN(low) || Number.isNaN(high) ? null : closed(low, high);
}

/**
 * Every band a numeric term accepts. Empty where none of it parses,
 * which is what refuses the term rather than widening it
 */
export function ranges(value: string): Bounds[] {
  return alternatives(value)
    .map(bounds)
    .filter((band): band is Bounds => band != null);
}

/** Whether a number falls inside one band */
export function inside(band: Bounds, actual: number): boolean {
  return (
    (band.lowOpen ? actual > band.low : actual >= band.low) &&
    (band.highOpen ? actual < band.high : actual <= band.high)
  );
}

/**
 * A number, a comparison or a range of them: `30`, `>30`, `30-60`. An
 * open end is allowed — `30-` is thirty and up — since half a range is
 * what somebody usually means. A value that will not parse matches
 * nothing, which refuses the term
 */
export function within(value: string, actual: number): boolean {
  return ranges(value).some((band) => inside(band, actual));
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

/** Every id in a table of names whose name holds one of the words */
export function namedAll(table: Record<number, string>, wanted: string): number[] {
  return Object.entries(table)
    .filter(([, name]) => holds(name, wanted))
    .map(([id]) => Number(id));
}

/**
 * The one id in a table of names whose name holds the word. A const
 * enum cannot be listed at runtime, so the name table written beside
 * one stands in for a listing of it
 */
export function named(table: Record<number, string>, wanted: string): number | null {
  return only(namedAll(table, wanted));
}

/**
 * How the answers are arranged, read off the control terms. What a
 * `sort:` word means is left to the list it was typed at, which is the
 * only thing that knows what it holds
 */
export interface QueryControls {
  /** What to arrange by, lower-cased, or empty for the list's own order */
  sort: string;
  descending: boolean;
}

export function parseControls(query: string): QueryControls {
  const controls: QueryControls = { sort: '', descending: false };

  for (const term of parseQuery(query)) {
    const value = term.value.trim().toLowerCase();

    if (term.field === 'sort') {
      controls.sort = value;
    } else if (term.field === 'order') {
      controls.descending = value.startsWith('desc');
    }
  }
  return controls;
}
