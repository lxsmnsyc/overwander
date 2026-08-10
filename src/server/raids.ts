import 'server-only';
import BattleOutcome from '../auth/battle-outcome';
import {
  BATTLE_COLLECTION,
  CAUGHT_COLLECTION,
  RAID_COLLECTION,
  RAID_REWARD_COLLECTION,
  TEAM_COLLECTION,
  TEAM_SNAPSHOT_COLLECTION,
} from '../auth/collections';
import { type CatchSnapshot, createCatchSnapshot } from '../auth/catch-snapshot';
import { asCaughtPokemon } from '../auth/caught-record';
import type { EncounterRecord } from '../auth/encounter-record';
import { RaidKind, type RaidRecord, asRaidRecord, deriveRaidReward } from '../auth/raid-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import {
  BOSS_ALLIANCE,
  LEGENDARY_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  SHADOW_RAID_REWARD_LEVEL,
  createRaidBossSnapshot,
} from '../overworld/raid';
import { getAdminFirestore } from './firebase';
import { asNumber, asString, asStringArray, docData } from './read';
import { startEncounter } from './overworld';

/**
 * A stored outcome, restored as the enum the rest of the code
 * compares against
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const asOutcome = (value: unknown): BattleOutcome => asNumber(value) as BattleOutcome;

/**
 * Raids, written with admin credentials. A raid decides who is owed a
 * legendary, so the three writes that settle one — starting it,
 * clearing it, and collecting from it — are checked here rather than
 * reported by whoever fought
 */

/**
 * Bring a party into a lobby. The catch ids are checked against their
 * owners, so a party cannot field pokemon the player does not own,
 * and no catch can be listed twice. Resolves the team id, or null
 * when the party is not a legal one or the raid has started
 */
export async function joinRaid(
  uid: string,
  raidId: string,
  catches: string[],
): Promise<string | null> {
  const db = getAdminFirestore();
  const raid = docData(await db.collection(RAID_COLLECTION).doc(raidId).get());

  if (raid == null || raid.battle != null) {
    return null;
  }
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }
  if (new Set(catches).size !== catches.length) {
    return null;
  }

  const owned = await db.getAll(...catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id)));

  if (!owned.every((entry) => docData(entry)?.owner === uid)) {
    return null;
  }

  const team = db.collection(TEAM_COLLECTION).doc();

  await team.set({ player: uid, catches });
  await db
    .collection(RAID_COLLECTION)
    .doc(raidId)
    .update({ teams: [...asStringArray(raid.teams), team.id] });

  return team.id;
}

/**
 * Freeze one team for the battle, dropping catches that have vanished
 * or changed hands. Resolves the snapshot id, or null when the team
 * fields nothing — an empty side must not stand in a battle
 */
async function publishTeamSnapshot(
  player: string,
  catches: string[],
  alliance: number,
): Promise<string | null> {
  const db = getAdminFirestore();
  const stored =
    catches.length === 0
      ? []
      : await db.getAll(...catches.map((id) => db.collection(CAUGHT_COLLECTION).doc(id)));
  const fielded: CatchSnapshot[] = [];

  for (const entry of stored) {
    const data = docData(entry);

    if (data?.owner === player) {
      fielded.push(createCatchSnapshot(entry.id, asCaughtPokemon(data)));
    }
  }

  if (fielded.length === 0) {
    return null;
  }

  const ref = db.collection(TEAM_SNAPSHOT_COLLECTION).doc();

  await ref.set({ player, alliance, catches: fielded });
  return ref.id;
}

/**
 * Start the raid: every joined team is frozen, the boss gets a
 * snapshot of its own, and the pair of alliances becomes a battle.
 * Only the host may start, and only once — the battle id is written
 * back inside a transaction, so a second start finds it taken
 */
export async function startRaid(uid: string, raidId: string, now: number): Promise<string | null> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(raidId);
  const stored = docData(await raidRef.get());

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.host !== uid || raid.battle != null || raid.teams.length === 0) {
    return null;
  }

  const teams = await db.getAll(...raid.teams.map((id) => db.collection(TEAM_COLLECTION).doc(id)));
  const fielded: [string, string][] = [];

  for (const entry of teams) {
    const team = docData(entry);

    if (team == null) {
      continue;
    }

    const player = asString(team.player);
    const snapshot = await publishTeamSnapshot(
      player,
      asStringArray(team.catches),
      PLAYER_ALLIANCE,
    );

    if (snapshot != null) {
      fielded.push([player, snapshot]);
    }
  }

  if (fielded.length === 0) {
    return null;
  }

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const boss = db.collection(TEAM_SNAPSHOT_COLLECTION).doc();

  await boss.set({
    player: '',
    alliance: BOSS_ALLIANCE,
    catches: [createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow)],
  });

  const battle = db.collection(BATTLE_COLLECTION).doc();

  await battle.set({
    teams: [boss.id, ...fielded.map(([, snapshot]) => snapshot)],
    players: [...new Set(fielded.map(([player]) => player))],
    raid: raidId,
    species: raid.species,
    outcome: BattleOutcome.Unfinished,
    startedAt: now,
  });

  const claimed = await db.runTransaction(async (transaction) => {
    const current = docData(await transaction.get(raidRef));

    if (current == null || current.battle != null) {
      return false;
    }
    transaction.update(raidRef, { battle: battle.id });
    return true;
  });

  if (!claimed) {
    const current = docData(await raidRef.get())?.battle;

    return typeof current === 'string' ? current : null;
  }
  return battle.id;
}

/**
 * Record how a battle ended. Only a player who fielded a team may
 * report it, and only once: an outcome already stamped stands, so the
 * first honest report cannot be overwritten by a later one
 */
export async function finishBattle(
  uid: string,
  battleId: string,
  outcome: BattleOutcome,
): Promise<boolean> {
  const db = getAdminFirestore();
  const ref = db.collection(BATTLE_COLLECTION).doc(battleId);

  return db.runTransaction(async (transaction) => {
    const battle = docData(await transaction.get(ref));

    if (battle == null || !new Set(asStringArray(battle.players)).has(uid)) {
      return false;
    }
    if (asOutcome(battle.outcome) !== BattleOutcome.Unfinished) {
      return false;
    }
    transaction.update(ref, { outcome });
    return true;
  });
}

/**
 * Shut a raid's landmark for the rest of the hour. Only a raid whose
 * battle is recorded as won can be cleared, so a player cannot close
 * a landmark by claiming a victory that never happened
 */
export async function clearRaid(uid: string, raidId: string): Promise<boolean> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(raidId);
  const battleId = docData(await raidRef.get())?.battle;

  if (typeof battleId !== 'string') {
    return false;
  }

  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(battleId).get());

  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !new Set(asStringArray(battle.players)).has(uid)
  ) {
    return false;
  }
  await raidRef.update({ cleared: true });
  return true;
}

/**
 * Collect the legendary a cleared raid owes. The claim marker at
 * raidRewards/{raidId}:{uid} guards it, so the raid pays each fighter
 * once however late they come back for it. The encounter is derived
 * against the raid's own chunk and hour, not wherever the player is
 * standing now
 */
export async function claimRaidReward(
  uid: string,
  raidId: string,
): Promise<EncounterRecord | null> {
  const db = getAdminFirestore();
  const stored = docData(await db.collection(RAID_COLLECTION).doc(raidId).get());

  if (stored == null) {
    return null;
  }

  const raid: RaidRecord = asRaidRecord(stored);

  if (raid.battle == null) {
    return null;
  }

  const battle = docData(await db.collection(BATTLE_COLLECTION).doc(raid.battle).get());

  // Only the players who actually fielded a team are owed anything,
  // and only from a raid that was won
  if (
    battle == null ||
    asOutcome(battle.outcome) !== BattleOutcome.Won ||
    !new Set(asStringArray(battle.players)).has(uid)
  ) {
    return null;
  }

  const ref = db.collection(RAID_REWARD_COLLECTION).doc(`${raidId}:${uid}`);
  const claimed = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).exists) {
      return false;
    }
    transaction.set(ref, { player: uid, raid: raidId });
    return true;
  });

  if (!claimed) {
    return null;
  }

  const chunk = getWorld().getChunk(raid.chunk.x, raid.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp);
  const [spawnId, spawn] = deriveRaidReward(raid, raidId, uid);

  return startEncounter(uid, snapshot, spawnId, spawn, {
    type: EncounterType.Raid,
    shadow: raid.kind === RaidKind.Shadow,
    level: raid.kind === RaidKind.Shadow ? SHADOW_RAID_REWARD_LEVEL : LEGENDARY_RAID_REWARD_LEVEL,
  });
}
