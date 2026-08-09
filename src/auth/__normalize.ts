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

export function asNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === 'number')
    : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
