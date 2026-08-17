import type { MysteryGift } from './gift-record';
import { requireUid } from '../server/firebase';
import type { GiftClaim } from '../server/gifts';
import { claimMysteryGift as claimOne, listMysteryGifts as listOwed } from '../server/gifts';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import getIdToken from './session';

/**
 * What the game is holding for this player.
 *
 * Asking is what puts a gift on the shelf as well as what reads the
 * shelf: whether anything is owed depends on what the player already
 * has, which is the server's to decide
 */
export async function listMysteryGifts(): Promise<MysteryGift[]> {
  return listOnServer(await getIdToken(), getLocalOffset());
}

async function listOnServer(token: string, offset: number): Promise<MysteryGift[]> {
  'use server';
  return listOwed(await requireUid(token), await syncServerClock(), offset);
}

/**
 * Take one. Resolves null for a gift that was never offered or has
 * already been taken, which is what a second press looks like
 */
export async function claimMysteryGift(gift: string): Promise<GiftClaim | null> {
  return claimOnServer(await getIdToken(), gift, getLocalOffset(), getLocale());
}

async function claimOnServer(
  token: string,
  gift: string,
  offset: number,
  locale: string,
): Promise<GiftClaim | null> {
  'use server';
  return claimOne(await requireUid(token), gift, await syncServerClock(), offset, locale);
}
