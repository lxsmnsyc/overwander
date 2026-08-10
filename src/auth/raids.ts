// Firestore returns untyped documents; the converter below restores
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import {
  type DocumentReference,
  type FirestoreDataConverter,
  type Unsubscribe,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { asString } from './__normalize';
import { RaidKind, type RaidRecord, asRaidRecord } from './raid-record';
import { hasAnyCaught } from './caught';
import { requireUid } from '../server/firebase';
import type { RaidReward } from '../server/raids';
import {
  claimRaidReward as claimRewardOnServerSide,
  clearRaid as clearOnServer,
  enterRaid as enterOnServer,
  joinRaid as joinOnServer,
  leaveRaid as leaveOnServer,
  startRaid as startOnServer,
} from '../server/raids';
import { RAID_COLLECTION, RAID_REWARD_COLLECTION } from './collections';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';
import getIdToken from './session';

export { RaidKind, asRaidRecord, deriveRaidReward, raidId } from './raid-record';
export type { RaidRecord } from './raid-record';

/**
 * The alliance numbers live with the battle builder that reads them
 */
export { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../overworld/raid';

const converter: FirestoreDataConverter<RaidRecord> = {
  toFirestore: (record) => record,
  fromFirestore: (snapshot) => asRaidRecord(snapshot.data()),
};

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
 * Walk into a raid landmark. What is staged there — and whether it is
 * open, being fought, or shut for the hour — is decided by the
 * server against the chunk's own seed and its clock, so an arrival
 * cannot conjure a lobby on a cell the world staged nothing on.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this hour, its raid has been cleared, or the player owns no
 * pokemon and there is nothing standing to watch
 */
export async function enterRaid(
  snapshot: ChunkSnapshot,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): Promise<[string, RaidRecord] | null> {
  return enterRaidOnServer(await getIdToken(), snapshot.chunk.x, snapshot.chunk.y, cell, kind);
}

async function enterRaidOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
): Promise<[string, RaidRecord] | null> {
  'use server';
  return enterOnServer(await requireUid(token), x, y, cell, kind, await syncServerClock());
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
 * raid they left does not start with their party in it. The server
 * pulls only the teams that name them as owner, and leaves a started
 * raid alone — it is already frozen into snapshots
 */
export async function leaveRaid(id: string): Promise<void> {
  await leaveRaidOnServer(await getIdToken(), id);
}

async function leaveRaidOnServer(token: string, id: string): Promise<void> {
  'use server';
  await leaveOnServer(await requireUid(token), id);
}

/**
 * Mark the raid cleared, shutting its landmark for the rest of the
 * hour. Every player who fought reports it; the server clears it only
 * once the battle is recorded as won by a player who was in it, so a
 * landmark cannot be shut with a victory that never happened
 */
export async function clearRaid(id: string): Promise<boolean> {
  return clearRaidOnServer(await getIdToken(), id);
}

async function clearRaidOnServer(token: string, id: string): Promise<boolean> {
  'use server';
  return clearOnServer(await requireUid(token), id);
}

/**
 * Bring a party into the lobby. The team is stored on its own and
 * its id appended to the raid, so two players joining at once cannot
 * overwrite each other. Resolves the team id, or null when the raid
 * has already started, the player owns no pokemon to field, or the
 * party is not a legal team
 */
export async function joinRaid(id: string, catches: string[]): Promise<string | null> {
  return joinRaidOnServer(await getIdToken(), id, catches);
}

async function joinRaidOnServer(
  token: string,
  id: string,
  catches: string[],
): Promise<string | null> {
  'use server';
  return joinOnServer(await requireUid(token), id, catches);
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
export async function claimRaidReward(id: string): Promise<RaidReward | null> {
  return claimRewardOnServer(await getIdToken(), id);
}

async function claimRewardOnServer(token: string, id: string): Promise<RaidReward | null> {
  'use server';
  return claimRewardOnServerSide(await requireUid(token), id);
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
export async function startRaid(id: string): Promise<string | null> {
  return startRaidOnServer(await getIdToken(), id);
}

async function startRaidOnServer(token: string, id: string): Promise<string | null> {
  'use server';
  return startOnServer(await requireUid(token), id, await syncServerClock());
}
