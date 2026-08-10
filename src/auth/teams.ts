import {
  type FirestoreDataConverter,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { asNumber, asString, asStringArray } from './__normalize';
import { type CatchSnapshot, asCatchSnapshot, createCatchSnapshot } from './catch-snapshot';
import { getCaught, getCaughtAbilities, getCaughtItems } from './caught';
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

const TEAM_COLLECTION = 'teams';
const TEAM_SNAPSHOT_COLLECTION = 'teamSnapshots';

const teamConverter: FirestoreDataConverter<TeamRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();

    return { player: asString(data.player), catches: asStringArray(data.catches) };
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
 * Form a team from the player's catches. Resolves the new team id,
 * or null when the party is empty or larger than TEAM_SIZE
 */
export async function createTeam(player: string, catches: string[]): Promise<string | null> {
  if (catches.length === 0 || catches.length > TEAM_SIZE) {
    return null;
  }

  const teams = collection(getFirebaseFirestore(), TEAM_COLLECTION).withConverter(teamConverter);
  const ref = await addDoc(teams, { player, catches });

  return ref.id;
}

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

/**
 * Freeze a team for a battle: every catch is copied as it stands,
 * side stores included. Catches that have since vanished are left
 * out. Resolves the team snapshot id
 */
export async function createTeamSnapshot(team: TeamRecord, alliance: number): Promise<string> {
  const catches = await Promise.all(
    team.catches.map(async (id) => {
      const [caught, abilities, items] = await Promise.all([
        getCaught(id),
        getCaughtAbilities(id),
        getCaughtItems(id),
      ]);

      return caught == null ? null : createCatchSnapshot(id, caught, abilities, items);
    }),
  );

  return publishTeamSnapshot({
    player: team.player,
    alliance,
    catches: catches.filter((entry): entry is CatchSnapshot => entry != null),
  });
}

/**
 * Store an already-built team snapshot — the raid boss' party comes
 * this way, since it has no catches behind it
 */
export async function publishTeamSnapshot(record: TeamSnapshotRecord): Promise<string> {
  const snapshots = collection(getFirebaseFirestore(), TEAM_SNAPSHOT_COLLECTION).withConverter(
    snapshotConverter,
  );
  const ref = await addDoc(snapshots, record);

  return ref.id;
}

export async function getTeamSnapshot(id: string): Promise<TeamSnapshotRecord | null> {
  const ref = doc(getFirebaseFirestore(), TEAM_SNAPSHOT_COLLECTION, id).withConverter(
    snapshotConverter,
  );

  return (await getDoc(ref)).data() ?? null;
}
