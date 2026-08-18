import 'server-only';
import { PROFILE_COLLECTION, RAID_COLLECTION } from '../auth/collections';
import { type RaidKind, asRaidRecord, getRaidTitle } from '../auth/raid-record';
import type { Species } from '../data/ids/species';
import { getAdminAuth, getAdminFirestore } from './firebase';
import type { PositionRecord } from '../auth/position-record';
import { readPosition } from './positions';
import { asNumber, asString, docData } from './read';

/**
 * What the dashboard reads.
 *
 * Everything here is a **listing**: the whole of a collection, in
 * pages, with a search over it. None of it is anything the game
 * itself does, which is why it is not in the modules the game reads —
 * a player never asks who else has signed up.
 *
 * The filtering and the paging happen here rather than in Firestore.
 * A search over two fields at once is not a query a document store
 * answers, and the numbers are small enough that reading the
 * collection and cutting it up is honest: the scan is capped, and a
 * listing says when it hit the cap rather than quietly showing less.
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
 * The two halves of a player live apart: the address is in Firebase
 * Auth and everything else is in the profile document, so both are
 * read and joined by uid. An account with no profile yet is still a
 * player — it is somebody who signed in and closed the tab — so it is
 * listed with whatever the auth record knows
 */
export async function listPlayers(search: string, page: number): Promise<Listing<PlayerRow>> {
  const auth = getAdminAuth();
  const accounts: PlayerRow[] = [];
  let token: string | undefined;

  do {
    const batch = await auth.listUsers(1_000, token);

    for (const account of batch.users) {
      accounts.push({
        uid: account.uid,
        nickname: account.displayName ?? '',
        email: account.email ?? '',
        gold: 0,
        role: '',
        banned: false,
        banReason: '',
        createdAt: Date.parse(account.metadata.creationTime),
        position: null,
      });
    }
    token = batch.pageToken;
  } while (token != null && accounts.length < SCAN_LIMIT);

  const capped = accounts.length >= SCAN_LIMIT;

  // The profiles in one read rather than one read each: `getAll` takes
  // the lot, and a missing document comes back as a snapshot that
  // says so
  const db = getAdminFirestore();
  const stored = await Promise.all(
    chunked(accounts, 200).map(async (some) =>
      db.getAll(...some.map((row) => db.collection(PROFILE_COLLECTION).doc(row.uid))),
    ),
  );

  for (const snapshot of stored.flat()) {
    const data = docData(snapshot);
    const row = accounts.find((account) => account.uid === snapshot.id);

    if (data == null || row == null) {
      continue;
    }
    row.nickname = asString(data.nickname);
    row.gold = asNumber(data.gold);
    row.role = asString(data.role);
    row.banned = data.banned === true;
    row.banReason = asString(data.banReason);
  }

  const wanted = search.trim().toLowerCase();
  const matched = accounts
    .filter((row) => wanted === '' || contains(row.nickname, wanted) || contains(row.email, wanted))
    .sort((left, right) => right.createdAt - left.createdAt);
  const listing = pageOf(matched, page, capped);

  await Promise.all(
    listing.rows.map(async (row) => {
      row.position = await readPosition(row.uid);
    }),
  );
  return listing;
}

/**
 * One account, whole: the auth record, the profile and where they are
 * standing. Resolves null for a uid no account was ever opened under
 */
export async function readPlayer(uid: string): Promise<PlayerRow | null> {
  const account = await getAdminAuth()
    .getUser(uid)
    .catch(() => null);

  if (account == null) {
    return null;
  }

  const stored = docData(
    await getAdminFirestore().collection(PROFILE_COLLECTION).doc(uid).get(),
  );

  return {
    uid,
    nickname: stored == null ? (account.displayName ?? '') : asString(stored.nickname),
    email: account.email ?? '',
    gold: asNumber(stored?.gold),
    role: asString(stored?.role),
    banned: stored?.banned === true,
    banReason: asString(stored?.banReason),
    createdAt: Date.parse(account.metadata.creationTime),
    position: await readPosition(uid),
  };
}

/**
 * The refs a `getAll` can take at once. It is a request size rather
 * than a limit of the store, and the accounts are read in slices of it
 */
function chunked<T>(rows: T[], size: number): T[][] {
  const slices: T[][] = [];

  for (let at = 0; at < rows.length; at += size) {
    slices.push(rows.slice(at, at + size));
  }
  return slices;
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
  const db = getAdminFirestore();
  const stored = await db
    .collection(RAID_COLLECTION)
    .orderBy('timestamp', 'desc')
    .limit(SCAN_LIMIT)
    .get();

  const raids = stored.docs.map((document) => {
    const record = asRaidRecord(document.data());

    return {
      id: document.id,
      title: getRaidTitle(record),
      kind: record.kind,
      species: record.species,
      host: record.host,
      hostName: '',
      teams: record.teams.length,
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
    stored.size >= SCAN_LIMIT,
  );

  // The hosts of the page alone: naming every host of every raid ever
  // opened is a thousand reads for twenty rows
  const hosts = [...new Set(listing.rows.map((raid) => raid.host))];

  if (hosts.length === 0) {
    return listing;
  }

  const profiles = await db.getAll(
    ...hosts.map((uid) => db.collection(PROFILE_COLLECTION).doc(uid)),
  );
  const named = new Map(
    profiles.map((snapshot) => [snapshot.id, asString(docData(snapshot)?.nickname)]),
  );

  for (const raid of listing.rows) {
    raid.hostName = named.get(raid.host) ?? '';
  }
  return listing;
}
