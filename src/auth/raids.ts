// Rows arrive untyped; the converter below restores const-enum fields
// via assertions that tsc requires but tsgolint (resolving const enums
// to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type { Items } from '../data/ids/items';
import { RAID_INTERVAL } from '../overworld/chunk-snapshot';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { WORLD_GENERATION } from '../overworld/current';
import type { Depth } from '../overworld/depth';
import { asNumber, asRecord, asRecordArray, asString } from './__normalize';
import { RaidKind, type RaidRecord, type RaidView, asRaidRecord } from './raid-record';
import { hasAnyCaught } from './caught';
import { LobbyRole } from './lobby-role';
import { requireUid, requireUidFor } from '../server/auth';
import { Feature } from '../server/switches';
import check, {
  CELL,
  CHUNK_COORDINATE,
  DEPTH,
  GAME_ID,
  ID,
  LOBBY_ROLE,
  OFFSET,
  PARTY,
  RAID_KIND,
  TOKEN,
  UID,
} from '../server/validate';
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
  unwatchRaidLobby as unwatchLobbyOnServer,
  watchRaidLobby as watchLobbyOnServer,
} from '../server/raids';
import { serverNow, syncServerClock } from './clock';
import { asOffset, toLocalTime } from './local-time';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import getSupabase, { type Unwatch, watchTable } from './supabase';
import getIdToken from './session';
import batchedQuery from '../utils/batched-query';

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

/** A lobby's teams, each id to the place it joined in */
type Joined = Map<string, number>;

/** The teams embedded in a raid row, as `Joined` */
function joinedOf(row: Record<string, unknown>): Joined {
  const joined: Joined = new Map();

  for (const entry of asRecordArray(row.teams)) {
    joined.set(String(entry.id), Number(entry.joined_seq ?? 0));
  }
  return joined;
}

/**
 * One raid row plus its team list, in the record shape. The teams come
 * embedded in the row unless the caller holds them separately
 */
function fromRaidRow(row: Record<string, unknown>, joined = joinedOf(row)): RaidRecord {
  const ids: string[] = [];

  for (const [id] of [...joined].sort((left, right) => left[1] - right[1])) {
    ids.push(id);
  }
  return asRaidRecord({
    kind: row.kind,
    lair: row.lair,
    species: row.species,
    traitValue: row.trait_value,
    host: row.host,
    teams: ids,
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
  const row = await readLobby(id);

  return row == null ? null : fromRaidRow(row);
}

/**
 * `getRaid` for a list naming several lobbies at once, such as the raids
 * a player was invited to: the reads made in the same moment go out as
 * one. Browser only, since the queue is shared by everyone in the module
 */
export const getRaidBatched = batchedQuery(
  async (ids: string[]): Promise<Map<string, RaidRecord>> => {
    const { data }: { data: unknown } = await getSupabase()
      .from(RAID_TABLE)
      .select(RAID_EMBED)
      .in('id', ids);
    const found = new Map<string, RaidRecord>();

    for (const row of asRecordArray(data)) {
      found.set(asString(row.id), fromRaidRow(row));
    }
    return found;
  },
  (found, id: string): RaidRecord | null => found.get(id) ?? null,
  // The ids travel in the request's address, which has a length limit
  { limit: 50 },
);

/**
 * Follow a lobby: teams join and leave it, and the host's start
 * writes the battle id everyone else is waiting on.
 *
 * Every member of a lobby watches it, so a read per change is a read
 * per member per join. The stream already says what changed, so it is
 * folded into what is held instead: the lobby row arrives whole, a
 * joining team brings its id and its place, and a leaving one its id.
 * Only the first look and a reconnect read the lobby, and a change
 * that says too little to fold is read like a reconnect
 */
export function watchRaid(id: string, onChange: (raid: RaidRecord | null) => void): Unwatch {
  const supabase = getSupabase();
  // What is held: nothing until the first read lands, then the lobby
  // row (or null once it is gone) and its teams
  let held: { row: Record<string, unknown> | null; joined: Joined } | null = null;
  const publish = (): void => {
    if (held != null) {
      onChange(held.row == null ? null : fromRaidRow(held.row, held.joined));
    }
  };
  const refetch = (): void => {
    readLobby(id)
      .then((row) => {
        held = { row, joined: row == null ? new Map() : joinedOf(row) };
        publish();
      })
      .catch(() => {
        // A read that failed mid-watch is a blink, not a sign-out; the
        // next change or reconnect tries again
      });
  };
  let connected = false;
  const channel = supabase
    .channel(`raid:${id}:${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: RAID_TABLE, filter: `id=eq.${id}` },
      (payload) => {
        const row: Record<string, unknown> = payload.new;

        if (held == null) {
          refetch();
        } else if (payload.eventType === 'DELETE') {
          held = { row: null, joined: new Map() };
          publish();
        } else if (Object.keys(row).length === 0) {
          refetch();
        } else {
          held.row = row;
          publish();
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teams', filter: `raid_id=eq.${id}` },
      (payload) => {
        const joining: Record<string, unknown> = payload.new;
        const leaving: Record<string, unknown> = payload.old;

        if (held == null) {
          refetch();
        } else if (payload.eventType === 'INSERT' && typeof joining.id === 'string') {
          // A team is written once and never changed, so its id and
          // its place in the queue are all the lobby needs
          held.joined.set(joining.id, Number(joining.joined_seq ?? 0));
          publish();
        } else if (payload.eventType === 'DELETE' && typeof leaving.id === 'string') {
          held.joined.delete(leaving.id);
          publish();
        } else {
          refetch();
        }
      },
    )
    .subscribe((status) => {
      if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        return;
      }
      // The first subscribe rides the read below; a resubscribe may
      // have missed changes while the socket was away
      if (connected) {
        refetch();
      }
      connected = true;
    });

  // The first paint cannot wait for the socket
  refetch();

  return () => {
    supabase.removeChannel(channel).catch(() => {
      // A channel that cannot be removed is already gone
    });
  };
}

/** A lobby's row with its teams embedded, or null when it is gone */
async function readLobby(id: string): Promise<Record<string, unknown> | null> {
  const { data }: { data: unknown } = await getSupabase()
    .from(RAID_TABLE)
    .select(RAID_EMBED)
    .eq('id', id)
    .maybeSingle();

  return data == null ? null : asRecord(data);
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
  // set by UPDATE, which the set's own filter would never deliver.
  // A lobby of another window or zone is never in the set either way
  return watchTable(RAID_TABLE, [], async () => listLiveRaids(raidTimestamp, offset), onChange, {
    wanted: (row) =>
      row.generation === WORLD_GENERATION &&
      Number(row.window_at) === raidTimestamp &&
      Number(row.utc_offset) === asOffset(offset),
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
    snapshot.depth,
  );
}

async function peekRaidOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  offset: number,
  depth: Depth,
): Promise<RaidView | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(RAID_KIND, kind);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return peekOnServer(
    await requireUid(token),
    x,
    y,
    cell,
    kind,
    await syncServerClock(),
    offset,
    depth,
  );
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
    snapshot.depth,
  );
}

async function enterRaidOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  kind: RaidKind,
  offset: number,
  depth: Depth,
): Promise<[string, RaidRecord] | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(RAID_KIND, kind);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return enterOnServer(
    await requireUidFor(token, Feature.Raids),
    x,
    y,
    cell,
    kind,
    await syncServerClock(),
    offset,
    depth,
  );
}

/**
 * Open a mythical raid with a raid item, where the player is
 * standing. It takes the chunk rather than a snapshot, because the
 * bag opens one too and a bag has no chunk built: the server derives
 * its own snapshot from these two numbers either way. Opening costs nothing: the server checks the relic is
 * carried and leaves it in the bag, and it is spent when the raid
 * starts, so a mythical is fought once, won or lost. One relic opens
 * one lobby a window, so pressing it again is the way back into a
 * lobby that was walked away from.
 *
 * Resolves the lobby id and its record, or null when the item calls
 * nothing, is not carried, the player owns no pokemon to field, or
 * this window's lobby for it has already been fought out
 */
export async function hostMythicalRaid(
  chunkX: number,
  chunkY: number,
  item: Items,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  return hostMythicalOnServer(await getIdToken(), chunkX, chunkY, item, offset);
}

async function hostMythicalOnServer(
  token: string,
  x: number,
  y: number,
  item: Items,
  offset: number,
): Promise<[string, RaidRecord] | null> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(GAME_ID, item);
  check(OFFSET, offset);
  return hostMythicalOnServerSide(
    await requireUidFor(token, Feature.Raids),
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
    .eq('generation', WORLD_GENERATION)
    .eq('window_at', raidTimestamp)
    .eq('utc_offset', asOffset(offset))
    .is('battle_id', null)
    .eq('cleared', false);
  const raids: [string, RaidRecord][] = [];

  for (const row of asRecordArray(data)) {
    raids.push([String(row.id), fromRaidRow(row)]);
  }
  return raids;
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
  check(TOKEN, token);
  check(ID, id);
  await watchLobbyOnServer(await requireUid(token), id, await syncServerClock());
}

/**
 * Stop standing in it. It is the panel closing rather than the player
 * leaving the raid, so a party they brought stays in the fight
 */
export async function unwatchRaidLobby(id: string): Promise<void> {
  await unwatchRaidLobbyOnServer(await getIdToken(), id);
}

async function unwatchRaidLobbyOnServer(token: string, id: string): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  await unwatchLobbyOnServer(await requireUid(token), id);
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
    const players: string[] = [];

    for (const row of asRecordArray(data)) {
      players.push(asString(row.player));
    }
    return players;
  };

  return watchTable('raid_watchers', [`raid_id=eq.${id}`], read, onChange);
}

/**
 * Follow the invites waiting on this player: one arriving, one
 * dismissed elsewhere, and one going down with its raid all move the
 * list
 */
export function watchRaidInvites(uid: string, onChange: (invites: RaidInvite[]) => void): Unwatch {
  /** Every call into a lobby still open, with the instant its raid window closes */
  let held: [invite: RaidInvite, endsAt: number][] = [];
  let closing: ReturnType<typeof setTimeout> | undefined;

  // A lobby whose window has closed can no longer be joined, and nothing
  // in its row changes when that happens, so the clock drops it
  const report = (): void => {
    const now = serverNow();
    const open: RaidInvite[] = [];
    let next = Number.POSITIVE_INFINITY;

    for (const [invite, endsAt] of held) {
      if (now < endsAt) {
        open.push(invite);
        next = Math.min(next, endsAt);
      }
    }
    clearTimeout(closing);
    if (Number.isFinite(next)) {
      // A second late, so the window reads as closed when the timer fires
      closing = setTimeout(report, next - now + 1000);
    }
    onChange(open);
  };

  const read = async (): Promise<[RaidInvite, number][]> => {
    const { data } = await getSupabase()
      .from('raid_invites')
      .select('raid_id, sender, role, sent_at, raids(battle_id, cleared, window_at, utc_offset)')
      .eq('recipient', uid)
      .order('sent_at', { ascending: false });
    const found: [RaidInvite, number][] = [];

    for (const row of asRecordArray(data)) {
      const raid = asRecord(row.raids);

      // A call into a lobby that has started or been cleared answers nothing
      if (raid.battle_id != null || raid.cleared === true) {
        continue;
      }
      found.push([
        {
          raid: asString(row.raid_id),
          sender: asString(row.sender),
          role: asNumber(row.role) as LobbyRole,
          sentAt: asNumber(row.sent_at),
        },
        // The window is counted in the raid's own zone, so its close is
        // taken back onto the server's clock
        asNumber(raid.window_at) + RAID_INTERVAL - toLocalTime(0, asNumber(raid.utc_offset)),
      ]);
    }
    return found;
  };

  const unwatch = watchTable('raid_invites', [`recipient=eq.${uid}`], read, (found) => {
    held = found;
    report();
  });

  return () => {
    clearTimeout(closing);
    unwatch();
  };
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
  check(TOKEN, token);
  check(ID, id);
  check(UID, friend);
  check(LOBBY_ROLE, role);
  return inviteOnServer(
    await requireUidFor(token, Feature.Raids),
    id,
    friend,
    await syncServerClock(),
    role,
  );
}

/** Put an invite away unanswered */
export async function declineRaidInvite(id: string): Promise<void> {
  await declineRaidInviteOnServer(await getIdToken(), id);
}

async function declineRaidInviteOnServer(token: string, id: string): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  await declineInviteOnServer(await requireUid(token), id);
}

export async function leaveRaid(id: string): Promise<void> {
  await leaveRaidOnServer(await getIdToken(), id);
}

async function leaveRaidOnServer(token: string, id: string): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
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
  check(TOKEN, token);
  check(ID, id);
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
  check(TOKEN, token);
  check(ID, id);
  check(PARTY, catches);
  return joinOnServer(await requireUidFor(token, Feature.Raids), id, catches);
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
  check(TOKEN, token);
  check(ID, id);
  return claimRewardOnServerSide(await requireUid(token), id);
}

/**
 * The raids this player has already collected from
 */
export async function listClaimedRaids(uid: string): Promise<Set<string>> {
  const { data } = await getSupabase().from('raid_rewards').select('raid_id').eq('player', uid);

  const claimed = new Set<string>();

  for (const row of (data ?? []) as { raid_id: unknown }[]) {
    claimed.add(asString(row.raid_id));
  }
  return claimed;
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
  check(TOKEN, token);
  check(ID, id);
  return startOnServer(await requireUidFor(token, Feature.Raids), id, await syncServerClock());
}
