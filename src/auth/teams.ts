import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import { type CatchSnapshot, asCatchSnapshot } from './catch-snapshot';
import getSupabase from './supabase';

/**
 * The most catches a team can field
 */
export const TEAM_SIZE = 6;

/**
 * A party a player brought to a raid lobby, stored at teams/{teamId}.
 * It holds catch ids, so it follows whatever those catches become
 * until a battle freezes them
 */
export interface TeamRecord {
  player: string;
  /**
   * The raids/{raidId} it was brought to. A team names its lobby so
   * that a catch can be asked whether it is already queued somewhere
   * without reading every raid in the world
   */
  raid: string;
  catches: string[];
}

/**
 * A team frozen for one battle at teamSnapshots/{snapshotId}: the
 * catches as they stood when the battle started, plus the alliance
 * the team fights under
 */
export interface TeamSnapshotRecord {
  player: string;
  /**
   * Teams sharing an alliance fight side by side; the raid boss
   * stands alone in its own
   */
  alliance: number;
  catches: CatchSnapshot[];
}

/**
 * Teams are written by the server: a party names catch ids, and the
 * ids of other players' pokemon are readable, so the ownership check
 * has to happen somewhere a client cannot skip. Forming one goes
 * through `joinRaid`, and freezing one into a battle happens when the
 * host starts the raid — both in
 * [`src/server/raids.ts`](../server/raids.ts)
 */

export async function getTeam(id: string): Promise<TeamRecord | null> {
  const { data } = await getSupabase()
    .from('teams')
    .select('player, raid_id, team_catches(slot, caught_id)')
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : fromTeamRow(asRecord(data));
}

function fromTeamRow(row: Record<string, unknown>): TeamRecord {
  const catches = asRecordArray(row.team_catches).sort(
    (left, right) => Number(left.slot ?? 0) - Number(right.slot ?? 0),
  );
  const ids: string[] = [];

  for (const entry of catches) {
    ids.push(asString(entry.caught_id));
  }
  return {
    player: asString(row.player),
    raid: asString(row.raid_id),
    catches: ids,
  };
}

/**
 * Every team the player has formed
 */
export async function listTeams(player: string): Promise<[string, TeamRecord][]> {
  const { data } = await getSupabase()
    .from('teams')
    .select('id, player, raid_id, team_catches(slot, caught_id)')
    .eq('player', player);

  const teams: [string, TeamRecord][] = [];

  for (const row of asRecordArray(data)) {
    teams.push([String(row.id), fromTeamRow(row)]);
  }
  return teams;
}

export async function getTeamSnapshot(id: string): Promise<TeamSnapshotRecord | null> {
  const { data } = await getSupabase()
    .from('team_snapshots')
    .select('player, alliance, catches')
    .eq('id', id)
    .maybeSingle();

  if (data == null) {
    return null;
  }

  const catches: CatchSnapshot[] = [];

  for (const value of Array.isArray(data.catches) ? data.catches : []) {
    catches.push(asCatchSnapshot(value));
  }
  return {
    player: asString(data.player),
    alliance: asNumber(data.alliance),
    catches,
  };
}
