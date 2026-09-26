import 'server-only';
import type { Sql, Tx } from './db';
import { ServerFlag, isFlagOn } from './flags';

/**
 * The economy ledger, kept while `ECONOMY_LEDGER` is on: one row for
 * every change to gold, an item stack or a candy stack, written in the
 * same transaction as the change so the two land together or not at
 * all.
 *
 * It is written here by the server rather than by triggers in the
 * database, because the choice is the deployment's: a trigger cannot
 * read the server's environment, and a setting on the connection does
 * not survive the transaction pooler. So every write to a purse or a
 * stack goes through `moveGoldIn` in `./profile` or the functions in
 * `./stacks`, which call this.
 */
export const enum LedgerKind {
  Gold = 0,
  Item = 1,
  Candy = 2,
}

export interface LedgerEntry {
  player: string;
  kind: LedgerKind;
  /** The item or candy family; 0 for gold */
  key: number;
  delta: number;
  /** What it came to */
  balance: number;
}

export function isLedgerOn(): boolean {
  return isFlagOn(ServerFlag.EconomyLedger);
}

/**
 * Write what moved, on the connection or transaction the change was
 * made on. A move of nothing is not a row
 */
export async function writeLedgerIn(
  sql: Sql | Tx,
  entries: readonly LedgerEntry[],
  reason: string | null = null,
): Promise<void> {
  if (!isLedgerOn()) {
    return;
  }

  const rows: {
    player: string;
    kind: number;
    key: number;
    delta: number;
    balance: number;
    reason: string | null;
  }[] = [];

  for (const entry of entries) {
    if (entry.delta !== 0) {
      rows.push({ ...entry, reason });
    }
  }
  if (rows.length === 0) {
    return;
  }
  await sql`
    insert into ledger ${sql(rows, 'player', 'kind', 'key', 'delta', 'balance', 'reason')}
  `;
}
