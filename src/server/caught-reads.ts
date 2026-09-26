import 'server-only';
import type { Fragment, Sql } from 'postgres';
import type { CatchConstraint, CatchOp } from '../auth/catch-search';
import { getSql } from './db';
import { readCaughtMany } from './caught-io';
import { asString } from './read';

/**
 * The box reads, in the record shape. Every catch is public to a
 * signed-in player, as it was under row-level security. A list is read
 * in two steps: the ids a filter answers, then those catches whole
 */

/** One catch as the browser takes it: id, revision and record */
export type RevisedCatch = [id: string, revision: number, record: Record<string, unknown>];

/** Which column of each joinable table points back at the catch */
const LINKS: Record<string, string> = {
  caught_moves: 'caught_id',
  caught_abilities: 'caught_id',
  caught_items: 'caught_id',
  caught_history: 'caught_id',
  team_catches: 'caught_id',
  auctions: 'caught_id',
  profiles: 'buddy_id',
};

/** How many catches one `in` list carries, well under the driver's parameter limit */
const ID_CHUNK = 1000;

/** The catches by id, whole, in the order given and leaving out any that has gone */
export async function readRevisedCatches(
  rows: readonly { id: string; revision: number }[],
): Promise<RevisedCatch[]> {
  const sql = getSql();
  const found: RevisedCatch[] = [];

  for (let at = 0; at < rows.length; at += ID_CHUNK) {
    const page = rows.slice(at, at + ID_CHUNK);
    const ids: string[] = [];

    for (const row of page) {
      ids.push(row.id);
    }

    const records = await readCaughtMany(sql, ids);

    for (const row of page) {
      const record = records.get(row.id);

      if (record != null) {
        found.push([row.id, row.revision, record]);
      }
    }
  }
  return found;
}

/** The ids and revisions a filter answers, ordered by id */
async function idsWhere(where: Fragment): Promise<{ id: string; revision: number }[]> {
  const rows = await getSql()`select id, revision from caught where ${where} order by id`;
  const found: { id: string; revision: number }[] = [];

  for (const row of rows) {
    found.push({ id: asString(row.id), revision: Number(row.revision ?? 0) });
  }
  return found;
}

/** Catches by id, with their revisions */
export async function readCatchesById(ids: string[]): Promise<RevisedCatch[]> {
  if (ids.length === 0) {
    return [];
  }

  const sql = getSql();
  const found: RevisedCatch[] = [];

  for (let at = 0; at < ids.length; at += ID_CHUNK) {
    found.push(
      ...(await readRevisedCatches(
        await idsWhere(sql`id in ${sql(ids.slice(at, at + ID_CHUNK))}`),
      )),
    );
  }
  return found;
}

/** Every catch an owner holds, as id and revision alone */
export async function readBoxRevisions(owner: string): Promise<[string, number][]> {
  const sql = getSql();
  const revisions: [string, number][] = [];

  for (const row of await idsWhere(sql`owner = ${owner}`)) {
    revisions.push([row.id, row.revision]);
  }
  return revisions;
}

/** An owner's box, leaving out what is hidden */
export async function readBox(owner: string): Promise<RevisedCatch[]> {
  const sql = getSql();

  return readRevisedCatches(await idsWhere(sql`owner = ${owner} and not hidden`));
}

/** The flag columns a box may be listed by */
export type MarkColumn =
  | 'shiny'
  | 'shadow'
  | 'egg'
  | 'favorite'
  | 'guarded'
  | 'auctionable'
  | 'hurt';

/** An owner's catches with one flag set */
export async function readMarked(owner: string, mark: MarkColumn): Promise<RevisedCatch[]> {
  const sql = getSql();

  return readRevisedCatches(await idsWhere(sql`owner = ${owner} and not hidden and ${sql(mark)}`));
}

/** What a planned constraint compares against */
type Value = string | number | boolean | (string | number)[];

/** One comparison, as PostgREST read the same operator. A fragment, never awaited */
// oxlint-disable-next-line typescript/promise-function-async
function compare(sql: Sql, column: Fragment, op: CatchOp, value: Value): Fragment {
  if (op === 'in' || op === 'nin') {
    const listed = Array.isArray(value) ? value : [value];

    if (listed.length === 0) {
      return op === 'in' ? sql`false` : sql`true`;
    }
    return op === 'in' ? sql`${column} in ${sql(listed)}` : sql`not (${column} in ${sql(listed)})`;
  }
  if (Array.isArray(value)) {
    throw new Error('A list is only compared with in or nin.');
  }
  switch (op) {
    case 'neq':
      return sql`${column} <> ${value}`;
    case 'gt':
      return sql`${column} > ${value}`;
    case 'gte':
      return sql`${column} >= ${value}`;
    case 'lt':
      return sql`${column} < ${value}`;
    case 'lte':
      return sql`${column} <= ${value}`;
    case 'ilike':
      return sql`${column} ilike ${String(value)}`;
    case 'eq':
    default:
      return sql`${column} = ${value}`;
  }
}

/** One planned constraint as a condition on `caught`. A fragment, never awaited */
// oxlint-disable-next-line typescript/promise-function-async
function condition(sql: Sql, narrowed: CatchConstraint): Fragment {
  if (narrowed.on === 'row') {
    return compare(sql, sql`caught.${sql(narrowed.column)}`, narrowed.op, narrowed.value);
  }

  const link = sql`j.${sql(LINKS[narrowed.table])} = caught.id`;

  if (narrowed.on === 'child') {
    const matched = compare(sql, sql`j.${sql(narrowed.column)}`, narrowed.op, narrowed.value);

    return sql`exists (select 1 from ${sql(narrowed.table)} j where ${link} and ${matched})`;
  }

  let joined = link;

  for (const [column, value] of Object.entries(narrowed.equals)) {
    joined = sql`${joined} and j.${sql(column)} = ${value}`;
  }
  return sql`exists (select 1 from ${sql(narrowed.table)} j where ${joined})`;
}

/**
 * An owner's catches that pass the store's half of a search. The
 * caller still runs the whole predicate over what comes back
 */
export async function searchBox(
  owner: string,
  narrowing: readonly CatchConstraint[],
): Promise<RevisedCatch[]> {
  const sql = getSql();
  let where = sql`caught.owner = ${owner} and not caught.hidden`;

  for (const narrowed of narrowing) {
    where = sql`${where} and ${condition(sql, narrowed)}`;
  }
  return readRevisedCatches(await idsWhere(where));
}

/** How many catches an owner holds, leaving out what is hidden */
export async function countBox(owner: string): Promise<number> {
  const rows = await getSql()`
    select count(*)::int as held from caught where owner = ${owner} and not hidden
  `;

  return Number(rows.at(0)?.held ?? 0);
}

/** Whether an owner holds any catch of the species, hidden ones included */
export async function holdsSpecies(owner: string, species: number): Promise<boolean> {
  const rows = await getSql()`
    select 1 from caught where owner = ${owner} and species = ${species} limit 1
  `;

  return rows.length > 0;
}

/** Which of these ids the owner holds, leaving out what is hidden */
export async function readOwned(owner: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const sql = getSql();
  const rows = await sql`
    select id from caught where owner = ${owner} and not hidden and id in ${sql(ids)}
  `;
  const owned: string[] = [];

  for (const row of rows) {
    owned.push(asString(row.id));
  }
  return owned;
}

/** The buddy, the lots on the block and the catches drafted into raid parties */
export async function readCatchContext(
  owner: string,
): Promise<{ buddy: string; listed: string[]; raiding: string[] }> {
  const sql = getSql();
  const [profile, lots, drafted] = await Promise.all([
    sql`select buddy_id from profiles where id = ${owner}`,
    sql`select caught_id from auctions where seller = ${owner} and not settled and caught_id is not null`,
    sql`select tc.caught_id from team_catches tc join teams t on t.id = tc.team_id where t.player = ${owner}`,
  ]);
  const listed: string[] = [];
  const raiding: string[] = [];

  for (const row of lots) {
    listed.push(asString(row.caught_id));
  }
  for (const row of drafted) {
    raiding.push(asString(row.caught_id));
  }

  const buddy: unknown = profile.at(0)?.buddy_id;

  return { buddy: typeof buddy === 'string' ? buddy : '', listed, raiding };
}
