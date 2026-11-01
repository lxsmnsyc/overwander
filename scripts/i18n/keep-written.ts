/** The fields `official-names.ts` writes; every other field in a locale file is hand-written */
export const GENERATED_FIELDS: ReadonlySet<string> = new Set(['name', 'category']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A locale file's new content laid over what the file holds now.
 *
 * What the script wrote wins, field by field. Everything else the file
 * holds stays: a field the script does not write (a `description`), and
 * an entry it did not match (an engine's own, with a name by hand). A
 * generated field the script no longer writes for an entry it did match
 * is dropped, so a name that lost its official match does not linger
 */
export function keepWritten(
  existing: unknown,
  written: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const held = isRecord(existing) ? existing : {};

  // The script's own output comes first, in its order
  for (const [key, value] of Object.entries(written)) {
    merged[key] = isRecord(value) ? keepWritten(held[key], value) : value;
  }

  // Then what the file holds that the script did not write
  for (const [key, value] of Object.entries(held)) {
    if (Object.hasOwn(merged, key)) {
      continue;
    }
    if (typeof value === 'string' && GENERATED_FIELDS.has(key)) {
      continue;
    }
    merged[key] = value;
  }
  return merged;
}
