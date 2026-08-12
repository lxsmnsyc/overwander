import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

/**
 * Dates as somebody would say them.
 *
 * Everything stored is an instant or a local ISO stamp, which is the
 * right thing to keep and the wrong thing to show: "2026-08-12" is a
 * date a machine reads. What a player wants to know about a catch is
 * roughly when — this week, last spring — and what they want to know
 * about a battle they fought an hour ago is that it was an hour ago.
 *
 * Both are here so the whole game says them the same way.
 */

/**
 * How long a thing counts as recent. Past this, the calendar date is
 * more use than the distance: "8 months ago" says less than the month
 * it happened in
 */
const RECENT = 7 * 24 * 60 * 60 * 1000;

/**
 * The stamp as a date, whichever way it was stored. A catch keeps a
 * local ISO string, a battle keeps epoch milliseconds
 */
function asDate(stamp: string | number): Date {
  return typeof stamp === 'number' ? new Date(stamp) : parseISO(stamp);
}

/**
 * When something happened, in a phrase: "3 days ago" while it is
 * recent, "12 Aug 2026" once it is not. Anything unparseable is
 * handed back as it came, since a record with a broken stamp should
 * show what it holds rather than a lie about it
 */
export default function describeDate(stamp: string | number, now = Date.now()): string {
  const when = asDate(stamp);

  if (!isValid(when)) {
    return String(stamp);
  }
  if (now - when.getTime() < RECENT) {
    return formatDistanceToNowStrict(when, { addSuffix: true });
  }
  return format(when, 'd MMM yyyy');
}

/**
 * The same, with the time of day: for things that happen several
 * times in one day, where the date alone would say nothing
 */
export function describeMoment(stamp: string | number, now = Date.now()): string {
  const when = asDate(stamp);

  if (!isValid(when)) {
    return String(stamp);
  }
  if (now - when.getTime() < RECENT) {
    return formatDistanceToNowStrict(when, { addSuffix: true });
  }
  return format(when, 'd MMM yyyy, HH:mm');
}
