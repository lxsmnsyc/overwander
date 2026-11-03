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

const reversed = new WeakMap<object, Map<unknown, string>>();

/**
 * The name an id is written under in its table: the enum member's own
 * key, which never changes with the locale. Anything that files by
 * name (a sprite path, a sheet) uses this rather than a display name
 */
export function findIdName<T>(table: Readonly<Record<string, T>>, id: T): string {
  // Each table is turned around once, the first time it is asked
  let names = reversed.get(table);

  if (names == null) {
    names = new Map();
    for (const [name, value] of Object.entries(table)) {
      names.set(value, name);
    }
    reversed.set(table, names);
  }

  const name = names.get(id);

  if (name == null) {
    throw new Error(`No name for id ${String(id)}`);
  }
  return name;
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
 * `readOverlays` for a text file keyed by entry at its top level (the
 * people's `npcs.yaml`): each locale's entries, whichever of its files
 * they are in
 */
export function readEntryOverlays(
  overlays: ReadonlyMap<Locale, Record<string, unknown>>,
): EntryOverlays {
  return readOverlays(overlays, (files) => {
    const entries = new Map<string, unknown>();

    for (const file of Object.values(files)) {
      for (const [key, entry] of Object.entries(v.parse(v.record(v.string(), v.unknown()), file))) {
        entries.set(key, entry);
      }
    }
    return entries;
  });
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

/** The one English file of a text file's glob across the locale folders */
function findEnglishFile(byLocale: LocaleFiles, where: string): unknown {
  const englishFiles = Object.values(byLocale.english);

  if (englishFiles.length !== 1) {
    throw new Error(`${where}: expected one English file, found ${englishFiles.length}`);
  }
  return englishFiles[0];
}

/** The part of a file a table is read from, the whole file when no section is named */
function pickSection(file: unknown, section: string | undefined, where: string): unknown {
  if (section == null) {
    return file;
  }
  if (!isRecord(file) || !Object.hasOwn(file, section)) {
    throw new Error(`${where}: ${section} is missing`);
  }
  return file[section];
}

/**
 * A text file read into lines, English and then what each other
 * locale writes over it, entry by entry
 */
export interface LocaleText {
  english: Map<string, string>;
  translated: Map<string, Map<Locale, string>>;
}

/** One map of lines, read as a table of strings or as one field of each entry */
function readLines(
  file: unknown,
  field: string | undefined,
  where: string,
  complete: boolean,
): Map<string, string> {
  const lines = new Map<string, string>();

  if (field == null) {
    for (const [key, said] of Object.entries(v.parse(v.record(v.string(), v.string()), file))) {
      lines.set(key, said);
    }
    return lines;
  }
  for (const [key, entry] of Object.entries(
    v.parse(v.record(v.string(), v.record(v.string(), v.string())), file),
  )) {
    if (Object.hasOwn(entry, field)) {
      lines.set(key, entry[field]);
    } else if (complete) {
      throw new Error(`${where}: ${key} has no ${field}`);
    }
  }
  return lines;
}

/**
 * Reads a text file every locale may write. `files` is the glob of that
 * one file across the locale folders. A flat file of lines is read as
 * it is; with a `field`, each entry is a map and the line is that
 * field of it. `section` names the part of the file to read
 */
export function readLocaleText(
  files: Record<string, unknown>,
  where: string,
  field?: string,
  section?: string,
): LocaleText {
  const byLocale = splitLocales(files);
  const english = readLines(
    pickSection(findEnglishFile(byLocale, where), section, where),
    field,
    where,
    true,
  );
  const translated = new Map<string, Map<Locale, string>>();

  for (const [locale, placed] of byLocale.overlays) {
    for (const [path, file] of Object.entries(placed)) {
      for (const [key, said] of readLines(pickSection(file, section, path), field, path, false)) {
        let names = translated.get(key);

        if (names == null) {
          names = new Map();
          translated.set(key, names);
        }
        names.set(locale, said);
      }
    }
  }
  return { english, translated };
}

/** Makes one entry of a table read in the active locale, where some locale translates it */
function defineLine<K extends string | number>(
  table: Record<K, string>,
  key: K,
  english: string,
  names: ReadonlyMap<Locale, string> | undefined,
): void {
  if (names == null) {
    return;
  }
  Object.defineProperty(table, key, {
    configurable: true,
    enumerable: true,
    get: () => names.get(currentLocale()) ?? english,
  });
}

/**
 * Adds a text file's entries to a table that several files fill (the
 * trainer classes, one file a region). A translated entry reads the
 * active locale, the rest stay plain English
 */
export function addLocaleText<T extends number>(
  table: Record<number, string>,
  ids: Readonly<Record<string, T>>,
  text: LocaleText,
  where: string,
): void {
  for (const [name, said] of text.english) {
    table[idOf(ids, name, `${where}: ${name}`)] = said;
  }
  for (const [name, names] of text.translated) {
    const id = idOf(ids, name, `${where}: ${name}`);

    defineLine(table, id, table[id], names);
  }
}

function buildTable<T extends number>(
  ids: Readonly<Record<string, T>>,
  text: LocaleText,
  where: string,
): Record<number, string> {
  // English is the whole table, as `stringTable` reads it: every id has its line
  const table = stringTable(ids, Object.fromEntries(text.english), where);

  addLocaleText(table, ids, { english: new Map(), translated: text.translated }, where);
  return table;
}

/**
 * `stringTable` for a file every locale writes: `files` is the glob of
 * one file across the locale folders (`../text/*\/types.yaml`). Each
 * entry a locale translates reads in the active locale. `section` names
 * the part of the file to read, for a file that holds several tables.
 * `derived` is what a locale's entries are worked out to be where its
 * own file does not write them (a family named for its species)
 */
export function localeStringTable<T extends number>(
  ids: Readonly<Record<string, T>>,
  files: Record<string, unknown>,
  where: string,
  section?: string,
  derived?: ReadonlyMap<Locale, Readonly<Record<string, string>>>,
): Record<number, string> {
  const text = readLocaleText(files, where, undefined, section);

  for (const [locale, lines] of derived ?? []) {
    for (const [key, said] of Object.entries(lines)) {
      let names = text.translated.get(key);

      // A line the locale writes itself wins over the derived one
      if (text.english.has(key) && !names?.has(locale)) {
        if (names == null) {
          names = new Map();
          text.translated.set(key, names);
        }
        names.set(locale, said);
      }
    }
  }
  return buildTable(ids, text, where);
}

/**
 * `localeStringTable` for a file whose entries are maps (a leader's
 * `name` and `quote`): the table of one `field` of every entry. A
 * locale may translate one field of an entry and leave the rest
 */
export function localeFieldTable<T extends number>(
  ids: Readonly<Record<string, T>>,
  files: Record<string, unknown>,
  where: string,
  field: string,
  section?: string,
): Record<number, string> {
  return buildTable(ids, readLocaleText(files, where, field, section), where);
}

/**
 * A table of lines keyed by something that is not an id (a sheet's
 * path). Each entry a locale translates reads in the active locale
 */
export function localeLines(files: Record<string, unknown>, where: string): Record<string, string> {
  const text = readLocaleText(files, where);
  const table: Record<string, string> = Object.fromEntries(text.english);

  for (const [key, names] of text.translated) {
    defineLine(table, key, table[key], names);
  }
  return table;
}

/**
 * Makes a field of a record one entry of a text file: what the record
 * reads is the line in the active locale, written once in English
 * when no locale translates it. For records built once out of a
 * written file (a quest, a person)
 */
export function localizeLine<T extends object>(
  record: T,
  field: keyof T & string,
  text: LocaleText,
  key: string,
): void {
  const names = text.translated.get(key);

  if (names == null) {
    return;
  }

  const english = text.english.get(key);

  Object.defineProperty(record, field, {
    configurable: true,
    enumerable: true,
    get: () => names.get(currentLocale()) ?? english,
  });
}

/** A whole text file read in the active locale, and the English it falls back to */
export interface LocaleFile<T> {
  english: T;
  read: () => T;
}

/**
 * A whole text file that is not a table (a list, or a bundle of
 * lists), read in the active locale. A locale that writes the file
 * writes all of it, so a list never mixes two languages. Read it when
 * it is used, not once at load. `check` holds a locale's file against
 * English, for what the shape alone cannot say (two lists of one length)
 */
export function localeFile<T>(
  files: Record<string, unknown>,
  where: string,
  schema: v.GenericSchema<unknown, T>,
  check?: (written: T, english: T, where: string) => void,
): LocaleFile<T> {
  const byLocale = splitLocales(files);
  const english = v.parse(schema, findEnglishFile(byLocale, where));
  const written = new Map<Locale, T>();

  for (const [locale, placed] of byLocale.overlays) {
    for (const [path, file] of Object.entries(placed)) {
      let read: T;

      try {
        read = v.parse(schema, file);
      } catch (error) {
        throw new Error(`${path} must write the whole file: ${String(error)}`, { cause: error });
      }
      check?.(read, english, path);
      written.set(locale, read);
    }
  }
  return { english, read: () => written.get(currentLocale()) ?? english };
}

/**
 * Makes a field of a record a line the code writes, worked out in the
 * active locale the first time each locale reads it. For text built out
 * of other text (an item's description out of its family's templates
 * and a move's name), which would otherwise be written once in whatever
 * locale registered it
 */
export function deriveLocalized<T extends object>(
  record: T,
  field: keyof T & string,
  derive: () => string,
): void {
  const written = new Map<Locale, string>();

  Object.defineProperty(record, field, {
    configurable: true,
    enumerable: true,
    get: () => {
      // Each locale's line is written once and kept
      const locale = currentLocale();
      let line = written.get(locale);

      if (line == null) {
        line = derive();
        written.set(locale, line);
      }
      return line;
    },
  });
}
