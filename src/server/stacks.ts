import 'server-only';
import type { StackSpec } from '../auth/stacks';
import { type Tx, getSql, tx } from './db';
import { asNumber } from './read';

/**
 * The bag, written over the owner connection.
 *
 * What a player carries is currency whichever table it is in: a
 * client that could write the item rows could mint Master Balls, and
 * one that could write the candy rows could mint levels. So every
 * change comes through here.
 *
 * There are two layers on purpose. Most callers change a stack **and
 * something else** in the same breath (an item leaves the bag as a
 * move is learned, a candy leaves the pile as a level lands) and
 * those have to share one transaction, so they take the `In`
 * functions and pass their own. The rest take the self-contained
 * ones, which are single atomic statements.
 *
 * A stack spent to its last is **deleted** rather than left at zero,
 * so the bag holds what is carried and nothing else. The tables
 * enforce it: `count > 0` is a constraint, not a habit.
 */

/** The table and key column a kind of stack lives in */
function tableOf(spec: StackSpec): { table: string; key: string } {
  return spec.field === 'candies'
    ? { table: 'bag_candies', key: 'family' }
    : { table: 'bag_items', key: 'item' };
}

/**
 * How many of it the player holds, read inside a transaction the
 * caller already opened. The row is locked as it is read, because
 * every caller of this is about to write it back
 */
export async function readStackIn(
  transaction: Tx,
  spec: StackSpec,
  uid: string,
  key: number,
): Promise<number> {
  const { table, key: column } = tableOf(spec);
  const rows = await transaction`
    select count from ${transaction(table)}
    where player = ${uid} and ${transaction(column)} = ${key}
    for update
  `;

  return rows.at(0) == null ? 0 : asNumber(rows[0].count);
}

/** Postgres' own oid for int4, so a key list is sent as numbers. */
const INT4 = 23;

/**
 * Several counts at once, keyed by whatever the spec keys on, and
 * missing rows left out. One round trip however many are asked for.
 *
 * Locked in key order rather than in the caller's, which is stricter
 * than reading them one at a time: two callers holding overlapping
 * baskets take the rows in the same order and so cannot deadlock over
 * them
 */
export async function readStacksIn(
  transaction: Tx,
  spec: StackSpec,
  uid: string,
  keys: readonly number[],
): Promise<Map<number, number>> {
  const wanted = [...new Set(keys)];

  if (wanted.length === 0) {
    return new Map();
  }
  const { table, key: column } = tableOf(spec);
  const rows = await transaction`
    select ${transaction(column)}, count from ${transaction(table)}
    where player = ${uid} and ${transaction(column)} = any(${transaction.array(wanted, INT4)})
    order by ${transaction(column)}
    for update
  `;

  return new Map(rows.map((row) => [asNumber(row[column]), asNumber(row.count)]));
}

/**
 * Write one count to a known figure inside the caller's transaction.
 * Nothing is checked here; the caller has already read the row and
 * decided what it should say
 */
export async function writeStackIn(
  transaction: Tx,
  spec: StackSpec,
  uid: string,
  key: number,
  count: number,
): Promise<void> {
  const { table, key: column } = tableOf(spec);
  const held = Math.max(0, Math.floor(count));

  if (held > 0) {
    await transaction`
      insert into ${transaction(table)} (player, ${transaction(column)}, count)
      values (${uid}, ${key}, ${held})
      on conflict (player, ${transaction(column)}) do update set count = ${held}
    `;
  } else {
    await transaction`
      delete from ${transaction(table)}
      where player = ${uid} and ${transaction(column)} = ${key}
    `;
  }
}

/**
 * Take some of it inside the caller's transaction, given the figure
 * they have already read. Answers false, and writes nothing, when the
 * player does not hold enough, so a refusal costs nothing
 */
export async function spendStackIn(
  transaction: Tx,
  spec: StackSpec,
  uid: string,
  key: number,
  held: number,
  count = 1,
): Promise<boolean> {
  if (held < count) {
    return false;
  }
  await writeStackIn(transaction, spec, uid, key, held - count);
  return true;
}

/**
 * How many of it the player holds
 */
export async function readStack(spec: StackSpec, uid: string, key: number): Promise<number> {
  const { table, key: column } = tableOf(spec);
  const rows = await getSql()`
    select count from ${getSql()(table)}
    where player = ${uid} and ${getSql()(column)} = ${key}
  `;

  return rows.at(0) == null ? 0 : asNumber(rows[0].count);
}

/**
 * Add to a stack, one atomic statement: two grants landing together
 * both count
 */
export async function grantStack(
  spec: StackSpec,
  uid: string,
  key: number,
  count = 1,
): Promise<void> {
  const { table, key: column } = tableOf(spec);
  const sql = getSql();

  await sql`
    insert into ${sql(table)} (player, ${sql(column)}, count)
    values (${uid}, ${key}, ${count})
    on conflict (player, ${sql(column)})
      do update set count = ${sql(table)}.count + ${count}
  `;
}

/**
 * Spend from a stack. Resolves false (and changes nothing) when the
 * player does not hold enough. The guard rides in the statement, so
 * two spends racing cannot both land on the same copies
 */
export async function spendStack(
  spec: StackSpec,
  uid: string,
  key: number,
  count = 1,
): Promise<boolean> {
  const { table, key: column } = tableOf(spec);

  return tx(async (transaction) => {
    // Strictly more than the spend keeps the row positive, which the
    // count > 0 constraint insists on; an exact spend deletes instead
    const spent = await transaction`
      update ${transaction(table)} set count = count - ${count}
      where player = ${uid} and ${transaction(column)} = ${key} and count > ${count}
    `;

    if (spent.count > 0) {
      return true;
    }

    const emptied = await transaction`
      delete from ${transaction(table)}
      where player = ${uid} and ${transaction(column)} = ${key} and count = ${count}
    `;

    return emptied.count > 0;
  });
}

/**
 * Hand over several kinds at once, in one statement, so a stash never
 * half-lands
 */
export async function grantStacks(
  spec: StackSpec,
  uid: string,
  granted: Iterable<[key: number, count: number]>,
): Promise<void> {
  const owed = [...granted].filter(([, count]) => count > 0);

  if (owed.length === 0) {
    return;
  }

  const { table, key: column } = tableOf(spec);
  const sql = getSql();
  const rows = owed.map(([key, count]) => ({ player: uid, [column]: key, count }));

  await sql`
    insert into ${sql(table)} ${sql(rows, 'player', column, 'count')}
    on conflict (player, ${sql(column)})
      do update set count = ${sql(table)}.count + excluded.count
  `;
}
