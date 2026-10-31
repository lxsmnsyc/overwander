import { type Locale, currentLocale, getIntlTag } from './locale';

/**
 * Numbers and dates in the active locale. Every number and date a
 * player reads goes through here rather than `toLocaleString`, whose
 * answer depends on the machine it runs on: the server and the browser
 * would disagree, and neither would follow the language setting.
 *
 * `Intl` formatters are slow to build and cheap to reuse, so each is
 * built once per locale
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

const MOMENT: Intl.DateTimeFormatOptions = { ...DATE, hour: '2-digit', minute: '2-digit' };

const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();
const moments = new Map<string, Intl.DateTimeFormat>();
const relatives = new Map<string, Intl.RelativeTimeFormat>();
const conjunctions = new Map<string, Intl.ListFormat>();
const disjunctions = new Map<string, Intl.ListFormat>();

function reuseFormatter<F>(cache: Map<string, F>, build: (tag: string) => F): F {
  // One formatter per locale tag, built the first time it is asked for
  const tag = getIntlTag();
  let formatter = cache.get(tag);

  if (formatter == null) {
    formatter = build(tag);
    cache.set(tag, formatter);
  }
  return formatter;
}

/** A count or an amount, grouped: "12,500" */
export function formatNumber(value: number): string {
  return reuseFormatter(numbers, (tag) => new Intl.NumberFormat(tag)).format(value);
}

/** A calendar date: "12 Aug 2026" */
export function formatDate(at: number | Date): string {
  return reuseFormatter(dates, (tag) => new Intl.DateTimeFormat(tag, DATE)).format(at);
}

/** A date with the time of day: "12 Aug 2026, 14:05" */
export function formatMoment(at: number | Date): string {
  return reuseFormatter(moments, (tag) => new Intl.DateTimeFormat(tag, MOMENT)).format(at);
}

/**
 * How long ago or how far ahead, in the largest whole unit up to days:
 * "3 days ago", "in 5 minutes". Rounded to the nearest unit, so 59 and
 * a half minutes is "60 minutes ago"
 */
export function formatRelative(at: number | Date, now = Date.now()): string {
  // Past distances are negative, so a gap of none still reads as past
  const gap = (typeof at === 'number' ? at : at.getTime()) - now;
  const size = Math.abs(gap);
  const sign = gap > 0 ? 1 : -1;
  const relative = reuseFormatter(
    relatives,
    (tag) => new Intl.RelativeTimeFormat(tag, { numeric: 'always' }),
  );

  // The largest unit the distance fills, rounded to the nearest whole one
  if (size < MINUTE) {
    return relative.format(sign * Math.round(size / 1000), 'second');
  }
  if (size < HOUR) {
    return relative.format(sign * Math.round(size / MINUTE), 'minute');
  }
  if (size < DAY) {
    return relative.format(sign * Math.round(size / HOUR), 'hour');
  }
  return relative.format(sign * Math.round(size / DAY), 'day');
}

/** A list joined the way the locale joins one: "a, b and c", or "a, b or c" */
export function formatList(items: readonly string[], joiner: 'and' | 'or'): string {
  const list =
    joiner === 'and'
      ? reuseFormatter(conjunctions, (tag) => new Intl.ListFormat(tag, { type: 'conjunction' }))
      : reuseFormatter(disjunctions, (tag) => new Intl.ListFormat(tag, { type: 'disjunction' }));

  return list.format(items);
}

/** What goes between two sentences: Japanese runs them on, the others leave a space */
const SENTENCE_GAPS: Record<Locale, string> = {
  en: ' ',
  ja: '',
  es: ' ',
};

/** Sentences written one after another, as the locale writes them */
export function joinSentences(sentences: readonly string[]): string {
  return sentences.join(SENTENCE_GAPS[currentLocale()]);
}
