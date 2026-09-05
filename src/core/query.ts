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

/** One term, and where in the box it was typed */
export interface QueryToken extends QueryTerm {
  /** Where the word starts, and one past where it ends */
  start: number;
  end: number;
}

/**
 * Split on spaces, but not inside quotes, keeping where each word sat.
 * The quotes are punctuation for the parser rather than part of a
 * name, so they are dropped from the word and counted in the span
 */
function split(query: string): { word: string; start: number; end: number }[] {
  const words: { word: string; start: number; end: number }[] = [];
  let word = '';
  let start = 0;
  let quoted = false;

  for (let at = 0; at < query.length; at++) {
    const character = query[at];

    if (character === '"') {
      if (word === '') {
        start = at;
      }
      quoted = !quoted;
      continue;
    }
    if (!quoted && /\s/.test(character)) {
      if (word !== '') {
        words.push({ word, start, end: at });
        word = '';
      }
      continue;
    }
    if (word === '') {
      start = at;
    }
    word += character;
  }
  if (word !== '') {
    words.push({ word, start, end: query.length });
  }
  return words;
}

/** One word taken apart, without regard to where it was */
function readWord(word: string): QueryTerm {
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
}

/**
 * What a search is asking and where each part of it was typed, which
 * is what lets a box draw its own terms as it is being typed into
 */
export function scanQuery(query: string): QueryToken[] {
  return split(query).map(({ word, start, end }) => ({ ...readWord(word), start, end }));
}

/**
 * What a search is asking, term by term. Every term has to be
 * answered — the terms narrow rather than widen — and an empty search
 * asks nothing, which is what makes clearing the box the way back to
 * the whole list
 */
export default function parseQuery(query: string): QueryTerm[] {
  return split(query).map(({ word }) => readWord(word));
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

/**
 * `descending` is which way round a list arranges when nobody said.
 * A box of pokemon or of items is asked "which is the best one" far
 * more often than "which is the worst", so those two start at the top
 * end; a list read as a roll starts at the other. An `order:` term
 * overrides it either way
 */
export function parseControls(query: string, descending = false): QueryControls {
  const controls: QueryControls = { sort: '', descending };

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

/**
 * What a particular box knows how to be asked.
 *
 * The grammar above is the same everywhere; this is the half that is
 * not. A box declares its own fields so that the field names can be
 * offered while somebody types and explained where they are stuck,
 * rather than living only in whichever list happens to answer them.
 */
export interface QueryField {
  /** The word before the colon */
  name: string;
  /** One short line on what it narrows by, for the guide */
  hint: string;
  /**
   * The values it is usually given, where there is a closed list of
   * them. Read when somebody asks rather than up front, since some of
   * these are whole registries. A field with none is free text: a
   * name, a place, a number
   */
  values?: () => string[];
}

export interface QueryVocabulary {
  fields: QueryField[];
}

/** One thing the box is offering to finish the current word with */
export interface QuerySuggestion {
  /** What the word becomes when this is taken */
  word: string;
  /** What is offered, on its own, for the list */
  label: string;
  hint?: string;
  /**
   * Whether the word still wants something after this. A field name is
   * half a term and a value is the whole of one, which is what says
   * whether the box closes when it is taken
   */
  partial: boolean;
}

export interface QueryCompletion {
  /** The word being finished, as a span of the box */
  start: number;
  end: number;
  suggestions: QuerySuggestion[];
}

/** How many suggestions a box offers at once */
export const SUGGESTIONS = 8;

/**
 * Which of a list of words are worth offering for what has been typed.
 * What it starts with comes before what merely holds it, since a
 * prefix is nearly always what somebody meant
 */
export function matching(words: string[], typed: string): string[] {
  const wanted = typed.trim().toLowerCase();

  if (wanted === '') {
    return words;
  }
  const starting = words.filter((word) => word.toLowerCase().startsWith(wanted));
  const holding = words.filter(
    (word) => !word.toLowerCase().startsWith(wanted) && word.toLowerCase().includes(wanted),
  );

  return [...starting, ...holding];
}

/** The word the caret is in, as a span of the box */
export function wordAround(query: string, caret: number): { start: number; end: number } {
  let start = caret;
  let end = caret;

  while (start > 0 && !/\s/.test(query[start - 1])) {
    start--;
  }
  while (end < query.length && !/\s/.test(query[end])) {
    end++;
  }
  return { start, end };
}

/** A value written back into a term, quoted where it carries a space */
export function asValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

/**
 * What the box can offer to finish the word the caret is in.
 *
 * Before the colon it offers the fields, after it the values that
 * field is known to take. Nothing at all for an empty word, since a
 * list that opened on every space would be in the way rather than out
 * of it
 */
export function completeQuery(
  query: string,
  caret: number,
  vocabulary: QueryVocabulary,
): QueryCompletion | null {
  const { start, end } = wordAround(query, caret);
  const word = query.slice(start, end);

  if (word === '') {
    return null;
  }
  const negated = word.startsWith('!');
  const bang = negated ? '!' : '';
  const rest = negated ? word.slice(1) : word;
  const colon = rest.indexOf(':');

  if (colon <= 0) {
    const suggestions = matching(
      vocabulary.fields.map((field) => field.name),
      rest,
    )
      .slice(0, SUGGESTIONS)
      .map((name) => ({
        word: `${bang}${name}:`,
        label: `${name}:`,
        hint: vocabulary.fields.find((field) => field.name === name)?.hint,
        partial: true,
      }));

    return { start, end, suggestions };
  }

  const asked = rest.slice(0, colon).toLowerCase();
  const field = vocabulary.fields.find((one) => one.name === asked);
  const known = field?.values?.();

  if (known == null) {
    return null;
  }
  // Only the alternative the caret is in is finished. What was written
  // before the last bar is somebody's earlier answer, and is put back
  // untouched
  const value = rest.slice(colon + 1);
  const bar = value.lastIndexOf('|');
  const held = bar < 0 ? '' : value.slice(0, bar + 1);
  const suggestions = matching(known, value.slice(bar + 1))
    .slice(0, SUGGESTIONS)
    .map((one) => ({
      word: `${bang}${asked}:${asValue(`${held}${one}`)}`,
      label: one,
      partial: false,
    }));

  return { start, end, suggestions };
}

/**
 * How far every offer agrees, which is how far one Tab can get.
 *
 * Case is ignored while comparing and kept from the first offer, since
 * the words being finished are registry names and a box is typed in
 * lower case
 */
export function sharedPrefix(words: string[]): string {
  if (words.length === 0) {
    return '';
  }
  const [first, ...rest] = words;
  let length = first.length;

  for (const word of rest) {
    let at = 0;

    while (at < length && at < word.length && first[at].toLowerCase() === word[at].toLowerCase()) {
      at++;
    }
    length = at;
  }
  return first.slice(0, length);
}

/**
 * The terms of a query and whatever else it holds, which is how a
 * query becomes a row of badges and a box with the rest still in it.
 *
 * A term is taken out whole, quotes and all, so that putting the two
 * back together with a space between them gives the query it came from
 */
export function splitTerms(query: string): { terms: string[]; rest: string } {
  const terms: string[] = [];
  let rest = '';
  let at = 0;

  for (const token of scanQuery(query)) {
    if (token.field === '') {
      continue;
    }
    terms.push(query.slice(token.start, token.end));
    rest += query.slice(at, token.start);
    at = token.end;
  }
  rest += query.slice(at);
  return { terms, rest: rest.replace(/\s+/g, ' ').trim() };
}

/**
 * The same split, but only for terms somebody has finished: a term is
 * finished once there is a space after it, and until then it is still
 * being typed and stays in the box
 */
export function typedTerms(text: string): { terms: string[]; rest: string } {
  const ended = text.search(/\s\S*$/);
  const settled = ended < 0 ? '' : text.slice(0, ended + 1);
  // A space inside a half-written quote is punctuation rather than the
  // end of a term, and taking one out there would break the phrase
  if (settled.split('"').length % 2 === 0) {
    return { terms: [], rest: text };
  }
  const tail = text.slice(settled.length);
  const { terms, rest } = splitTerms(settled);

  // The space that finished the last term is what separates it from
  // whatever is being typed next
  return { terms, rest: rest === '' ? tail : `${rest} ${tail}` };
}
