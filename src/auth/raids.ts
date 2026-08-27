// Rows arrive untyped; the converter below restores const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Items } from '../data/ids/items';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import { RaidKind, type RaidRecord, type RaidView, asRaidRecord } from './raid-record';
import { hasAnyCaught } from './caught';
import { LobbyRole } from './lobby-role';
import { requireUid } from '../server/auth';
import type { RaidReward } from '../server/raids';
import {
  claimRaidReward as claimRewardOnServerSide,
  clearRaid as clearOnServer,
  declineRaidInvite as declineInviteOnServer,
  enterRaid as enterOnServer,
  hostMythicalRaid as hostMythicalOnServerSide,
  inviteToRaid as inviteOnServer,
  joinRaid as joinOnServer,
  leaveRaid as leaveOnServer,
  peekRaid as peekOnServer,
  startRaid as startOnServer,
  watchRaidLobby as watchLobbyOnServer,
} from '../server/raids';
import { syncServerClock } from './clock';
import { asOffset } from './local-time';
import getSupabase, { type Unwatch, watchRow, watchTable } from './supabase';
import getIdToken from './session';

export {
  RAID_PLAYER_LIMIT,
  RaidAction,
  RaidKind,
  asRaidRecord,
  deriveRaidReward,
  getRaidTitle,
  raidId,
} from './raid-record';
export type { RaidRecord, RaidView } from './raid-record';

/**
 * The alliance numbers live with the battle builder that reads them
 */
export { BOSS_ALLIANCE, PLAYER_ALLIANCE } from '../overworld/raid';

const RAID_TABLE = 'raids';

const RAID_EMBED = '*, teams(id, joined_seq)';

/** One raid row plus its team list, in the record shape */
function fromRaidRow(row: Record<string, unknown>): RaidRecord {
  const teams = asRecordArray(row.teams).sort(
    (left, right) => Number(left.joined_seq ?? 0) - Number(right.joined_seq ?? 0),
  );

  return asRaidRecord({
    kind: row.kind,
    lair: row.lair,
    species: row.species,
    traitValue: row.trait_value,
    host: row.host,
    teams: teams.map((entry) => String(entry.id)),
    battle: row.battle_id,
    timestamp: row.window_at,
    offset: row.utc_offset,
    chunk: { seed: row.chunk_seed, x: row.chunk_x, y: row.chunk_y },
    biome: row.biome,
    cell: row.cell,
    cleared: row.cleared,
  });
}

export async function getRaid(id: string): Promise<RaidRecord | null> {
  const { data }: { data: unknown } = await getSupabase()
    .from(RAID_TABLE)
    .select(RAID_EMBED)
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : fromRaidRow(asRecord(data));
}

/**
 * Follow a lobby: teams join and leave it, and the host's start
 * writes the battle id everyone else is waiting on
 */
export function watchRaid(id: string, onChange: (raid: RaidRecord | null) => void): Unwatch {
  // The teams table pings too: a join is an INSERT there, not an
  // UPDATE of the lobby row, and the lobby view is both together
  const unwatchRow = watchRow(RAID_TABLE, `id=eq.${id}`, async () => getRaid(id), onChange);
  const unwatchTeams = watchTable('teams', [`raid_id=eq.${id}`], async () => getRaid(id), onChange);

  return () => {
    unwatchRow();
    unwatchTeams();
  };
}

/**
 * Follow the window's live lobbies, so a raid opened or started
 * elsewhere appears and disappears on its own
 */
export function watchLiveRaids(
  raidTimestamp: number,
  offset: number,
  onChange: (raids: [string, RaidRecord][]) => void,
): Unwatch {
  // Unfiltered on purpose: a lobby starting or clearing leaves the
  // set by UPDATE, which the set's own filter would never deliver
  return watchTable(RAID_TABLE, [], async () => listLiveRaids(raidTimestamp, offset), onChange);
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
 * Look at a lair before doing anything about it. Nothing is written:
 * what comes back is what is standing there and the one thing this
 * player may do about it — host, join, or watch — so the dialog can
 * offer that and only that.
 *
 * Resolves null when the cell stages no raid this window, its raid has
 * been cleared, or there is nothing standing and the player has no
 * pokemon to stage one with
 */
export async function peekRaid(
  snapshot: ChunkSnapshot,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): Promise<RaidView | null> {
  return peekRaidOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    kind,
    snapshot.offset,
  );
}

async function peekRaidOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  offset: number,
): Promise<RaidView | null> {
  'use server';
  return peekOnServer(await requireUid(token), x, y, cell, kind, await syncServerClock(), offset);
}

/**
 * Walk into a raid landmark. What is staged there — and whether it is
 * open, being fought, or shut for the window — is decided by the
 * server against the chunk's own seed and its clock, so an arrival
 * cannot conjure a lobby on a cell the world staged nothing on.
 *
 * Resolves the lobby id and its record, or null when the cell stages
 * no raid this window, its raid has been cleared, or the player owns no
 * pokemon and there is nothing standing to watch
 */
export async function enterRaid(
  snapshot: ChunkSnapshot,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
): Promise<[string, RaidRecord] | null> {
  return enterRaidOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    kind,
    snapshot.offset,
  );
}

async function enterRaidOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  'use server';
  return enterOnServer(await requireUid(token), x, y, cell, kind, await syncServerClock(), offset);
}

/**
 * Open a mythical raid with a raid item, where the player is
 * standing. The relic is spent in the calling — a mythical raid is
 * fought once, won or lost — so the server checks that it is carried
 * and takes it before the lobby exists.
 *
 * Resolves the lobby id and its record, or null when the item calls
 * nothing, is not carried, the player owns no pokemon to field, or
 * the relic has already been spent on this window's lobby
 */
export async function hostMythicalRaid(
  snapshot: ChunkSnapshot,
  item: Items,
): Promise<[string, RaidRecord] | null> {
  return hostMythicalOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    item,
    snapshot.offset,
  );
}

async function hostMythicalOnServer(
  token: string,
  x: number,
  y: number,
  item: Items,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  'use server';
  return hostMythicalOnServerSide(
    await requireUid(token),
    x,
    y,
    item,
    await syncServerClock(),
    offset,
  );
}

/**
 * Every lobby still gathering in the current raid window: started and
 * cleared raids drop out, and a lobby from a past window is dead
 */
export async function listLiveRaids(
  raidTimestamp: number,
  offset: number,
): Promise<[string, RaidRecord][]> {
  // The window is local, so two zones can floor to the same one; the
  // offset is what keeps a listing to the lobbies of its own world
  const { data } = await getSupabase()
    .from(RAID_TABLE)
    .select(RAID_EMBED)
    .eq('window_at', raidTimestamp)
    .eq('utc_offset', asOffset(offset))
    .is('battle_id', null)
    .eq('cleared', false);

  return asRecordArray(data).map((row) => [String(row.id), fromRaidRow(row)]);
}

/**
 * Walk out of a lobby: the player's teams come out with them, so a
 * raid they left does not start with their party in it. The server
 * pulls only the teams that name them as owner, and leaves a started
 * raid alone — it is already frozen into snapshots
 */
/** One call into a lobby, waiting on the player it was sent to */
export interface RaidInvite {
  raid: string;
  sender: string;
  /** What they were called in as: to fight, or to watch */
  role: LobbyRole;
  sentAt: number;
}

/**
 * Say the player is standing in the lobby without a party, so it can
 * show them among the onlookers. Leaving the raid drops the row again
 */
export async function watchRaidLobby(id: string): Promise<void> {
  await watchRaidLobbyOnServer(await getIdToken(), id);
}

async function watchRaidLobbyOnServer(token: string, id: string): Promise<void> {
  'use server';
  await watchLobbyOnServer(await requireUid(token), id, await syncServerClock());
}

/**
 * Follow who is standing in a lobby without a party. Anybody with a
 * team is in it to fight, so the lobby subtracts them from this list
 * rather than the read doing it: a player forms a team without ever
 * leaving the room
 */
export function watchRaidWatchers(id: string, onChange: (players: string[]) => void): Unwatch {
  const read = async (): Promise<string[]> => {
    const { data } = await getSupabase()
      .from('raid_watchers')
      .select('player')
      .eq('raid_id', id)
      .order('seen_at');

    return asRecordArray(data).map((row) => asString(row.player));
  };

  return watchTable('raid_watchers', [`raid_id=eq.${id}`], read, onChange);
}

/**
 * Follow the invites waiting on this player: one arriving, one
 * dismissed elsewhere, and one going down with its raid all move the
 * list
 */
export function watchRaidInvites(uid: string, onChange: (invites: RaidInvite[]) => void): Unwatch {
  const read = async (): Promise<RaidInvite[]> => {
    const { data } = await getSupabase()
      .from('raid_invites')
      .select('raid_id, sender, role, sent_at')
      .eq('recipient', uid)
      .order('sent_at', { ascending: false });

    return asRecordArray(data).map((row) => ({
      raid: asString(row.raid_id),
      sender: asString(row.sender),
      role: asNumber(row.role) as LobbyRole,
      sentAt: asNumber(row.sent_at),
    }));
  };

  return watchTable('raid_invites', [`recipient=eq.${uid}`], read, onChange);
}

/**
 * Call a friend into the lobby the player is standing in. Resolves
 * false when the raid is gone or started, the two are not friends, or
 * the friend is already in it
 */
export async function inviteToRaid(
  id: string,
  friend: string,
  role: LobbyRole = LobbyRole.Fighter,
): Promise<boolean> {
  return inviteToRaidOnServer(await getIdToken(), id, friend, role);
}

async function inviteToRaidOnServer(
  token: string,
  id: string,
  friend: string,
  role: LobbyRole,
): Promise<boolean> {
  'use server';
  return inviteOnServer(await requireUid(token), id, friend, await syncServerClock(), role);
}

/** Put an invite away unanswered */
export async function declineRaidInvite(id: string): Promise<void> {
  await declineRaidInviteOnServer(await getIdToken(), id);
}

async function declineRaidInviteOnServer(token: string, id: string): Promise<void> {
  'use server';
  await declineInviteOnServer(await requireUid(token), id);
}

export async function leaveRaid(id: string): Promise<void> {
  await leaveRaidOnServer(await getIdToken(), id);
}

async function leaveRaidOnServer(token: string, id: string): Promise<void> {
  'use server';
  await leaveOnServer(await requireUid(token), id);
}

/**
 * Mark the raid cleared, shutting its landmark for the rest of the
 * window. Every player who fought reports it; the server clears it only
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
 * The encounter is derived from the raid's own chunk and window, not
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
  const { data } = await getSupabase().from('raid_rewards').select('raid_id').eq('player', uid);

  return new Set(((data ?? []) as { raid_id: unknown }[]).map((row) => asString(row.raid_id)));
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
