import 'server-only';
import { getSql } from './db';

/**
 * The gold balance, written over the owner connection. A player edits
 * their own nickname directly (that is theirs to set)
 * but the balance is currency, so it only moves here.
 *
 * Both moves are single atomic statements: the guard rides in the
 * WHERE, so two spends racing cannot both land, and the `gold >= 0`
 * constraint stands behind the guard as the last line
 */

/**
 * Add gold
 */
export async function grantGold(uid: string, amount: number): Promise<void> {
  await getSql()`update profiles set gold = gold + ${amount} where id = ${uid}`;
}

/**
 * Spend gold; resolves false (and changes nothing) when the balance
 * cannot cover the amount
 */
export async function spendGold(uid: string, amount: number): Promise<boolean> {
  const spent = await getSql()`
    update profiles set gold = gold - ${amount}
    where id = ${uid} and gold >= ${amount}
  `;

  return spent.count > 0;
}
