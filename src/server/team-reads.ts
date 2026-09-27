import 'server-only';
import type { TeamRecord, TeamSnapshotRecord } from '../auth/teams';
import { type CatchSnapshot, asCatchSnapshot } from '../auth/catch-snapshot';
import { getSql } from './db';
import { asNumber, asString } from './read';
import { readTeams } from './raid-io';

/** Every team this player has formed, by id */
export async function readPlayerTeams(player: string): Promise<[string, TeamRecord][]> {
  const rows = await getSql()`select id from teams where player = ${player}`;
  const ids: string[] = [];

  for (const row of rows) {
    ids.push(asString(row.id));
  }

  const teams = await readTeams(ids);
  const found: [string, TeamRecord][] = [];

  for (const [index, team] of teams.entries()) {
    if (team != null) {
      found.push([ids[index], team]);
    }
  }
  return found;
}

/** Frozen teams by id, in the order asked, with null where one has gone */
export async function readTeamSnapshots(ids: string[]): Promise<(TeamSnapshotRecord | null)[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await getSql()`
    select id, player, alliance, catches from team_snapshots where id = any(${ids})
  `;
  const byId = new Map<string, TeamSnapshotRecord>();

  for (const row of rows) {
    const catches: CatchSnapshot[] = [];

    for (const value of Array.isArray(row.catches) ? row.catches : []) {
      catches.push(asCatchSnapshot(value));
    }
    byId.set(asString(row.id), {
      player: asString(row.player),
      alliance: asNumber(row.alliance),
      catches,
    });
  }

  const found: (TeamSnapshotRecord | null)[] = [];

  for (const id of ids) {
    found.push(byId.get(id) ?? null);
  }
  return found;
}
