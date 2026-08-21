import 'server-only';
import type { RaidRecord } from '../auth/raid-record';
import { type Tx, getSql } from './db';
import { asNumber, asString } from './read';

/**
 * Raid rows in and out of the record shape. The one seam worth noting:
 * the record carries `teams` as an array and each team is a row of its
 * own, so the reader stitches the list back together in join order
 * (host first)
 */

/** The raid row plus its team list, in the record shape */
async function assembleRaid(
  sql: Tx | ReturnType<typeof getSql>,
  row: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const teams = await sql`
    select id from teams where raid_id = ${asString(row.id)} order by joined_seq
  `;

  return {
    kind: row.kind,
    lair: row.lair,
    species: row.species,
    traitValue: row.trait_value,
    host: row.host,
    teams: teams.map((entry) => asString(entry.id)),
    battle: row.battle_id,
    timestamp: row.window_at,
    offset: row.utc_offset,
    chunk: { seed: row.chunk_seed, x: row.chunk_x, y: row.chunk_y },
    biome: row.biome,
    cell: row.cell,
    cleared: row.cleared,
  };
}

/** One raid in the record shape, or null; optionally locked */
export async function readRaid(id: string): Promise<Record<string, unknown> | null> {
  const sql = getSql();
  const rows = await sql`select * from raids where id = ${id}`;

  return rows.at(0) == null ? null : assembleRaid(sql, rows[0]);
}

/** The same read inside a transaction, with the row locked */
export async function readRaidIn(
  transaction: Tx,
  id: string,
): Promise<Record<string, unknown> | null> {
  const rows = await transaction`select * from raids where id = ${id} for update`;

  return rows.at(0) == null ? null : assembleRaid(transaction, rows[0]);
}

/** Stage a fresh lobby, replacing whatever stood at the id */
export async function writeRaid(transaction: Tx, id: string, fresh: RaidRecord): Promise<void> {
  await transaction`
    insert into raids (
      id, kind, lair, species, trait_value, host, battle_id, window_at,
      utc_offset, chunk_seed, chunk_x, chunk_y, biome, cell, cleared
    ) values (
      ${id}, ${fresh.kind}, ${fresh.lair}, ${fresh.species}, ${fresh.traitValue},
      ${fresh.host}, ${fresh.battle}, ${fresh.timestamp}, ${fresh.offset},
      ${fresh.chunk.seed}, ${fresh.chunk.x}, ${fresh.chunk.y}, ${fresh.biome},
      ${fresh.cell}, ${fresh.cleared}
    )
    on conflict (id) do update set
      kind = excluded.kind, lair = excluded.lair, species = excluded.species,
      trait_value = excluded.trait_value, host = excluded.host,
      battle_id = excluded.battle_id, window_at = excluded.window_at,
      utc_offset = excluded.utc_offset, cleared = excluded.cleared
  `;
  // A restage stands on a clean slate: whatever teams the failed
  // party left are gone with it
  await transaction`delete from teams where raid_id = ${id}`;
}

/** The battle row as the outcome checks read it, or null */
export async function readBattle(id: string): Promise<Record<string, unknown> | null> {
  const rows = await getSql()`select * from battles where id = ${id}`;
  const row = rows.at(0);

  return row == null
    ? null
    : { outcome: row.outcome, startedAt: row.started_at, raid: row.raid_id, limits: row.limits };
}

/** Whether this player fielded a team in this battle */
export async function foughtBattle(battleId: string, player: string): Promise<boolean> {
  const rows = await getSql()`
    select 1 from battle_teams where battle_id = ${battleId} and player = ${player} limit 1
  `;

  return rows.length > 0;
}

/** How a team row reads: its owner and the catches it queues */
export async function readTeam(
  id: string,
): Promise<{ player: string; raid: string; catches: string[] } | null> {
  const sql = getSql();
  const rows = await sql`select id, player, raid_id from teams where id = ${id}`;

  if (rows.at(0) == null) {
    return null;
  }

  const catches = await sql`
    select caught_id from team_catches where team_id = ${id} order by slot
  `;

  return {
    player: asString(rows[0].player),
    raid: asString(rows[0].raid_id),
    catches: catches.map((entry) => asString(entry.caught_id)),
  };
}

export { asNumber };
