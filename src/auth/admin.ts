import type { Listing, PlayerRow, RaidRow } from '../server/admin';
import {
  listPlayers as listPlayersOnServer,
  listRaids as listRaidsOnServer,
  readPlayer as readPlayerOnServer,
} from '../server/admin';
import type { GiftLedgerRow, StaffGift } from '../server/gifts';
import { giveGift, listAllGifts as listAllOnServer } from '../server/gifts';
import { requireAdmin, requireStaff, setBan, setRole } from '../server/roles';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * What the dashboard asks the server for.
 *
 * Every call here goes through `requireAdmin`, which reads the
 * caller's own profile: the screen is hidden from a player, and these
 * are what would happen if somebody called them anyway
 */

export type { GiftLedgerRow, Listing, PlayerRow, RaidRow, StaffGift };

export async function listPlayers(search: string, page: number): Promise<Listing<PlayerRow>> {
  return playersOnServer(await getIdToken(), search, page);
}

async function playersOnServer(
  token: string,
  search: string,
  page: number,
): Promise<Listing<PlayerRow>> {
  'use server';
  await requireStaff(token);
  return listPlayersOnServer(search, page);
}

/**
 * One account, whole, for the page a player's row opens
 */
export async function getPlayer(uid: string): Promise<PlayerRow | null> {
  return playerOnServer(await getIdToken(), uid);
}

async function playerOnServer(token: string, uid: string): Promise<PlayerRow | null> {
  'use server';
  await requireStaff(token);
  return readPlayerOnServer(uid);
}

/**
 * Put a role on an account or take one off. Resolves what it now
 * holds, or null when the change was refused — which is what reaching
 * above your own standing looks like
 */
export async function setPlayerRole(uid: string, role: string): Promise<string | null> {
  return roleOnServer(await getIdToken(), uid, role);
}

async function roleOnServer(token: string, uid: string, role: string): Promise<string | null> {
  'use server';
  return setRole(await requireStaff(token), uid, role);
}

/**
 * Shut an account out of the game, or let it back in. Resolves
 * whether it is now banned, or null when the ban was refused
 */
export async function setPlayerBan(
  uid: string,
  banned: boolean,
  reason: string,
): Promise<boolean | null> {
  return banOnServer(await getIdToken(), uid, banned, reason);
}

async function banOnServer(
  token: string,
  uid: string,
  banned: boolean,
  reason: string,
): Promise<boolean | null> {
  'use server';
  return setBan(await requireStaff(token), uid, banned, reason);
}

export async function listRaids(search: string, page: number): Promise<Listing<RaidRow>> {
  return raidsOnServer(await getIdToken(), search, page);
}

async function raidsOnServer(
  token: string,
  search: string,
  page: number,
): Promise<Listing<RaidRow>> {
  'use server';
  await requireStaff(token);
  return listRaidsOnServer(search, page);
}

/**
 * Put a gift on a shelf — one player's, or everybody's. Resolves false
 * when one of that id is already there, which is what a second press
 * looks like
 */
export async function offerGift(gift: StaffGift): Promise<boolean> {
  return giftOnServer(await getIdToken(), gift);
}

async function giftOnServer(token: string, gift: StaffGift): Promise<boolean> {
  'use server';
  await requireAdmin(token);
  return giveGift(gift, await syncServerClock());
}

/**
 * Every gift ever written, newest first: whose it is, how often it has
 * been taken, and whether it has run out
 */
export async function listAllGifts(): Promise<GiftLedgerRow[]> {
  return allGiftsOnServer(await getIdToken());
}

async function allGiftsOnServer(token: string): Promise<GiftLedgerRow[]> {
  'use server';
  await requireAdmin(token);
  return listAllOnServer(await syncServerClock());
}
