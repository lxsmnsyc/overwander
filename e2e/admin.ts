import postgres from 'postgres';
import { TEST_DATABASE_URL, assertTestDatabase } from '../test/test-database.ts';

/**
 * The owner connection into the development database, for staging what a
 * spec cannot click into being: gold, bag rows, lots and positions. Nothing
 * a browser does reaches the database this way; only the specs do.
 */

export const sql = postgres(assertTestDatabase(TEST_DATABASE_URL), {
  prepare: false,
  max: 2,
  onnotice: () => undefined,
});

/** The world generation the dev server under test reads and writes (pinned in `playwright.config.ts`) */
export const GENERATION = process.env.VITE_WORLD_GENERATION === '2' ? 2 : 1;

/**
 * The uid behind an address the spec signed up moments ago. Takes the
 * player object the game helpers hand around, or a bare address
 */
export async function uidOf(player: string | { email: string }): Promise<string> {
  const email = typeof player === 'string' ? player : player.email;
  const found = (await sql`select id from users where email = ${email}`).at(0);

  if (found == null) {
    throw new Error(`no account at ${email}`);
  }
  return String(found.id);
}

/** Set a player's purse outright */
export async function setGold(uid: string, gold: number): Promise<void> {
  await sql`update profiles set gold = ${gold} where id = ${uid}`;
}

/**
 * Insert one row. Columns Postgres works out for itself (the unpacked
 * individual values, the statuses, what is left of a hatch) are left
 * out, so a row read back with `select *` can be written as a copy: an
 * insert that names a generated column is refused outright
 */
export async function insertRow(table: string, row: Record<string, unknown>): Promise<void> {
  const generated = await sql`
    select attname from pg_attribute
    where attrelid = ${`public.${table}`}::regclass and attgenerated <> '' and not attisdropped
  `;
  const names = new Set<string>();

  for (const column of generated) {
    names.add(String(column.attname));
  }

  const kept: Record<string, unknown> = {};

  for (const [column, value] of Object.entries(row)) {
    if (!names.has(column)) {
      kept[column] = value;
    }
  }
  await sql`insert into ${sql(table)} ${sql(kept)}`;
}

/** A table's primary key columns, which an upsert conflicts on */
async function keyOf(table: string): Promise<string[]> {
  const rows = await sql`
    select a.attname from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = ${`public.${table}`}::regclass and i.indisprimary
  `;

  return rows.map((row) => String(row.attname));
}

/**
 * Write one row over whatever is there. For the stores a player
 * already has a row in by the time a spec wants to move them
 */
export async function upsertRow(table: string, row: Record<string, unknown>): Promise<void> {
  const key = await keyOf(table);
  const rest = Object.keys(row).filter((column) => !key.includes(column));

  await sql`
    insert into ${sql(table)} ${sql(row)}
    on conflict (${sql(key)}) do update set ${sql(Object.fromEntries(rest.map((column) => [column, row[column]])))}
  `;
}

/** Patch one row by id column */
export async function patchRow(
  table: string,
  key: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await sql`update ${sql(table)} set ${sql(fields)} where ${sql(key)} = ${id}`;
}

/** The rows of a table matching one column, whole */
export async function findRows(
  table: string,
  column: string,
  value: string | number,
): Promise<Record<string, unknown>[]> {
  return [...(await sql`select * from ${sql(table)} where ${sql(column)} = ${value}`)];
}
