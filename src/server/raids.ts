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
import {
  RaidKind,
  type RaidRecord,
  asRaidRecord,
  deriveRaidReward,
  raidId,
} from '../auth/raid-record';
import { TEAM_SIZE } from '../auth/teams';
import ChunkSnapshot from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { EncounterType } from '../overworld/encounter';
import {
  BOSS_ALLIANCE,
  LEGENDARY_RAID_GOLD,
  LEGENDARY_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  SHADOW_RAID_GOLD,
  SHADOW_RAID_REWARD_LEVEL,
  createRaidBossSnapshot,
} from '../overworld/raid';
import { getAdminFirestore } from './firebase';
import { asNumber, asString, asStringArray, docData } from './read';
import { hasAnyCaught } from './caught';
import { startEncounter } from './overworld';
import { grantGold } from './profile';

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
 * How long an unsettled raid battle holds its landmark. A fight is
 * over in minutes; one still unfinished after this was walked out on,
 * and an abandoned party is not a beaten boss
 */
export const RAID_BATTLE_TIMEOUT = 10 * 60 * 1000;

/**
 * Whether a raid's battle ended without the boss going down — lost
 * outright, or abandoned long enough that nobody is coming back to
 * settle it. A raid that was won never reaches here: clearing it
 * shuts the landmark first
 */
async function isRaidLost(
  transaction: FirebaseFirestore.Transaction,
  battleId: string,
  now: number,
): Promise<boolean> {
  const battle = docData(
    await transaction.get(getAdminFirestore().collection(BATTLE_COLLECTION).doc(battleId)),
  );

  if (battle == null) {
    return true;
  }
  if (asOutcome(battle.outcome) === BattleOutcome.Unfinished) {
    return now - asNumber(battle.startedAt) >= RAID_BATTLE_TIMEOUT;
  }
  return asOutcome(battle.outcome) !== BattleOutcome.Won;
}

/**
 * Walk into a raid landmark. The lobby id is derived from the chunk,
 * the raid hour, the cell and the kind, and the roll behind it comes
 * from the chunk's own seed against the server's clock — so what is
 * staged there is what the world staged, not what the caller says.
 *
 * The first arrival of the hour opens the lobby and hosts it, and
 * everyone after adopts what is already standing. The hour gives the
 * boss one defeat, not one fight: a raid the party lost — or walked
 * out on — leaves the landmark open for the next arrival to restage
 * against the same roll. Only beating the boss shuts the cell.
 *
 * A player with no pokemon of their own stages nothing; they take
 * whatever lobby is standing, as a spectator.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this hour, its raid has been cleared, or there is nothing
 * standing for a spectator to watch
 */
export async function enterRaid(
  uid: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  now: number,
): Promise<[string, RaidRecord] | null> {
  const chunk = getWorld().getChunk(x, y);
  const snapshot = new ChunkSnapshot(chunk, now);
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowRaids().get(cell)
      : snapshot.getLegendaryRaids().get(cell);

  if (roll == null) {
    return null;
  }

  const db = getAdminFirestore();
  const id = raidId(chunk, snapshot.raidTimestamp, cell, kind);
  const staging = await hasAnyCaught(uid);

  // One landmark stages one raid at a time: the read and the create
  // share a transaction, so two players walking in together cannot
  // each open their own
  return db.runTransaction(async (transaction) => {
    const ref = db.collection(RAID_COLLECTION).doc(id);
    const stored = docData(await transaction.get(ref));
    const existing = stored == null ? null : asRaidRecord(stored);

    const fresh: RaidRecord = {
      kind,
      species: roll.species,
      traitValue: roll.traitValue,
      host: uid,
      teams: [],
      battle: null,
      timestamp: snapshot.raidTimestamp,
      chunk: { seed: chunk.seed, x: chunk.x, y: chunk.y },
      cell,
      cleared: false,
    };

    if (existing != null) {
      // A cleared lobby stays shut until the hour turns over and the
      // landmark rolls a new raid: the boss has been met
      if (existing.cleared) {
        return null;
      }
      // A raid still gathering, or one being fought right now, is
      // what the arrival walks into
      if (existing.battle == null || !(await isRaidLost(transaction, existing.battle, now))) {
        return [id, existing];
      }
      // The boss survived, so the landmark is open again. A spectator
      // restages nothing and watches the fight that failed
      if (!staging) {
        return [id, existing];
      }
      transaction.set(ref, fresh);
      return [id, fresh];
    }

    if (!staging) {
      return null;
    }
    transaction.set(ref, fresh);
    return [id, fresh];
  });
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. Only their
 * own teams are pulled — the team documents name their owner — and a
 * started raid is already frozen into snapshots, so it is left alone
 */
export async function leaveRaid(uid: string, lobby: string): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(RAID_COLLECTION).doc(lobby);

  await db.runTransaction(async (transaction) => {
    const raid = docData(await transaction.get(ref));

    if (raid == null || raid.battle != null) {
      return;
    }

    const ids = asStringArray(raid.teams);

    if (ids.length === 0) {
      return;
    }

    const teams = await transaction.getAll(
      ...ids.map((id) => db.collection(TEAM_COLLECTION).doc(id)),
    );
    const mine = new Set(
      teams.filter((entry) => docData(entry)?.player === uid).map((entry) => entry.id),
    );

    if (mine.size === 0) {
      return;
    }
    transaction.update(ref, { teams: ids.filter((id) => !mine.has(id)) });
  });
}

/**
 * Bring a party into a lobby. The catch ids are checked against their
 * owners, so a party cannot field pokemon the player does not own,
 * and no catch can be listed twice. Resolves the team id, or null
 * when the party is not a legal one or the raid has started
 */
export async function joinRaid(
  uid: string,
  lobby: string,
  catches: string[],
): Promise<string | null> {
  const db = getAdminFirestore();
  const raid = docData(await db.collection(RAID_COLLECTION).doc(lobby).get());

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
    .doc(lobby)
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
export async function startRaid(uid: string, lobby: string, now: number): Promise<string | null> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(lobby);
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
    raid: lobby,
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
export async function clearRaid(uid: string, lobby: string): Promise<boolean> {
  const db = getAdminFirestore();
  const raidRef = db.collection(RAID_COLLECTION).doc(lobby);
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
 * What a cleared raid owes one fighter: the legendary waiting for
 * them, and the purse that came with it
 */
export interface RaidReward {
  encounter: EncounterRecord;
  gold: number;
}

/**
 * Collect what a cleared raid owes. The claim marker at
 * raidRewards/{raidId}:{uid} guards it, so the raid pays each fighter
 * once however late they come back for it — the gold and the pokemon
 * ride the same marker, so neither can be collected twice. The
 * encounter is derived against the raid's own chunk and hour, not
 * wherever the player is standing now
 */
export async function claimRaidReward(uid: string, lobby: string): Promise<RaidReward | null> {
  const db = getAdminFirestore();
  const stored = docData(await db.collection(RAID_COLLECTION).doc(lobby).get());

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

  const shadow = raid.kind === RaidKind.Shadow;
  const gold = shadow ? SHADOW_RAID_GOLD : LEGENDARY_RAID_GOLD;
  const ref = db.collection(RAID_REWARD_COLLECTION).doc(`${lobby}:${uid}`);
  const claimed = await db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).exists) {
      return false;
    }
    transaction.set(ref, { player: uid, raid: lobby, gold });
    return true;
  });

  if (!claimed) {
    return null;
  }
  await grantGold(uid, gold);

  const chunk = getWorld().getChunk(raid.chunk.x, raid.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp);
  const [spawnId, spawn] = deriveRaidReward(raid, lobby, uid);
  const encounter = await startEncounter(uid, snapshot, spawnId, spawn, {
    type: EncounterType.Raid,
    shadow,
    level: shadow ? SHADOW_RAID_REWARD_LEVEL : LEGENDARY_RAID_REWARD_LEVEL,
  });

  return { encounter, gold };
}
