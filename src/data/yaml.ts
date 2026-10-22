import * as v from 'valibot';

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
