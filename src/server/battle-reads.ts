import 'server-only';
import { getSql } from './db';
import { asString } from './read';

/** Battle rows by id, each carrying its `battle_teams` entries, in the loose shape the browser reads */
export async function readBattleRows(ids: readonly string[]): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) {
    return [];
  }

  const sql = getSql();
  const [battles, entries] = await Promise.all([
    sql`select * from battles where id = any(${ids})`,
    sql`select battle_id, position, snapshot_id, player from battle_teams
        where battle_id = any(${ids})`,
  ]);
  const teams = new Map<string, Record<string, unknown>[]>();

  for (const entry of entries) {
    const battle = asString(entry.battle_id);

    teams.set(battle, [
      ...(teams.get(battle) ?? []),
      { position: entry.position, snapshot_id: entry.snapshot_id, player: entry.player },
    ]);
  }

  const rows: Record<string, unknown>[] = [];

  for (const battle of battles) {
    rows.push({ ...battle, battle_teams: teams.get(asString(battle.id)) ?? [] });
  }
  return rows;
}

/** Every battle this player fielded a team in */
export async function readPlayerBattleRows(player: string): Promise<Record<string, unknown>[]> {
  const entries = await getSql()`
    select distinct battle_id from battle_teams where player = ${player}
  `;
  const ids: string[] = [];

  for (const entry of entries) {
    ids.push(asString(entry.battle_id));
  }
  return readBattleRows(ids);
}
