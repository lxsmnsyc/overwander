// Firestore returns untyped documents; the converter below restores
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { User } from 'firebase/auth';
import {
  type DocumentReference,
  type FirestoreDataConverter,
  type Transaction,
  type Unsubscribe,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import AleaRNG from '../core/alea';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import type { Encounter } from '../overworld/encounter';
import { EncounterType } from '../overworld/encounter';
import {
  BOSS_ALLIANCE,
  LEGENDARY_RAID_REWARD_LEVEL,
  PLAYER_ALLIANCE,
  SHADOW_RAID_REWARD_LEVEL,
  createRaidBossSnapshot,
} from '../overworld/raid';
import { asNumber, asRecord, asString, asStringArray } from './__normalize';
import { BattleOutcome, createBattle, getBattle, getBattleRef } from './battles';
import { hasAnyCaught } from './caught';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';
import { startEncounter } from './snapshots';
import {
  type TeamRecord,
  createTeam,
  createTeamSnapshot,
  getTeam,
  publishTeamSnapshot,
} from './teams';

/**
 * What a lobby is staging
 */
export const enum RaidKind {
  /**
   * The biome's legendary, from a LegendaryRaid landmark
   */
  Legendary = 0,
  /**
   * A shadow boss — usually one of the biome's rare species, one
   * draw in eight a legendary
   */
  Shadow = 1,
}

/**
 * One raid lobby at raids/{raidId}. The id is derived from the chunk,
 * the raid hour, the landmark cell and the kind, so every player who
 * walks into the same lobby in the same hour joins one raid
 */
export interface RaidRecord {
  kind: RaidKind;
  species: Species;
  /**
   * The 32-bit roll the boss' nature and ability derive from
   */
  traitValue: number;
  /**
   * The player who opened the lobby; only they may start it
   */
  host: string;
  /**
   * teams/{teamId} ids that have joined, host first
   */
  teams: string[];
  /**
   * The battles/{battleId} the host started, or null while the lobby
   * is still gathering
   */
  battle: string | null;
  /**
   * The raid hour this lobby belongs to; a listing of live raids
   * matches on it, and the landmark reopens when the hour turns over
   */
  timestamp: number;
  /**
   * Where the lobby stands, for a listing that has no chunk in hand
   */
  chunk: { seed: string; x: number; y: number };
  cell: number;
  /**
   * Set once the boss goes down. A cleared raid keeps its landmark
   * shut for the rest of the hour — the legendary has been met
   */
  cleared: boolean;
}

const RAID_COLLECTION = 'raids';

/**
 * One marker per player per cleared raid, so the legendary is
 * handed over once however late it is collected
 */
const RAID_REWARD_COLLECTION = 'raidRewards';

/**
 * The alliance numbers live with the battle builder that reads them
 */
export { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../overworld/raid';

const converter: FirestoreDataConverter<RaidRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    const chunk = asRecord(data.chunk);

    return {
      kind: asNumber(data.kind) as RaidKind,
      species: asNumber(data.species) as Species,
      traitValue: asNumber(data.traitValue),
      host: asString(data.host),
      teams: asStringArray(data.teams),
      battle: typeof data.battle === 'string' ? data.battle : null,
      timestamp: asNumber(data.timestamp),
      chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
      cell: asNumber(data.cell),
      cleared: data.cleared === true,
    };
  },
};

/**
 * The lobby id of a raid landmark in a given raid hour. The kind is
 * part of it, so the two landmark types never collide on a cell
 */
export function raidId(
  chunk: Chunk,
  raidTimestamp: number,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): string {
  const tag = kind === RaidKind.Shadow ? 'shadow' : 'raid';

  return `${chunk.seed}@${raidTimestamp}$${tag}${cell}`;
}

function getRaidRef(id: string): DocumentReference<RaidRecord> {
  return doc(getFirebaseFirestore(), RAID_COLLECTION, id).withConverter(converter);
}

export async function getRaid(id: string): Promise<RaidRecord | null> {
  return (await getDoc(getRaidRef(id))).data() ?? null;
}

/**
 * Follow a lobby: teams join and leave it, and the host's start
 * writes the battle id everyone else is waiting on
 */
export function watchRaid(id: string, onChange: (raid: RaidRecord | null) => void): Unsubscribe {
  return onSnapshot(getRaidRef(id), (snapshot) => {
    onChange(snapshot.data() ?? null);
  });
}

/**
 * Follow the hour's live lobbies, so a raid opened or started
 * elsewhere appears and disappears on its own
 */
export function watchLiveRaids(
  raidTimestamp: number,
  onChange: (raids: [string, RaidRecord][]) => void,
): Unsubscribe {
  const raids = collection(getFirebaseFirestore(), RAID_COLLECTION).withConverter(converter);

  return onSnapshot(query(raids, where('timestamp', '==', raidTimestamp)), (result) => {
    onChange(
      result.docs
        .map((entry): [string, RaidRecord] => [entry.id, entry.data()])
        .filter(([, raid]) => raid.battle == null && !raid.cleared),
    );
  });
}

/**
 * Whether the player may bring a party into a raid at all. A raid is
 * fought with pokemon of one's own, so a player who owns none has
 * nothing to field: they may watch a raid, and nothing more. Hosting
 * counts as taking part — an empty lobby nobody can start is worse
 * than no lobby
 */
export async function canJoinRaids(uid: string): Promise<boolean> {
  return hasAnyCaught(uid);
}

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
  transaction: Transaction,
  battleId: string,
  now: number,
): Promise<boolean> {
  const battle = (await transaction.get(getBattleRef(battleId))).data();

  if (battle == null) {
    return true;
  }
  if (battle.outcome === BattleOutcome.Unfinished) {
    return now - battle.startedAt >= RAID_BATTLE_TIMEOUT;
  }
  return battle.outcome !== BattleOutcome.Won;
}

/**
 * Walk into a raid landmark: the first player to arrive in the hour
 * opens the lobby and hosts it, everyone after joins the one already
 * standing.
 *
 * The hour gives the boss one defeat, not one fight. A raid the party
 * lost — or walked out on — leaves the landmark open, and the next
 * arrival restages the lobby against the same roll to try again. Only
 * beating the boss shuts the cell, for the rest of the hour.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this hour or its raid has already been cleared
 */
export async function enterRaid(
  user: User,
  snapshot: ChunkSnapshot,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): Promise<[string, RaidRecord] | null> {
  const roll =
    kind === RaidKind.Shadow
      ? snapshot.getShadowRaids().get(cell)
      : snapshot.getLegendaryRaids().get(cell);

  if (roll == null) {
    return null;
  }

  const id = raidId(snapshot.chunk, snapshot.raidTimestamp, cell, kind);
  const db = getFirebaseFirestore();

  // A failed raid reopens against the same clock the battle was
  // stamped with, so an abandoned fight cannot hold the landmark
  const now = await syncServerClock();
  // A player with no pokemon of their own stages nothing: they take
  // whatever lobby is already standing, as a spectator
  const staging = await canJoinRaids(user.uid);

  // One landmark stages one raid at a time: the arrival that finds no
  // lobby opens it and hosts, and every arrival after adopts what is
  // already standing. The read and the create share a transaction,
  // so two players walking in together cannot each open their own
  return runTransaction(db, async (transaction) => {
    const ref = getRaidRef(id);
    const existing = (await transaction.get(ref)).data();

    const fresh: RaidRecord = {
      kind,
      species: roll.species,
      traitValue: roll.traitValue,
      host: user.uid,
      teams: [],
      battle: null,
      timestamp: snapshot.raidTimestamp,
      chunk: { seed: snapshot.chunk.seed, x: snapshot.chunk.x, y: snapshot.chunk.y },
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
        return [id, existing] as [string, RaidRecord];
      }
      // The boss survived, so the landmark is open again: the lobby
      // is restaged for the arrival, on the hour's same roll. A
      // spectator restages nothing and watches the fight that failed
      if (!staging) {
        return [id, existing] as [string, RaidRecord];
      }
      transaction.set(ref, fresh);
      return [id, fresh] as [string, RaidRecord];
    }

    if (!staging) {
      return null;
    }
    transaction.set(ref, fresh);
    return [id, fresh] as [string, RaidRecord];
  });
}

/**
 * Every lobby still gathering in the current raid hour: started and
 * cleared raids drop out, and a lobby from a past hour is dead
 */
export async function listLiveRaids(raidTimestamp: number): Promise<[string, RaidRecord][]> {
  const raids = collection(getFirebaseFirestore(), RAID_COLLECTION).withConverter(converter);
  const result = await getDocs(query(raids, where('timestamp', '==', raidTimestamp)));

  return result.docs
    .map((entry): [string, RaidRecord] => [entry.id, entry.data()])
    .filter(([, raid]) => raid.battle == null && !raid.cleared);
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. A started
 * raid is already frozen into snapshots and is left alone
 */
export async function leaveRaid(user: User, id: string): Promise<void> {
  const raid = await getRaid(id);

  if (raid == null || raid.battle != null) {
    return;
  }

  const teams = await Promise.all(
    raid.teams.map(async (teamId) => [teamId, await getTeam(teamId)] as const),
  );
  const mine = teams.filter(([, team]) => team?.player === user.uid).map(([teamId]) => teamId);

  if (mine.length === 0) {
    return;
  }
  await updateDoc(doc(getFirebaseFirestore(), RAID_COLLECTION, id), {
    teams: arrayRemove(...mine),
  });
}

/**
 * Mark the raid cleared, shutting its landmark for the rest of the
 * hour. Every player who fought reports it; the first write wins and
 * the rest are harmless repeats
 */
export async function clearRaid(id: string): Promise<void> {
  await updateDoc(doc(getFirebaseFirestore(), RAID_COLLECTION, id), { cleared: true });
}

/**
 * Bring a party into the lobby. The team is stored on its own and
 * its id appended to the raid, so two players joining at once cannot
 * overwrite each other. Resolves the team id, or null when the raid
 * has already started, the player owns no pokemon to field, or the
 * party is not a legal team
 */
export async function joinRaid(user: User, id: string, catches: string[]): Promise<string | null> {
  const raid = await getRaid(id);

  if (raid == null || raid.battle != null || !(await canJoinRaids(user.uid))) {
    return null;
  }

  const teamId = await createTeam(user.uid, catches);

  if (teamId == null) {
    return null;
  }
  await updateDoc(doc(getFirebaseFirestore(), RAID_COLLECTION, id), { teams: arrayUnion(teamId) });
  return teamId;
}

/**
 * The reward for clearing a raid: the legendary as a meetable spawn.
 * The chunk, biome and window are the raid's, but the two rolls are
 * seeded per player, so everyone in the lobby meets their own
 * individual — different IVs, different traits, its own shiny odds
 */
export function deriveRaidReward(raid: RaidRecord, id: string, uid: string): [string, Spawn] {
  // The raid's own seed material — the lobby it was staged in and the
  // trait value it rolled — mixed with the player, so every fighter
  // walks away with their own individual of the same legendary
  const rng = new AleaRNG(`${id}:${raid.traitValue}:reward:${uid}`);

  return [`${id}$reward`, [raid.species, rng.int32(), rng.int32()]];
}

/**
 * Collect the legendary a cleared raid owes the player. The reward
 * waits rather than expiring: a player who ran from the encounter,
 * closed the tab or left the battle early claims it later from their
 * battle history. A claim marker at raidRewards/{raidId}:{uid}
 * guards it, so the raid pays each fighter once.
 *
 * The encounter is derived from the raid's own chunk and hour, not
 * from wherever the player is standing now, so a late claim meets
 * exactly what the raid staged. Resolves null when the raid was not
 * won by this player, or when they already claimed it
 */
export async function claimRaidReward(user: User, id: string): Promise<Encounter | null> {
  const raid = await getRaid(id);

  if (raid?.battle == null) {
    return null;
  }

  const battle = await getBattle(raid.battle);

  // Only the players who actually fielded a team are owed anything,
  // and only from a raid that was won
  if (
    battle == null ||
    battle.outcome !== BattleOutcome.Won ||
    !battle.players.includes(user.uid)
  ) {
    return null;
  }

  const db = getFirebaseFirestore();
  const ref = doc(db, RAID_REWARD_COLLECTION, `${id}:${user.uid}`);
  const claimed = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);

    if (existing.exists()) {
      return false;
    }
    transaction.set(ref, { player: user.uid, raid: id });
    return true;
  });

  if (!claimed) {
    return null;
  }

  const chunk = getWorld().getChunk(raid.chunk.x, raid.chunk.y);
  const snapshot = new ChunkSnapshot(chunk, raid.timestamp);
  // startEncounter keys the stored encounter by the player already,
  // so the spawn id stays the raid's own
  const [spawnId, spawn] = deriveRaidReward(raid, id, user.uid);

  return startEncounter(user, snapshot, spawnId, spawn, {
    type: EncounterType.Raid,
    shadow: raid.kind === RaidKind.Shadow,
    level: raid.kind === RaidKind.Shadow ? SHADOW_RAID_REWARD_LEVEL : LEGENDARY_RAID_REWARD_LEVEL,
  });
}

/**
 * The raids this player has already collected from
 */
export async function listClaimedRaids(uid: string): Promise<Set<string>> {
  const claims = collection(getFirebaseFirestore(), RAID_REWARD_COLLECTION);
  const result = await getDocs(query(claims, where('player', '==', uid)));

  return new Set(result.docs.map((entry) => asString(entry.data().raid)));
}

/**
 * Start the raid: every joined team is frozen into a team snapshot,
 * the boss gets one of its own, and the pair of alliances becomes a
 * battle record. Only the host may start, and only once — the battle
 * id is written back to the lobby inside a transaction, so a second
 * start finds it taken. Resolves the battle id, or null when the
 * caller is not the host, the raid already started, or nobody joined
 */
export async function startRaid(user: User, id: string): Promise<string | null> {
  const raid = await getRaid(id);

  if (raid == null || raid.host !== user.uid || raid.battle != null || raid.teams.length === 0) {
    return null;
  }

  const teams = (await Promise.all(raid.teams.map(getTeam))).filter(
    (team): team is TeamRecord => team != null,
  );
  // A team that fields nothing — every catch traded away, or a party
  // written straight to the store naming pokemon its player does not
  // own — drops out here, and its player is not counted among the
  // fighters
  const fielded = (
    await Promise.all(
      teams.map(async (team) => {
        const snapshot = await createTeamSnapshot(team, PLAYER_ALLIANCE);

        return snapshot == null ? null : ([team, snapshot] as [TeamRecord, string]);
      }),
    )
  ).filter((entry): entry is [TeamRecord, string] => entry != null);

  if (fielded.length === 0) {
    return null;
  }
  const snapshots = fielded.map(([, snapshot]) => snapshot);

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const boss = await publishTeamSnapshot({
    player: '',
    alliance: BOSS_ALLIANCE,
    catches: [createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow)],
  });
  const battle = await createBattle({
    teams: [boss, ...snapshots],
    players: [...new Set(fielded.map(([team]) => team.player))],
    raid: id,
    species: raid.species,
    outcome: BattleOutcome.Unfinished,
    startedAt: await syncServerClock(),
  });
  const db = getFirebaseFirestore();
  const claimed = await runTransaction(db, async (transaction) => {
    const ref = getRaidRef(id);
    const current = (await transaction.get(ref)).data();

    if (current == null || current.battle != null) {
      return false;
    }
    transaction.set(ref, { ...current, battle });
    return true;
  });

  if (!claimed) {
    return (await getRaid(id))?.battle ?? null;
  }
  return battle;
}
