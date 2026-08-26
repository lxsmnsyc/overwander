import 'server-only';
import type Awards from '../data/ids/awards';
import { getSql } from './db';
import { asNumber } from './read';

/**
 * Awards, written with admin credentials. A badge or a title is the
 * outcome of a fight the server staged, so granting one is the
 * server's alone; reading is open, since a profile shows its shelf
 * to visitors
 */

/**
 * One shelf entry: the award, and how many times its fight has been
 * won since
 */
export interface AwardRecord {
  award: Awards;
  wins: number;
}

/**
 * Every award a player holds, in enum order, each with its win count
 */
export async function listAwards(player: string): Promise<AwardRecord[]> {
  const rows = await getSql()`
    select award, wins from awards where player = ${player} order by award
  `;

  return rows.map((row) => ({
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    award: asNumber(row.award) as Awards,
    wins: asNumber(row.wins),
  }));
}

/**
 * Whether the player holds every award in the set: the Elite Four's
 * badge check, and the Champion's
 */
export async function hasAwards(player: string, wanted: Awards[]): Promise<boolean> {
  const rows = await getSql()`
    select count(*)::int as held from awards
    where player = ${player} and award = any(${wanted.map((award) => award)})
  `;

  return asNumber(rows.at(0)?.held ?? 0) >= wanted.length;
}

/**
 * Record one win of an award's fight. The first grants the award;
 * every one after it counts. Resolves true when this call was the
 * one that earned it, which is the win worth a toast
 */
export async function recordAwardWin(player: string, award: Awards, now: number): Promise<boolean> {
  const rows = await getSql()`
    insert into awards (player, award, earned_at, wins)
    values (${player}, ${award}, ${now}, 1)
    on conflict (player, award) do update set wins = awards.wins + 1
    returning wins
  `;

  return asNumber(rows.at(0)?.wins ?? 0) === 1;
}
