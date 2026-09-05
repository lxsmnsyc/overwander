import 'server-only';
import BattleOutcome from '../../auth/battle-outcome';
import { UNLIMITED_BATTLE_LIMITS } from '../../data/constants/battle-limits';
import { RaidKind, type RaidRecord, asRaidRecord } from '../../auth/raid-record';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE, createRaidBossSnapshot } from '../../overworld/raid';
import { getSql, jsonOf, newDocId, tx } from '../db';
import { foughtBattle, readBattle, readRaid, readTeam } from '../raid-io';
import { releaseBattleLocks } from '../locks';
import { recordSeenOpponents } from '../pokedex';
import { asOutcome } from './outcome';
import { publishTeamSnapshot } from './snapshot';

/** Starting the fight, settling it, and clearing the lobby after */
/**
 * Start the raid: every joined team is frozen, the boss gets a
 * snapshot of its own, and the pair of alliances becomes a battle.
 * Only the host may start, and only once — the battle id is written
 * back inside a transaction, so a second start finds it taken
 */
export async function startRaid(uid: string, lobby: string, now: number): Promise<string | null> {
  const stored = await readRaid(lobby);

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.host !== uid || raid.battle != null || raid.teams.length === 0) {
    return null;
  }

  // The raid is claimed before anything is frozen, since freezing
  // locks the parties: a start that loses the race must not hold
  // pokemon for a battle it is not going to run. A claim whose teams
  // then field nothing leaves the raid pointing at a battle that was
  // never written, which reads as lost and restages
  const battleId = newDocId();
  const claimed = await getSql()`
    update raids set battle_id = ${battleId}
    where id = ${lobby} and battle_id is null
  `;

  if (claimed.count === 0) {
    const current = await readRaid(lobby);

    return typeof current?.battle === 'string' ? current.battle : null;
  }

  // Every party at once. Each freezes a whole team of its own and
  // none of them waits on another, so a lobby of four starts in the
  // time one takes rather than four
  const teams = await Promise.all(raid.teams.map(async (id) => readTeam(id)));
  const published = await Promise.all(
    teams.map(async (team): Promise<[string, string] | null> => {
      if (team == null) {
        return null;
      }
      const snapshot = await publishTeamSnapshot(team.player, team.catches, PLAYER_ALLIANCE, now);

      return snapshot == null ? null : [team.player, snapshot];
    }),
  );
  const fielded = published.filter((entry) => entry != null);

  if (fielded.length === 0) {
    return null;
  }

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const bossId = newDocId();

  await tx(async (transaction) => {
    await transaction`
      insert into team_snapshots (id, player, alliance, catches)
      values (${bossId}, null, ${BOSS_ALLIANCE}, ${jsonOf(transaction, [
        createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow),
      ])})
    `;
    await transaction`
      insert into battles (id, raid_id, species, outcome, started_at, biome, limits)
      values (${battleId}, ${lobby}, ${raid.species}, ${BattleOutcome.Unfinished}, ${now},
              ${raid.biome}, ${UNLIMITED_BATTLE_LIMITS})
    `;

    const rows = [
      { battle_id: battleId, position: 0, snapshot_id: bossId, player: null as string | null },
      ...fielded.map(([player, snapshot], at) => ({
        battle_id: battleId,
        position: at + 1,
        snapshot_id: snapshot,
        player: player as string | null,
      })),
    ];

    await transaction`
      insert into battle_teams ${transaction(rows, 'battle_id', 'position', 'snapshot_id', 'player')}
    `;
  });

  // The lobby's teams have done their work. What the fight runs on is
  // the snapshots, which are frozen and complete; a team is a list of
  // catch ids that was only ever there so a party could gather and be
  // checked for a pokemon queued twice. Left behind they would be one
  // stale row per raid ever staged, and `isAnyCatchQueued` would go on
  // finding parties that are fighting rather than waiting
  await getSql()`delete from teams where id = any(${raid.teams})`;

  // Everybody in the lobby has now stood in front of it, which is the
  // only way most of them will ever meet one
  await recordSeenOpponents(
    battleId,
    fielded.map(([player]) => player),
  );

  return battleId;
}

/**
 * Record how a battle ended. Only a player who fielded a team may
 * report it, and only once: an outcome already stamped stands, so the
 * first honest report cannot be overwritten by a later one.
 *
 * The end of the fight is also what frees its party — every catch it
 * froze goes back to being editable. A battle nobody ever reports
 * releases its own by timing out instead
 */
export async function finishBattle(
  uid: string,
  battleId: string,
  outcome: BattleOutcome,
): Promise<boolean> {
  const stamped =
    (await foughtBattle(battleId, uid)) &&
    (
      await getSql()`
        update battles set outcome = ${outcome}
        where id = ${battleId} and outcome = ${BattleOutcome.Unfinished}
      `
    ).count > 0;

  if (stamped) {
    await releaseBattleLocks(battleId);
  }
  return stamped;
}

/**
 * Shut a raid's landmark for the rest of the window. Only a raid whose
 * battle is recorded as won can be cleared, so a player cannot close
 * a landmark by claiming a victory that never happened
 */
export async function clearRaid(uid: string, lobby: string): Promise<boolean> {
  const raid = await readRaid(lobby);
  const battleId = raid?.battle;

  if (typeof battleId !== 'string') {
    return false;
  }

  const battle = await readBattle(battleId);

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !(await foughtBattle(battleId, uid))
  ) {
    return false;
  }
  await getSql()`update raids set cleared = true where id = ${lobby}`;
  return true;
}
