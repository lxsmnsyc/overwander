import { formatDate, formatMoment, formatRelative } from '../i18n/format';

/**
 * Dates as somebody would say them.
 *
 * Everything stored is an instant or a local ISO stamp, which is the
 * right thing to keep and the wrong thing to show: "2026-08-12" is a
 * date a machine reads. What a player wants to know about a catch is
 * roughly when (this week, last spring), and what they want to know
 * about a battle they fought an hour ago is that it was an hour ago.
 *
 * Both are here so the whole game says them the same way, in the
 * active locale.
 */

/**
 * How long a thing counts as recent. Past this, the calendar date is
 * more use than the distance: "8 months ago" says less than the month
 * it happened in
 */
const RECENT = 7 * 24 * 60 * 60 * 1000;

/**
 * The stamp as a date, whichever way it was stored. A catch keeps a
 * local ISO string, which reads as local time; a battle keeps epoch
 * milliseconds
 */
function asDate(stamp: string | number): Date {
  return new Date(stamp);
}

/**
 * When something happened, in a phrase: "3 days ago" while it is
 * recent, "12 Aug 2026" once it is not. Anything unparseable is
 * handed back as it came, since a record with a broken stamp should
 * show what it holds rather than a lie about it
 */
export default function describeDate(stamp: string | number, now = Date.now()): string {
  const when = asDate(stamp);

  if (Number.isNaN(when.getTime())) {
    return String(stamp);
  }
  if (now - when.getTime() < RECENT) {
    return formatRelative(when, now);
  }
  return formatDate(when);
}

/**
 * The same, with the time of day: for things that happen several
 * times in one day, where the date alone would say nothing
 */
export function describeMoment(stamp: string | number, now = Date.now()): string {
  const when = asDate(stamp);

  if (Number.isNaN(when.getTime())) {
    return String(stamp);
  }
  if (now - when.getTime() < RECENT) {
    return formatRelative(when, now);
  }
  return formatMoment(when);
}
