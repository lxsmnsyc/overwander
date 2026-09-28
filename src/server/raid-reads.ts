import 'server-only';
import { WORLD_GENERATION } from '../overworld/current';
import { asOffset } from '../auth/local-time';
import { spawnKey } from '../overworld/safari';
import { getSql } from './db';
import { asNumber, asString } from './read';

/** Lobby rows with their `teams` (id and place joined) embedded, the shape the browser reads */
async function withTeams(
  rows: readonly Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) {
    return [];
  }

  const ids: string[] = [];

  for (const row of rows) {
    ids.push(asString(row.id));
  }

  const teams = await getSql()`
    select id, raid_id, joined_seq from teams where raid_id = any(${ids})
  `;
  const joined = new Map<string, { id: string; joined_seq: number }[]>();

  for (const team of teams) {
    const raid = asString(team.raid_id);

    joined.set(raid, [
      ...(joined.get(raid) ?? []),
      { id: asString(team.id), joined_seq: asNumber(team.joined_seq) },
    ]);
  }

  const found: Record<string, unknown>[] = [];

  for (const row of rows) {
    found.push({ ...row, teams: joined.get(asString(row.id)) ?? [] });
  }
  return found;
}

/** Lobbies by id */
export async function readLobbyRows(ids: string[]): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) {
    return [];
  }
  return withTeams(await getSql()`select * from raids where id = any(${ids})`);
}

/** Every lobby still gathering in this raid window and zone */
export async function readLiveLobbyRows(
  windowAt: number,
  offset: number,
): Promise<Record<string, unknown>[]> {
  return withTeams(
    await getSql()`
      select * from raids
      where generation = ${WORLD_GENERATION} and window_at = ${windowAt}
        and utc_offset = ${asOffset(offset)} and battle_id is null and not cleared
    `,
  );
}

/** Who is standing in a lobby, earliest first */
export async function readRaidWatchers(raid: string): Promise<string[]> {
  const rows = await getSql()`
    select player from raid_watchers where raid_id = ${raid} order by seen_at
  `;
  const players: string[] = [];

  for (const row of rows) {
    players.push(asString(row.player));
  }
  return players;
}

/** The calls waiting on this player into lobbies neither started nor cleared, newest first */
export async function readRaidInvites(uid: string): Promise<
  {
    raid: string;
    sender: string;
    role: number;
    sentAt: number;
    windowAt: number;
    offset: number;
  }[]
> {
  const rows = await getSql()`
    select i.raid_id, i.sender, i.role, i.sent_at, r.window_at, r.utc_offset
    from raid_invites i join raids r on r.id = i.raid_id
    where i.recipient = ${uid} and r.battle_id is null and not r.cleared
    order by i.sent_at desc
  `;
  const invites: {
    raid: string;
    sender: string;
    role: number;
    sentAt: number;
    windowAt: number;
    offset: number;
  }[] = [];

  for (const row of rows) {
    invites.push({
      raid: asString(row.raid_id),
      sender: asString(row.sender),
      role: asNumber(row.role),
      sentAt: asNumber(row.sent_at),
      windowAt: asNumber(row.window_at),
      offset: asNumber(row.utc_offset),
    });
  }
  return invites;
}

/**
 * The raids this player has collected from, leaving out any whose
 * pokemon is still waiting uncaught, so the history offers it again
 */
export async function readClaimedRaids(uid: string): Promise<string[]> {
  const sql = getSql();
  const [rows, open, retired] = await Promise.all([
    sql`select raid_id from raid_rewards where player = ${uid}`,
    sql`
      select spawn_id, x, y, window_at, individual_value from encounters
      where player = ${uid} and generation = ${WORLD_GENERATION} and spawn_id like '%$reward'
    `,
    sql`select key from fled_encounters where player = ${uid} and generation = ${WORLD_GENERATION}`,
  ]);
  const gone = new Set<string>();

  for (const row of retired) {
    gone.add(asString(row.key));
  }

  const waiting = new Set<string>();

  for (const row of open) {
    const key = spawnKey(
      asNumber(row.x),
      asNumber(row.y),
      asNumber(row.window_at),
      asNumber(row.individual_value),
    );

    if (!gone.has(key)) {
      waiting.add(asString(row.spawn_id));
    }
  }

  const claimed: string[] = [];

  for (const row of rows) {
    const raid = asString(row.raid_id);

    if (!waiting.has(`${raid}$reward`)) {
      claimed.push(raid);
    }
  }
  return claimed;
}
