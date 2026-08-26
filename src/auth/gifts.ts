import type { MysteryGift } from './gift-record';
import { requireUid } from '../server/auth';
import type { GiftClaim } from '../server/gifts';
import { claimMysteryGift as claimOne, listMysteryGifts as listOwed } from '../server/gifts';
import { bumpProgress } from '../server/quest-progress';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import { Metric } from './quest-record';
import getIdToken from './session';

/**
 * What the game is holding for this player.
 *
 * Asking is what puts a gift on the shelf as well as what reads the
 * shelf: whether anything is owed depends on what the player already
 * has, which is the server's to decide
 */
export async function listMysteryGifts(): Promise<MysteryGift[]> {
  return listOnServer(await getIdToken());
}

async function listOnServer(token: string): Promise<MysteryGift[]> {
  'use server';
  return listOwed(await requireUid(token), await syncServerClock());
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

  const uid = await requireUid(token);
  const paid = await claimOne(uid, gift, await syncServerClock(), offset, locale);

  // Counted here rather than in the claim itself, so a quest reward
  // riding the same machinery does not count as a gift taken
  if (paid != null) {
    await bumpProgress(uid, [[Metric.Gifts, 0, 1]]);
  }
  return paid;
}
