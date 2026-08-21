import { UNLIMITED_BATTLE_LIMITS } from '../data/constants/battle-limits';
import type { Species } from '../data/ids/species';
import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import getSupabase, { type Unwatch, watchRow, watchTable } from './supabase';
import { requireUid } from '../server/auth';
import BattleOutcome from './battle-outcome';
import recordOnServer from '../server/battles';
import { finishBattle as finishOnServer } from '../server/raids';
import type BattleAftermath from './battle-aftermath';

import getIdToken from './session';
import { type TeamSnapshotRecord, getTeamSnapshot } from './teams';

export { default as BattleOutcome } from './battle-outcome';

/**
 * One fought battle at battles/{battleId}: the team snapshots that
 * entered it. The id doubles as the battle's RNG seed, so the same
 * teams and the same seed replay the same fight — which is exactly
 * what the history's replay does, rewards left out
 */
export interface BattleRecord {
  teams: string[];
  /**
   * Every player who fielded a team, for the history listing
   */
  players: string[];
  /**
   * The raid the battle was fought for, empty for future PvP
   */
  raid: string;
  /**
   * What was fought, so a history entry names it without loading the
   * team snapshots
   */
  species: Species;
  outcome: BattleOutcome;
  /**
   * Server-clock milliseconds the battle started
   */
  startedAt: number;
  /**
   * What the fight allowed a unit to bring — abilities, items and
   * moves — packed the way a catch's own `slots` are.
   *
   * It is stored rather than derived so a battle replays under the
   * rules it was fought under: a raid allows everything, a fight
   * between players is held to the mainline's shape today, and a
   * scenario that wants two held items writes that here
   */
  limits: number;
}

const BATTLE_TABLE = 'battles';

/** One battle row plus its team list, in the record shape */
async function readBattleRow(id: string): Promise<BattleRecord | null> {
  const { data }: { data: unknown } = await getSupabase()
    .from(BATTLE_TABLE)
    .select('*, battle_teams(position, snapshot_id, player)')
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : fromBattleRow(asRecord(data));
}

function fromBattleRow(row: Record<string, unknown>): BattleRecord {
  const teams = asRecordArray(row.battle_teams).sort(
    (left, right) => Number(left.position ?? 0) - Number(right.position ?? 0),
  );

  return {
    teams: teams.map((entry) => asString(entry.snapshot_id)),
    players: [
      ...new Set(
        teams
          .map((entry) => entry.player)
          .filter((player): player is string => typeof player === 'string'),
      ),
    ],
    raid: asString(row.raid_id),
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    species: asNumber(row.species) as Species,
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    outcome: asNumber(row.outcome) as BattleOutcome,
    startedAt: asNumber(row.started_at),
    limits: row.limits == null ? UNLIMITED_BATTLE_LIMITS : asNumber(row.limits),
  };
}

/**
 * A typed handle on one battle row, for callers that have to read it
 * inside a transaction of their own
 */

/**
 * Battles are created by the server when a raid starts — see
 * [`src/server/raids.ts`](../server/raids.ts) — so the teams that
 * enter one are the teams that were actually frozen for it
 */

export async function getBattle(id: string): Promise<BattleRecord | null> {
  return readBattleRow(id);
}

/**
 * Follow a battle record: the outcome is stamped by whoever watches
 * the fight settle, and every other participant should see it
 */
export function watchBattle(id: string, onChange: (battle: BattleRecord | null) => void): Unwatch {
  return watchRow(BATTLE_TABLE, `id=eq.${id}`, async () => readBattleRow(id), onChange);
}

/**
 * Follow the player's finished battles, so a raid they just fought
 * shows up in the history without a reload
 */
export function watchBattleHistory(
  player: string,
  onChange: (battles: [string, BattleRecord][]) => void,
): Unwatch {
  const read = async (): Promise<[string, BattleRecord][]> => {
    const { data } = await getSupabase()
      .from('battle_teams')
      .select('battle_id, battles(*, battle_teams(position, snapshot_id, player))')
      .eq('player', player);

    return asRecordArray(data)
      .map((entry): [string, BattleRecord] => [
        String(entry.battle_id),
        fromBattleRow(asRecord(entry.battles)),
      ])
      .filter(([, record]) => record.outcome !== BattleOutcome.Unfinished)
      .sort((left, right) => right[1].startedAt - left[1].startedAt);
  };

  // The junction row filtered to this player is the invalidation
  // signal; every ping re-reads the list
  return watchTable('battle_teams', [`player=eq.${player}`], read, onChange);
}

/**
 * Record how a battle ended. Every participant reports it and the
 * outcome they compute is the same, since the fight is deterministic
 * — so the server takes the first report from someone who actually
 * fielded a team and refuses every later one. A spectator settles
 * nothing, and a stamped outcome cannot be rewritten
 */
export async function finishBattle(id: string, outcome: BattleOutcome): Promise<boolean> {
  return finishBattleOnServer(await getIdToken(), id, outcome);
}

async function finishBattleOnServer(
  token: string,
  id: string,
  outcome: BattleOutcome,
): Promise<boolean> {
  'use server';
  return finishOnServer(await requireUid(token), id, outcome);
}

/**
 * Report what the battle did to the player's party: the items it
 * spent, the health it has left and the status it is still carrying.
 * A berry eaten in a raid is gone from the catch record afterwards,
 * and a pokemon that came out on two hit points stays on two.
 *
 * Each fighter reports their own party — the outcome is stamped once
 * by whoever sees the fight settle, but the aftermath lands per
 * player, since nobody else's catches are theirs to write.
 *
 * The server checks the report against the team snapshots it froze
 * itself, and settles each player once per battle
 */
export async function recordAftermath(id: string, aftermath: BattleAftermath[]): Promise<boolean> {
  return recordAftermathOnServer(await getIdToken(), id, aftermath);
}

async function recordAftermathOnServer(
  token: string,
  id: string,
  aftermath: BattleAftermath[],
): Promise<boolean> {
  'use server';
  return recordOnServer(await requireUid(token), id, aftermath);
}

/**
 * The player's finished battles, newest first. Unfinished ones stay
 * out of the history — an abandoned fight is not a result
 */
export async function listBattleHistory(player: string): Promise<[string, BattleRecord][]> {
  const { data } = await getSupabase()
    .from('battle_teams')
    .select('battle_id, battles(*, battle_teams(position, snapshot_id, player))')
    .eq('player', player);

  return asRecordArray(data)
    .map((entry): [string, BattleRecord] => [
      String(entry.battle_id),
      fromBattleRow(asRecord(entry.battles)),
    ])
    .filter(([, record]) => record.outcome !== BattleOutcome.Unfinished)
    .sort((left, right) => right[1].startedAt - left[1].startedAt);
}

/**
 * The battle's team snapshots, in the order they entered. Snapshots
 * that have gone missing are left out
 */
export async function listBattleTeams(record: BattleRecord): Promise<TeamSnapshotRecord[]> {
  const teams = await Promise.all(record.teams.map(getTeamSnapshot));

  return teams.filter((team): team is TeamSnapshotRecord => team != null);
}
