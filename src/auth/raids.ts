// Firestore returns untyped documents; the converter below restores
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { User } from 'firebase/auth';
import {
  type DocumentReference,
  type FirestoreDataConverter,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import AleaRNG from '../core/alea';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import { createRaidBossSnapshot } from '../overworld/raid';
import { asNumber, asRecord, asString, asStringArray } from './__normalize';
import { BattleOutcome, createBattle } from './battles';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';
import { createTeam, createTeamSnapshot, getTeam, publishTeamSnapshot } from './teams';

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
 * The alliance the raid boss fights under; every player team shares
 * the other one, so the whole lobby is allied against it
 */
export const BOSS_ALLIANCE = 0;
export const PLAYER_ALLIANCE = 1;

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
 * Walk into a raid landmark: the first player to arrive in the hour
 * opens the lobby and hosts it, everyone after joins the one already
 * standing. Resolves the lobby id and its record, or null when the
 * cell stages no raid this hour
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
  const ref = getRaidRef(id);
  const existing = (await getDoc(ref)).data();

  if (existing != null) {
    // A cleared lobby stays shut until the hour turns over and the
    // landmark rolls a new raid
    return existing.cleared ? null : [id, existing];
  }

  const record: RaidRecord = {
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

  await setDoc(ref, record);
  return [id, record];
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
 * has already started or the party is not a legal team
 */
export async function joinRaid(user: User, id: string, catches: string[]): Promise<string | null> {
  const raid = await getRaid(id);

  if (raid == null || raid.battle != null) {
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
export function deriveRaidReward(id: string, uid: string, species: Species): [string, Spawn] {
  const rng = new AleaRNG(`${id}reward${uid}`);

  return [`${id}$reward`, [species, rng.int32(), rng.int32()]];
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

  const teams = (await Promise.all(raid.teams.map(getTeam))).filter((team) => team != null);
  const snapshots = await Promise.all(
    teams.map(async (team) => createTeamSnapshot(team, PLAYER_ALLIANCE)),
  );

  if (snapshots.length === 0) {
    return null;
  }

  // The boss stands alone: one perfect-IV catch snapshot, no owner
  const boss = await publishTeamSnapshot({
    player: '',
    alliance: BOSS_ALLIANCE,
    catches: [createRaidBossSnapshot(raid.species, raid.traitValue, raid.kind === RaidKind.Shadow)],
  });
  const battle = await createBattle({
    teams: [boss, ...snapshots],
    players: [...new Set(teams.map((team) => team.player))],
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
