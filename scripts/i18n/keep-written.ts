import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'yaml';

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
 * an entry it did not match (an engine's own, with a name by hand) as
 * long as English still has the entry. An entry English no longer has is
 * dropped. A generated field the script no longer writes for an entry it
 * still writes something for is dropped too. An official entry whose
 * PokeAPI row disappears is not written at all, so it keeps its last name.
 *
 * `english` is the English file's content, the source of which entries
 * still exist. Generated fields are dropped only inside an entry, never
 * from a top-level string of the file (a flat table such as types.yaml).
 */
export function keepWritten(
  existing: unknown,
  written: Record<string, unknown>,
  english?: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const held = isRecord(existing) ? existing : {};

  // The script's own output comes first, in its order
  for (const [key, value] of Object.entries(written)) {
    if (isRecord(value)) {
      const source = english?.[key];

      merged[key] = keepWritten(held[key], value, isRecord(source) ? source : undefined, depth + 1);
    } else {
      merged[key] = value;
    }
  }

  // Then what the file holds that the script did not write
  for (const [key, value] of Object.entries(held)) {
    if (Object.hasOwn(merged, key)) {
      continue;
    }
    // An entry or family English no longer has is stale
    if (isRecord(value) && english != null && !Object.hasOwn(english, key)) {
      continue;
    }
    // A generated field the script did not write this time goes, inside an entry
    if (depth > 0 && typeof value === 'string' && GENERATED_FIELDS.has(key)) {
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

/**
 * Writes a locale file: `content` laid over the file already at `path`
 * (see `keepWritten`), under `header`. A file that holds nothing and has
 * nothing to write is not created
 */
export function writeKeptFile(
  path: string,
  header: string,
  content: Record<string, unknown>,
  english?: Record<string, unknown>,
): void {
  // What the file holds beyond the names stays
  const held: unknown = existsSync(path) ? parse(readFileSync(path, 'utf8')) : undefined;

  if (held == null && Object.keys(content).length === 0) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, header + stringify(keepWritten(held, content, english), { lineWidth: 0 }));
}
