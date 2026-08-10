import {
  type FirestoreDataConverter,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { asNumber, asString, asStringArray } from './__normalize';
import { type CatchSnapshot, asCatchSnapshot } from './catch-snapshot';
import { TEAM_COLLECTION, TEAM_SNAPSHOT_COLLECTION } from './collections';
import { getFirebaseFirestore } from './firebase';

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

const teamConverter: FirestoreDataConverter<TeamRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return {
      player: asString(data.player),
      raid: asString(data.raid),
      catches: asStringArray(data.catches),
    };
  },
};

const snapshotConverter: FirestoreDataConverter<TeamSnapshotRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    const catches: unknown = data.catches;

    return {
      player: asString(data.player),
      alliance: asNumber(data.alliance),
      catches: Array.isArray(catches) ? catches.map(asCatchSnapshot) : [],
    };
  },
};

/**
 * Teams are written by the server: a party names catch ids, and the
 * ids of other players' pokemon are readable, so the ownership check
 * has to happen somewhere a client cannot skip. Forming one goes
 * through `joinRaid`, and freezing one into a battle happens when the
 * host starts the raid — both in
 * [`src/server/raids.ts`](../server/raids.ts)
 */

export async function getTeam(id: string): Promise<TeamRecord | null> {
  const ref = doc(getFirebaseFirestore(), TEAM_COLLECTION, id).withConverter(teamConverter);

  return (await getDoc(ref)).data() ?? null;
}

/**
 * Every team the player has formed
 */
export async function listTeams(player: string): Promise<[string, TeamRecord][]> {
  const teams = collection(getFirebaseFirestore(), TEAM_COLLECTION).withConverter(teamConverter);
  const result = await getDocs(query(teams, where('player', '==', player)));

  return result.docs.map((entry) => [entry.id, entry.data()]);
}

export async function getTeamSnapshot(id: string): Promise<TeamSnapshotRecord | null> {
  const ref = doc(getFirebaseFirestore(), TEAM_SNAPSHOT_COLLECTION, id).withConverter(
    snapshotConverter,
  );

  return (await getDoc(ref)).data() ?? null;
}
