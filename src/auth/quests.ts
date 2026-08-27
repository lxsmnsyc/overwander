import type { QuestStanding } from './quest-record';
import type { Quests } from '../data/quests';
import { requireUid } from '../server/auth';
import listDue, { type DueQuest } from '../server/due';
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
export type { DueQuest } from '../server/due';

/**
 * What is ready to claim right now, quests and rotations alike. Read
 * for the announcement rather than for the board, which asks for the
 * standings themselves
 */
export async function getDueQuests(): Promise<DueQuest[]> {
  return listDueOnServer(await getIdToken());
}

async function listDueOnServer(token: string): Promise<DueQuest[]> {
  'use server';
  return listDue(await requireUid(token), await syncServerClock());
}

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
