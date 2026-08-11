import { Stats } from '../data/constants/stats';

/**
 * Firestore returns untyped document data; these helpers normalize
 * fields defensively instead of asserting document shapes
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
