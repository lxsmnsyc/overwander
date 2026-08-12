import type { MysteryGift } from './gift-record';
import { requireUid } from '../server/firebase';
import { claimStarterGift } from '../server/gifts';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import getIdToken from './session';

/**
 * Ask whether the game owes this player anything.
 *
 * It is asked rather than announced because the answer is the
 * server's alone: what is given, and whether anything is, depends on
 * what the player already has. Resolves an empty list far more often
 * than not, which is the ordinary case — a player with a pokemon is
 * owed nothing
 */
export default async function claimMysteryGift(): Promise<MysteryGift[]> {
  return claimOnServer(await getIdToken(), getLocalOffset(), getLocale());
}

async function claimOnServer(
  token: string,
  offset: number,
  locale: string,
): Promise<MysteryGift[]> {
  'use server';
  return claimStarterGift(await requireUid(token), await syncServerClock(), offset, locale);
}
