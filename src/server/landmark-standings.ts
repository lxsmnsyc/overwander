import 'server-only';
import { WORLD_GENERATION } from '../overworld/current';
import { getSql } from './db';
import { asNumber, asString } from './read';

/** The row ids one chunk's landmarks are asked by */
export interface StandingIds {
  lairs: string[];
  stops: string[];
  seats: string[];
  visits: string[];
  nests: string[];
}

/** Which of those ids have a row: the player's own, and every held seat with its holder */
export interface StandingRows {
  cleared: string[];
  beaten: string[];
  held: [number, string][];
  visited: string[];
  taken: string[];
}

function column(rows: readonly Record<string, unknown>[], name: string): string[] {
  const values: string[] = [];

  for (const row of rows) {
    values.push(asString(row[name]));
  }
  return values;
}

export async function readStandingRows(uid: string, ids: StandingIds): Promise<StandingRows> {
  const sql = getSql();
  const none: Record<string, unknown>[] = [];
  const [rewards, defeated, seats, claims, eggs] = await Promise.all([
    ids.lairs.length === 0
      ? none
      : sql`select raid_id from raid_rewards where player = ${uid} and raid_id in ${sql(ids.lairs)}`,
    ids.stops.length === 0
      ? none
      : sql`select stop_id from rocket_stops
            where generation = ${WORLD_GENERATION} and player = ${uid} and defeated
              and stop_id in ${sql(ids.stops)}`,
    ids.seats.length === 0
      ? none
      : sql`select cell, holder from gym_seats
            where generation = ${WORLD_GENERATION} and holder is not null
              and seat_id in ${sql(ids.seats)}`,
    ids.visits.length === 0
      ? none
      : sql`select marker from npc_claims
            where generation = ${WORLD_GENERATION} and player = ${uid}
              and marker in ${sql(ids.visits)}`,
    ids.nests.length === 0
      ? none
      : sql`select marker from nest_claims
            where generation = ${WORLD_GENERATION} and player = ${uid}
              and marker in ${sql(ids.nests)}`,
  ]);
  const held: [number, string][] = [];

  for (const row of seats) {
    held.push([asNumber(row.cell), asString(row.holder)]);
  }
  return {
    cleared: column(rewards, 'raid_id'),
    beaten: column(defeated, 'stop_id'),
    held,
    visited: column(claims, 'marker'),
    taken: column(eggs, 'marker'),
  };
}
