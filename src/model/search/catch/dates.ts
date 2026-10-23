import { alternatives } from '../../../core/query';

/** How much of a stored stamp is the catcher's own wall clock */
export const LOCAL_STAMP = 19;

/**
 * One end of a search over the stored stamp. It is a string rather
 * than a number because the stamp is one: the catcher's own wall
 * clock, written so that comparing two of them is comparing two
 * strings. Null is an end nobody named
 */
interface Span {
  low: string | null;
  high: string | null;
  lowOpen: boolean;
  highOpen: boolean;
}

/** A wall-clock stamp, in the shape the record stores one */
function localStamp(at: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return (
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
  );
}

/** A written date's dash-separated parts as numbers */
function dateParts(text: string): number[] {
  const parts: number[] = [];

  for (const part of text.split('-')) {
    parts.push(Number(part));
  }
  return parts;
}

/** The first instant of a day, as the stamp writes it */
function dayStart(year: number, month: number, day: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
}

/**
 * What a written date covers, as the half-open span between its first
 * instant and the first instant after it. A year, a month and a day
 * are all one of these, which is what lets `caught:2026-08` and
 * `caught:2026` be the same question at two sizes
 */
function period(text: string): { low: string; high: string } | null {
  const wanted = text.trim().toLowerCase();
  const today = new Date();

  if (wanted === 'today') {
    return {
      low: dayStart(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      high: dayStart(today.getFullYear(), today.getMonth() + 1, today.getDate() + 1),
    };
  }
  if (/^\d{4}$/.test(wanted)) {
    const year = Number(wanted);

    return { low: dayStart(year, 1, 1), high: dayStart(year + 1, 1, 1) };
  }
  if (/^\d{4}-\d{2}$/.test(wanted)) {
    const [year, month] = dateParts(wanted);

    return {
      low: dayStart(year, month, 1),
      high: month === 12 ? dayStart(year + 1, 1, 1) : dayStart(year, month + 1, 1),
    };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(wanted)) {
    const [year, month, day] = dateParts(wanted);
    // Rolled over by the calendar rather than by hand: the last day of
    // a month is the one place hand-rolling goes wrong
    const after = new Date(Date.UTC(year, month - 1, day + 1));

    return {
      low: dayStart(year, month, day),
      high: dayStart(after.getUTCFullYear(), after.getUTCMonth() + 1, after.getUTCDate()),
    };
  }
  return null;
}

/**
 * One alternative of a date term as a span, or null where it names no
 * date. `7d` is the last seven days, which is the one question about
 * a date that is easier asked than written out
 */
function stamp(text: string): Span | null {
  const wanted = text.trim().toLowerCase();
  const recent = /^(\d+)d$/.exec(wanted);

  if (recent != null) {
    const since = new Date();

    since.setDate(since.getDate() - Number(recent[1]));
    return { low: localStamp(since), high: null, lowOpen: false, highOpen: false };
  }

  const comparison = /^(>=|<=|>|<|=)(.*)$/.exec(wanted);

  if (comparison != null) {
    const covered = period(comparison[2]);

    if (covered == null) {
      return null;
    }
    switch (comparison[1]) {
      // After the whole of it, which for a month is the month after
      case '>':
        return { low: covered.high, high: null, lowOpen: false, highOpen: false };
      case '>=':
        return { low: covered.low, high: null, lowOpen: false, highOpen: false };
      case '<':
        return { low: null, high: covered.low, lowOpen: false, highOpen: true };
      case '<=':
        return { low: null, high: covered.high, lowOpen: false, highOpen: true };
      default:
        return { low: covered.low, high: covered.high, lowOpen: false, highOpen: true };
    }
  }

  if (wanted.includes('..')) {
    const [from, to] = wanted.split('..');
    const first = period(from);
    const last = period(to);

    if (first == null || last == null) {
      return null;
    }
    return { low: first.low, high: last.high, lowOpen: false, highOpen: true };
  }

  const covered = period(wanted);

  return covered == null
    ? null
    : { low: covered.low, high: covered.high, lowOpen: false, highOpen: true };
}

/** Every span a date term accepts */
export function stamps(value: string): Span[] {
  const spans: Span[] = [];

  for (const word of alternatives(value)) {
    const span = stamp(word);

    if (span != null) {
      spans.push(span);
    }
  }
  return spans;
}

/** Whether a stored stamp falls inside one span */
export function insideSpan(span: Span, at: string): boolean {
  if (span.low != null && (span.lowOpen ? at <= span.low : at < span.low)) {
    return false;
  }
  return span.high == null || (span.highOpen ? at < span.high : at <= span.high);
}
