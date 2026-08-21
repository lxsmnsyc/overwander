import { Stats } from '../data/constants/stats';

/**
 * Rows arrive untyped from PostgREST; these helpers normalize a field
 * defensively rather than asserting a row's shape
 */

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * A stored yes-or-no, which is only ever true when it was actually
 * written as one: a missing field, a number, a string are all no
 */
export function asBoolean(value: unknown): boolean {
  return value === true;
}

export function asNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === 'number')
    : [];
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * The store hands rows back untyped; this is the one narrowing from
 * a result set to records, done by guard rather than assertion
 */
export function asRecordArray(value: unknown): Record<string, unknown>[] {
  return isUnknownArray(value) ? value.filter(isRecord) : [];
}

export function asStatRecord(value: unknown): Record<Stats, number> {
  const source = asRecord(value);

  return {
    [Stats.HP]: asNumber(source[String(Stats.HP)]),
    [Stats.Attack]: asNumber(source[String(Stats.Attack)]),
    [Stats.Defense]: asNumber(source[String(Stats.Defense)]),
    [Stats.SpecialAttack]: asNumber(source[String(Stats.SpecialAttack)]),
    [Stats.SpecialDefense]: asNumber(source[String(Stats.SpecialDefense)]),
    [Stats.Speed]: asNumber(source[String(Stats.Speed)]),
  };
}
