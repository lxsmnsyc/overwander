import type { QuestStanding } from './quest-record';
import type { Quests } from '../data/quests';
import { requireUid } from '../server/auth';
import type { QuestPayout } from '../server/quests';
import { claimQuest as claimOnServer, listQuests as listOnServer } from '../server/quests';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import getIdToken from './session';

/**
 * The quest board: where the player stands on every visible quest,
 * and the claiming. Both are the server's to answer, since progress
 * is counters only it bumps and a reward is only paid where the
 * requirements are re-read
 */

export type { QuestPayout } from '../server/quests';

export async function getQuests(): Promise<QuestStanding[]> {
  return listOnServer2(await getIdToken());
}

async function listOnServer2(token: string): Promise<QuestStanding[]> {
  'use server';
  return listOnServer(await requireUid(token));
}

/**
 * Take one quest's rewards. Resolves what was paid, or null when the
 * quest is locked, unmet or already claimed
 */
export async function claimQuest(quest: Quests): Promise<QuestPayout | null> {
  return claimOnServer2(await getIdToken(), quest, getLocalOffset(), getLocale());
}

async function claimOnServer2(
  token: string,
  quest: Quests,
  offset: number,
  locale: string,
): Promise<QuestPayout | null> {
  'use server';
  return claimOnServer(await requireUid(token), quest, await syncServerClock(), offset, locale);
}
