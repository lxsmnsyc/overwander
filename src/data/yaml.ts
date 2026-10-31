import * as v from 'valibot';
import { type Locale, baseLocale, currentLocale, isLocale } from '../i18n/locale';

/**
 * What every YAML registry shares: turning the names a file is written
 * in back into ids, and failing clearly where a name is not one
 */

/** A name looked up in its table, or a clear failure naming where it was written */
export function idOf<T>(table: Readonly<Record<string, T>>, name: string, where: string): T {
  if (!Object.hasOwn(table, name)) {
    throw new Error(`${where}: no such name "${name}"`);
  }
  return table[name];
}

export function idsOf<T>(table: Readonly<Record<string, T>>, names: string[], where: string): T[] {
  const ids: T[] = [];

  for (const name of names) {
    ids.push(idOf(table, name, where));
  }
  return ids;
}

/** A set of flag names as the bitfield they stand for */
export function flagsOf(
  table: Readonly<Record<string, number>>,
  names: string[],
  where: string,
): number {
  let flags = 0;

  for (const name of names) {
    flags |= idOf(table, name, where);
  }
  return flags;
}

/**
 * Every member of an enum given a string, out of a file keyed by
 * member name. A member left out fails the load
 */
export function stringTable<T extends number>(
  ids: Readonly<Record<string, T>>,
  file: unknown,
  where: string,
): Record<number, string> {
  const table: Record<number, string> = {};

  for (const [name, said] of Object.entries(v.parse(v.record(v.string(), v.string()), file))) {
    table[idOf(ids, name, `${where}: ${name}`)] = said;
  }
  for (const [name, id] of Object.entries(ids)) {
    if (!Object.hasOwn(table, id)) {
      throw new Error(`${where}: ${name} is missing`);
    }
  }
  return table;
}

/*
 * Registry text by locale.
 *
 * The words a registry shows live under `text/<locale>/`, English
 * under `text/en/`. A registry globs every locale at once
 * (`../text/*\/moves/**\/*.yaml`) and hands the lot to `splitLocales`,
 * which keeps English as the record and the other locales as overlays
 * on it.
 *
 * English is complete and every other locale is laid over it: a locale
 * file may leave entries and fields out, and those read in English. It
 * may not write anything English lacks: a file with no English
 * counterpart, an entry English does not have, or a field English does
 * not write fails the load, so a misspelt name cannot hide as a
 * translation of nothing.
 */

function splitTextPath(path: string): { locale: string; below: string } {
  // A globbed path reads `.../text/<locale>/<the rest>`
  const found = /(?:^|\/)text\/([^/]+)\/(.+)$/.exec(path);

  if (found == null) {
    throw new Error(`${path} is not under text/<locale>/`);
  }
  return { locale: found[1], below: found[2] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function checkOverlay(overlay: unknown, base: unknown, where: string): void {
  // A map may only write keys English writes, each in the shape English gives it
  if (isRecord(overlay)) {
    if (!isRecord(base)) {
      throw new Error(`${where} is a map, where English writes a value`);
    }
    for (const [key, value] of Object.entries(overlay)) {
      if (!Object.hasOwn(base, key)) {
        throw new Error(`${where}: ${key} is not in English`);
      }
      checkOverlay(value, base[key], `${where}: ${key}`);
    }
    return;
  }

  // A value stands where English has a value of the same kind
  if (typeof overlay !== typeof base || isRecord(base)) {
    throw new Error(`${where} does not have the shape English gives it`);
  }
}

/** One registry's text files: English, and each other locale's files over it */
export interface LocaleFiles {
  english: Record<string, unknown>;
  overlays: Map<Locale, Record<string, unknown>>;
}

/**
 * Splits a registry's text files by locale and checks each locale
 * against English. A folder that is not one of the game's locales fails
 * the load, and so does a locale file English has no counterpart for
 */
export function splitLocales(files: Record<string, unknown>): LocaleFiles {
  // English is the record, kept by its path below `text/en/` to match the others against
  const english: Record<string, unknown> = {};
  const byBelow = new Map<string, unknown>();
  const written: [Locale, string, string, unknown][] = [];

  for (const [path, file] of Object.entries(files)) {
    const { locale, below } = splitTextPath(path);

    if (locale === baseLocale) {
      english[path] = file;
      byBelow.set(below, file);
    } else if (isLocale(locale)) {
      written.push([locale, below, path, file]);
    } else {
      throw new Error(`${path}: ${locale} is not one of the game's locales`);
    }
  }

  // Every other locale's file lies over the English file at the same place
  const overlays = new Map<Locale, Record<string, unknown>>();

  for (const [locale, below, path, file] of written) {
    if (!byBelow.has(below)) {
      throw new Error(`${path} has no English file at text/${baseLocale}/${below}`);
    }
    checkOverlay(file, byBelow.get(below), path);

    let placed = overlays.get(locale);

    if (placed == null) {
      placed = {};
      overlays.set(locale, placed);
    }
    placed[path] = file;
  }
  return { english, overlays };
}

/** Each locale's entries, by the name a registry keys them by */
export type EntryOverlays = Map<Locale, ReadonlyMap<string, unknown>>;

/** Reads each overlay locale's files into entries, the way the registry reads English */
export function readOverlays(
  overlays: ReadonlyMap<Locale, Record<string, unknown>>,
  read: (files: Record<string, unknown>) => ReadonlyMap<string, unknown>,
): EntryOverlays {
  const entries: EntryOverlays = new Map();

  for (const [locale, files] of overlays) {
    entries.set(locale, read(files));
  }
  return entries;
}

/**
 * Makes each named field of a record read in the active locale.
 *
 * The field becomes an accessor on the record itself, so everything
 * that reads `getMoveData(move).name` reads the player's language
 * without a lookup of its own. The server renders requests in several
 * locales at once, which is why the record cannot simply hold one
 */
export function localize<T extends object>(
  record: T,
  entry: string,
  overlays: EntryOverlays,
  fields: readonly (keyof T & string)[],
): void {
  for (const field of fields) {
    // What each locale writes for this field of this entry
    const translated = new Map<Locale, unknown>();

    for (const [locale, entries] of overlays) {
      const written = entries.get(entry);

      if (isRecord(written) && Object.hasOwn(written, field)) {
        translated.set(locale, written[field]);
      }
    }

    // A field no locale translates stays a plain value, so English alone costs nothing
    if (translated.size === 0) {
      continue;
    }

    const english = record[field];

    Object.defineProperty(record, field, {
      configurable: true,
      enumerable: true,
      get: () => (translated.has(currentLocale()) ? translated.get(currentLocale()) : english),
    });
  }
}

/**
 * A copy of a record with some fields changed, for a record read off
 * another (a Mega off its base). A spread would read each translated
 * field once, in whatever locale was active, and keep that; this keeps
 * the fields `localize` made accessors as accessors
 */
export function extendRecord<T extends object, C extends Partial<T>>(base: T, changes: C): T & C {
  // Every field of the base as it is, accessors included
  const record: object = Object.defineProperties({}, Object.getOwnPropertyDescriptors(base));

  // Each change as a plain value over it, whatever the base had there
  for (const [key, value] of Object.entries(changes)) {
    Object.defineProperty(record, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return record as T & C;
}
