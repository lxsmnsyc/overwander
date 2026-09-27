import type { CatchSnapshot } from './catch-snapshot';
import getIdToken from './session';
import batchedQuery from '../utils/batched-query';
import { readOnly } from '../utils/server-calls';
import { requireReader } from '../server/auth';
import check, { ID_BATCH, TOKEN, UID } from '../server/validate';
import { readTeams } from '../server/raid-io';
import { readPlayerTeams, readTeamSnapshots } from '../server/team-reads';

/** The most ids one batched read sends, as `ID_BATCH` allows */
const BATCH_SIZE = 50;

export { default as TEAM_SIZE } from './team-size';

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
  return (await readTeamsOnServer(await getIdToken(), [id])).at(0) ?? null;
}

/**
 * `getTeam` for a lobby reading every team in it at once: the reads made
 * in the same moment go out as one. Browser only, since the queue is
 * shared by everyone in the module
 */
export const getTeamBatched = batchedQuery(
  async (ids: string[]): Promise<Map<string, TeamRecord>> => {
    const teams = await readTeamsOnServer(await getIdToken(), ids);
    const found = new Map<string, TeamRecord>();

    for (const [index, team] of teams.entries()) {
      if (team != null) {
        found.set(ids[index], team);
      }
    }
    return found;
  },
  (found, id: string): TeamRecord | null => found.get(id) ?? null,
  { limit: BATCH_SIZE },
);

async function readTeamsOnServer(token: string, ids: string[]): Promise<(TeamRecord | null)[]> {
  'use server';
  check(TOKEN, token);
  check(ID_BATCH, ids);
  await requireReader(token);
  return readTeams(ids);
}
readOnly(readTeamsOnServer);

/**
 * Every team the player has formed
 */
export async function listTeams(player: string): Promise<[string, TeamRecord][]> {
  return listTeamsOnServer(await getIdToken(), player);
}

async function listTeamsOnServer(token: string, player: string): Promise<[string, TeamRecord][]> {
  'use server';
  check(TOKEN, token);
  check(UID, player);
  await requireReader(token);
  return readPlayerTeams(player);
}
readOnly(listTeamsOnServer);

export async function getTeamSnapshot(id: string): Promise<TeamSnapshotRecord | null> {
  return (await readSnapshotsOnServer(await getIdToken(), [id])).at(0) ?? null;
}

/**
 * `getTeamSnapshot` for a page of battles reading every team in them at
 * once: the reads made in the same moment go out as one. Browser only,
 * since the queue is shared by everyone in the module
 */
export const getTeamSnapshotBatched = batchedQuery(
  async (ids: string[]): Promise<Map<string, TeamSnapshotRecord>> => {
    const snapshots = await readSnapshotsOnServer(await getIdToken(), ids);
    const found = new Map<string, TeamSnapshotRecord>();

    for (const [index, snapshot] of snapshots.entries()) {
      if (snapshot != null) {
        found.set(ids[index], snapshot);
      }
    }
    return found;
  },
  (found, id: string): TeamSnapshotRecord | null => found.get(id) ?? null,
  { limit: BATCH_SIZE },
);

async function readSnapshotsOnServer(
  token: string,
  ids: string[],
): Promise<(TeamSnapshotRecord | null)[]> {
  'use server';
  check(TOKEN, token);
  check(ID_BATCH, ids);
  await requireReader(token);
  return readTeamSnapshots(ids);
}
readOnly(readSnapshotsOnServer);
