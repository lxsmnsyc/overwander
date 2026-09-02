import 'server-only';
import { type RaidKind, asRaidRecord, getRaidTitle } from '../auth/raid-record';
import type { Species } from '../data/ids/species';
import getAdminApi from './admin-api';
import { getSql } from './db';
import type { PositionRecord } from '../auth/position-record';
import { readPosition, readPositions } from './positions';
import { asNumber, asRecord, asString } from './read';

/**
 * What the dashboard reads.
 *
 * Everything here is a listing: a table in pages, with a search over
 * it. None of it is anything the game itself does, which is why it is
 * out of the modules the game reads.
 *
 * Accounts are searched in memory because the addresses live in the
 * auth admin API rather than in a table the query could join. The scan
 * is capped, and a listing says when it hit the cap rather than
 * quietly showing less
 */

/** How many rows a page holds */
export const PAGE_SIZE = 20;

/**
 * The most rows a listing will read to search over. A game with more
 * accounts than this needs a search index rather than a bigger number
 */
const SCAN_LIMIT = 2_000;

export interface Listing<T> {
  rows: T[];
  /** How many rows matched, across every page */
  total: number;
  /** How many pages they fill, never fewer than one */
  pages: number;
  /**
   * Which page these rows are, counted from zero. It is the page that
   * was *served* rather than the one asked for: a search that shortens
   * the list under somebody standing on page nine puts them on the
   * last page instead of showing them nothing
   */
  page: number;
  /** Whether the scan stopped at the cap, so the listing is partial */
  capped: boolean;
}

/** Cut the matching rows down to one page */
function pageOf<T>(matched: T[], page: number, capped: boolean): Listing<T> {
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const at = Math.min(Math.max(0, page), pages - 1);

  return {
    rows: matched.slice(at * PAGE_SIZE, (at + 1) * PAGE_SIZE),
    total: matched.length,
    pages,
    page: at,
    capped,
  };
}

function contains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

export interface PlayerRow {
  uid: string;
  nickname: string;
  /** From the auth record rather than the profile, which never holds one */
  email: string;
  gold: number;
  role: string;
  /** Whether the account is shut out of the game, and why */
  banned: boolean;
  banReason: string;
  /** When the account was created, in milliseconds */
  createdAt: number;
  /**
   * Where they are standing, or null for somebody who has never
   * walked. It is read for the rows of one page rather than for every
   * account: a listing of two thousand players is two thousand reads
   * for twenty lines
   */
  position: PositionRecord | null;
}

/**
 * Every account, newest first, filtered by name or address.
 *
 * The two halves of a player live apart: the address is in Supabase
 * Auth and everything else is in the profile row, so both are
 * read and joined by uid. An account with no profile yet is still a
 * player — it is somebody who signed in and closed the tab — so it is
 * listed with whatever the auth record knows
 */
export async function listPlayers(search: string, page: number): Promise<Listing<PlayerRow>> {
  const api = getAdminApi();
  const accounts: PlayerRow[] = [];
  let pageAt = 1;

  for (;;) {
    const { data, error } = await api.auth.admin.listUsers({ page: pageAt, perPage: 1_000 });

    if (error != null || data.users.length === 0) {
      break;
    }
    for (const account of data.users) {
      accounts.push({
        uid: account.id,
        nickname: '',
        email: account.email ?? '',
        gold: 0,
        role: '',
        banned: false,
        banReason: '',
        createdAt: Date.parse(account.created_at) || 0,
        position: null,
      });
    }
    pageAt += 1;
    if (accounts.length >= SCAN_LIMIT || data.users.length < 1_000) {
      break;
    }
  }

  const capped = accounts.length >= SCAN_LIMIT;

  // The profiles in one query rather than one read each
  const stored = await getSql()`
    select id, nickname, gold, role, banned, ban_reason
    from profiles where id = any(${accounts.map((row) => row.uid)})
  `;
  const profiles = new Map(stored.map((row) => [asString(row.id), row]));

  for (const row of accounts) {
    const data = profiles.get(row.uid);

    if (data == null) {
      continue;
    }
    row.nickname = asString(data.nickname);
    row.gold = asNumber(data.gold);
    row.role = asString(data.role);
    row.banned = data.banned === true;
    row.banReason = asString(data.ban_reason);
  }

  const wanted = search.trim().toLowerCase();
  const matched = accounts
    .filter((row) => wanted === '' || contains(row.nickname, wanted) || contains(row.email, wanted))
    .sort((left, right) => right.createdAt - left.createdAt);
  const listing = pageOf(matched, page, capped);

  // The page's positions in one question rather than one a row
  const standing = await readPositions(listing.rows.map((row) => row.uid));

  for (const row of listing.rows) {
    row.position = standing.get(row.uid) ?? null;
  }
  return listing;
}

/**
 * One account, whole: the auth record, the profile and where they are
 * standing. Resolves null for a uid no account was ever opened under
 */
export async function readPlayer(uid: string): Promise<PlayerRow | null> {
  const { data } = await getAdminApi()
    .auth.admin.getUserById(uid)
    .catch(() => ({ data: null }));
  const account = data?.user ?? null;

  if (account == null) {
    return null;
  }

  const rows = await getSql()`
    select nickname, gold, role, banned, ban_reason from profiles where id = ${uid}
  `;
  const stored = rows.at(0);

  return {
    uid,
    nickname: stored == null ? '' : asString(stored.nickname),
    email: account.email ?? '',
    gold: asNumber(stored?.gold),
    role: asString(stored?.role),
    banned: stored?.banned === true,
    banReason: asString(stored?.ban_reason),
    createdAt: Date.parse(account.created_at) || 0,
    position: await readPosition(uid),
  };
}

export interface RaidRow {
  id: string;
  /** The lair it stands in, which is what the lobby is called */
  title: string;
  kind: RaidKind;
  species: Species;
  host: string;
  /** What the host is called, since a uid names nobody */
  hostName: string;
  teams: number;
  battle: string | null;
  timestamp: number;
  chunkX: number;
  chunkY: number;
  cleared: boolean;
}

/**
 * Every lobby ever opened, newest window first, filtered by the name
 * of the place it stands in
 */
export async function listRaids(search: string, page: number): Promise<Listing<RaidRow>> {
  const stored = await getSql()`
    select r.*, coalesce(t.teams, 0)::int as team_count
    from raids r
    left join (
      select raid_id, count(*) as teams from teams group by raid_id
    ) t on t.raid_id = r.id
    order by r.window_at desc
    limit ${SCAN_LIMIT}
  `;

  const raids = stored.map((entry) => {
    const row = asRecord(entry);
    const record = asRaidRecord({
      kind: row.kind,
      lair: row.lair,
      species: row.species,
      traitValue: row.trait_value,
      host: row.host,
      teams: [],
      battle: row.battle_id,
      timestamp: row.window_at,
      offset: row.utc_offset,
      chunk: { seed: row.chunk_seed, x: row.chunk_x, y: row.chunk_y },
      biome: row.biome,
      cell: row.cell,
      cleared: row.cleared,
    });

    return {
      id: asString(row.id),
      title: getRaidTitle(record),
      kind: record.kind,
      species: record.species,
      host: record.host,
      hostName: '',
      teams: asNumber(row.team_count),
      battle: record.battle,
      timestamp: record.timestamp,
      chunkX: record.chunk.x,
      chunkY: record.chunk.y,
      cleared: record.cleared,
    };
  });

  const wanted = search.trim().toLowerCase();
  const listing = pageOf(
    raids.filter((raid) => wanted === '' || contains(raid.title, wanted)),
    page,
    stored.length >= SCAN_LIMIT,
  );

  // The hosts of the page alone: naming every host of every raid ever
  // opened is a thousand reads for twenty rows
  const hosts = [...new Set(listing.rows.map((raid) => raid.host))];

  if (hosts.length === 0) {
    return listing;
  }

  const profiles = await getSql()`
    select id, nickname from profiles where id = any(${hosts})
  `;
  const named = new Map(profiles.map((row) => [asString(row.id), asString(row.nickname)]));

  for (const raid of listing.rows) {
    raid.hostName = named.get(raid.host) ?? '';
  }
  return listing;
}
