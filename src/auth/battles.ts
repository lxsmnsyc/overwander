import {
  type FirestoreDataConverter,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Species } from '../data/ids/species';
import { asNumber, asString, asStringArray } from './__normalize';
import { getFirebaseFirestore } from './firebase';
import { type TeamSnapshotRecord, getTeamSnapshot } from './teams';

/**
 * How a battle ended
 */
export const enum BattleOutcome {
  /**
   * Still being fought, or abandoned before it settled
   */
  Unfinished = 0,
  Won = 1,
  Lost = 2,
}

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
}

const BATTLE_COLLECTION = 'battles';

const converter: FirestoreDataConverter<BattleRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      teams: asStringArray(data.teams),
      players: asStringArray(data.players),
      raid: asString(data.raid),
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      species: asNumber(data.species) as Species,
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      outcome: asNumber(data.outcome) as BattleOutcome,
      startedAt: asNumber(data.startedAt),
    };
  },
};

export async function createBattle(record: BattleRecord): Promise<string> {
  const battles = collection(getFirebaseFirestore(), BATTLE_COLLECTION).withConverter(converter);
  const ref = await addDoc(battles, record);

  return ref.id;
}

export async function getBattle(id: string): Promise<BattleRecord | null> {
  const ref = doc(getFirebaseFirestore(), BATTLE_COLLECTION, id).withConverter(converter);

  return (await getDoc(ref)).data() ?? null;
}

/**
 * Record how a battle ended. Every participant reports it; the
 * outcome they compute is the same, since the fight is deterministic
 */
export async function finishBattle(id: string, outcome: BattleOutcome): Promise<void> {
  await updateDoc(doc(getFirebaseFirestore(), BATTLE_COLLECTION, id), { outcome });
}

/**
 * The player's finished battles, newest first. Unfinished ones stay
 * out of the history — an abandoned fight is not a result
 */
export async function listBattleHistory(player: string): Promise<[string, BattleRecord][]> {
  const battles = collection(getFirebaseFirestore(), BATTLE_COLLECTION).withConverter(converter);
  const result = await getDocs(query(battles, where('players', 'array-contains', player)));

  return result.docs
    .map((entry): [string, BattleRecord] => [entry.id, entry.data()])
    .filter(([, record]) => record.outcome !== BattleOutcome.Unfinished)
    .sort((left, right) => right[1].startedAt - left[1].startedAt);
}

/**
 * The battle's team snapshots, in the order they entered. Snapshots
 * that have gone missing are left out
 */
export async function listBattleTeams(record: BattleRecord): Promise<TeamSnapshotRecord[]> {
  const teams = await Promise.all(record.teams.map(getTeamSnapshot));

  return teams.filter((team) => team != null);
}
