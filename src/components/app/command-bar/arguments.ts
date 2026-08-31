/**
 * Reading what a command was given, before anything is sent.
 *
 * Pure: a mistyped coordinate is somebody's slip rather than a
 * refusal worth a round trip, and the rules are worth testing without
 * one
 */

/** A command's arguments, or the one line saying why they are not */
export type Arguments<T> = { ok: true; value: T } | { ok: false; reason: string };

/** A refusal, in the words the bar prints */
export function refuse<T>(reason: string): Arguments<T> {
  return { ok: false, reason };
}

/**
 * A whole number as it was typed, or null for anything that is not
 * one.
 *
 * Undefined and null are different answers: a parameter left out is
 * how somebody asks for the default, and one that reads as nothing is
 * a slip
 */
export function asWhole(typed: string | undefined): number | null | undefined {
  if (typed == null) {
    return undefined;
  }
  const value = Number(typed);

  return typed.trim() !== '' && Number.isFinite(value) ? Math.trunc(value) : null;
}

/** The same, refused where it falls outside what the field allows */
export function asBounded(
  typed: string | undefined,
  low: number,
  high: number,
): number | null | undefined {
  const value = asWhole(typed);

  if (value == null) {
    return value;
  }
  return value >= low && value <= high ? value : null;
}

/**
 * Midnight at the end of a typed day, on the reader's own clock. A
 * gift expires at the end of the day it names rather than at its
 * beginning: "the 5th" means the 5th is still a day it can be taken on
 */
export function endOfDay(typed: string | undefined): number | null | undefined {
  if (typed == null || typed.trim() === '') {
    return typed == null ? undefined : null;
  }
  const at = new Date(`${typed.trim()}T23:59:59`);

  return Number.isNaN(at.getTime()) ? null : at.getTime();
}
