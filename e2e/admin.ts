import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import postgres from 'postgres';

/**
 * The owner connection into the local database, for staging what a
 * spec cannot click into being: accounts, gold, bag rows, lots. Nothing
 * a browser does reaches the database this way; only the specs do.
 */

export const sql = postgres(
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/overwander',
  { prepare: false, max: 2, onnotice: () => undefined },
);

/** The world generation the dev server under test reads and writes */
export const GENERATION = process.env.VITE_WORLD_GENERATION === '2' ? 2 : 1;

/**
 * A real account with a password, so the app can sign in as it and a
 * friend can find it by address. Resolves the uid
 */
export async function stageAccount(email: string, password: string): Promise<string> {
  const uid = randomUUID();

  await sql`insert into users (id, name, email, email_verified) values (${uid}, '', ${email}, true)`;
  await sql`
    insert into identities (account_id, provider_id, user_id, password, updated_at)
    values (${uid}, 'credential', ${uid}, ${hashSync(password, 10)}, now())
  `;
  await sql`insert into profiles (id, nickname) values (${uid}, 'Trainer')`;
  return uid;
}

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

/** Put a stack in the bag, replacing whatever count stood there */
export async function setBagItem(uid: string, item: number, count: number): Promise<void> {
  await sql`
    insert into bag_items (player, item, count) values (${uid}, ${item}, ${count})
    on conflict (player, item) do update set count = excluded.count
  `;
}

/**
 * Write dex tallies for a species list, seen and caught alike. Two of
 * each, the figure the specs have always staged and asserted against
 */
export async function setDexCounts(uid: string, species: number[]): Promise<void> {
  for (const one of species) {
    await sql`
      insert into pokedex_entries (player, species, seen, caught) values (${uid}, ${one}, 2, 2)
      on conflict (player, species) do update set seen = 2, caught = 2
    `;
  }
}

/**
 * Clear every lobby still gathering. Raids share one window-wide
 * listing, so a spec that stages its own must sweep the idle ones
 * earlier specs left, or the first row it clicks is somebody else's
 */
export async function clearIdleRaids(): Promise<void> {
  await sql`delete from raids where battle_id is null`;
}

/**
 * Take every lot off the board.
 *
 * The board is global and nothing expires it, so lots pile up run
 * after run until a spec that hovers "the lot by Bracken" finds two of
 * them. A spec that is about what an empty board looks like, or about
 * one particular lot, starts by clearing it
 */
export async function clearAuctions(): Promise<void> {
  // Children first: a bid and a seller's daily marker both name their lot
  await sql`delete from bids`;
  await sql`delete from auction_sellers`;
  await sql`delete from auctions`;
}

/**
 * The columns Postgres works out for itself: the unpacked individual
 * values, the statuses and what is left of a hatch. A copy is a
 * `select *`, and an insert that names a generated column is refused
 * outright, so they are dropped on the way back in
 */
const DERIVED = new Set([
  'iv_hp',
  'iv_atk',
  'iv_def',
  'iv_spa',
  'iv_spd',
  'iv_spe',
  'iv_total',
  'status_poisoned',
  'status_badly_poisoned',
  'status_sleeping',
  'status_paralyzed',
  'status_burned',
  'status_frozen',
  'hatch_left',
]);

export function copyable(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([column]) => !DERIVED.has(column)));
}

export async function insertRow(table: string, row: Record<string, unknown>): Promise<void> {
  await sql`insert into ${sql(table)} ${sql(row)}`;
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
