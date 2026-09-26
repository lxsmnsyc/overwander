import 'server-only';
import { type Sql, type Tx, getSql, tx } from './db';
import { LedgerKind, isLedgerOn, writeLedgerIn } from './ledger';

/**
 * The gold balance, written over the owner connection. A player edits
 * their own nickname directly (that is theirs to set)
 * but the balance is currency, so it only moves here.
 *
 * Every move is a single atomic statement: a spend's guard rides in
 * the WHERE, so two spends racing cannot both land, and the
 * `gold >= 0` constraint stands behind the guard as the last line.
 * Each also writes its ledger row when the ledger is on (see
 * `./ledger`), on the same transaction
 */

/**
 * Move a player's gold by `delta` on the caller's transaction or
 * connection. A negative move made with `guarded` only lands where the
 * balance covers it. Resolves whether it landed
 */
export async function moveGoldIn(
  sql: Sql | Tx,
  uid: string,
  delta: number,
  reason: string,
  guarded = false,
): Promise<boolean> {
  const rows =
    guarded && delta < 0
      ? await sql`
          update profiles set gold = gold + ${delta}
          where id = ${uid} and gold >= ${-delta}
          returning gold
        `
      : await sql`update profiles set gold = gold + ${delta} where id = ${uid} returning gold`;
  const row = rows.at(0);

  if (row == null) {
    return false;
  }
  await writeLedgerIn(
    sql,
    [{ player: uid, kind: LedgerKind.Gold, key: 0, delta, balance: Number(row.gold) }],
    reason,
  );
  return true;
}

/**
 * `moveGoldIn` on its own. The move and its ledger row share a
 * transaction when the ledger is on, and the move is one statement
 * when it is not
 */
async function moveGold(
  uid: string,
  delta: number,
  reason: string,
  guarded: boolean,
): Promise<boolean> {
  return isLedgerOn()
    ? tx(async (transaction) => moveGoldIn(transaction, uid, delta, reason, guarded))
    : moveGoldIn(getSql(), uid, delta, reason, guarded);
}

/**
 * Add gold
 */
export async function grantGold(uid: string, amount: number, reason: string): Promise<void> {
  await moveGold(uid, amount, reason, false);
}

/**
 * Spend gold; resolves false (and changes nothing) when the balance
 * cannot cover the amount
 */
export async function spendGold(uid: string, amount: number, reason: string): Promise<boolean> {
  return moveGold(uid, -amount, reason, true);
}

/** Profile rows by uid, in the loose shape the browser reads */
export async function readProfileRows(uids: string[]): Promise<Record<string, unknown>[]> {
  if (uids.length === 0) {
    return [];
  }

  const rows = await getSql()`
    select id, nickname, sprite, gold, role, banned, ban_reason, buddy_id, title
    from profiles where id = any(${uids})
  `;

  return [...rows];
}

/** Rename the player. The column's own constraint has the last word on what a name may be */
export async function writeNickname(uid: string, nickname: string): Promise<void> {
  await getSql()`update profiles set nickname = ${nickname} where id = ${uid}`;
}

/** Point the buddy at a catch, or clear it with null. A trigger refuses a catch the player does not own */
export async function writeBuddy(uid: string, catchId: string | null): Promise<void> {
  await getSql()`update profiles set buddy_id = ${catchId} where id = ${uid}`;
}

/** The name a profile falls back to when the account brings none */
const DEFAULT_NICKNAME = 'Trainer';

/**
 * A new account's profile, named after what its provider calls the
 * player, cleaned by the same rule as a rename. An account that already
 * has one keeps it
 */
export async function createProfile(uid: string, name: string): Promise<void> {
  await getSql()`
    insert into profiles (id, nickname)
    values (${uid}, coalesce(nullif(clean_nickname(${name}, 24), ''), ${DEFAULT_NICKNAME}))
    on conflict (id) do nothing
  `;
}
