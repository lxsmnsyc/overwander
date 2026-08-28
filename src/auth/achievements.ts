import type { AchievementLine, AchievementStanding } from '../data/achievements';
import type { Types } from '../data/constants/types';
import type { TrainerClass } from '../data/overworld/trainers';
import type { Title } from '../data/ids/titles';
import { requireUid } from '../server/auth';
import {
  listUnlockedSprites as listSpritesOnServer,
  listUnlockedTitles as listTitlesOnServer,
  readAchievements as readOnServer,
  setSprite as setSpriteOnServer,
  setTitle as setTitleOnServer,
} from '../server/achievements';
import getIdToken from './session';

/**
 * Achievements and titles as the client sees them. Standings are
 * derived server-side from the lifetime counters; the one write here
 * is which earned title the player wears
 */

/** The standings as entries, since a Map does not cross the wire */
export interface AchievementSheet {
  lines: [AchievementLine, AchievementStanding][];
  types: [Types, AchievementStanding][];
  trainers: [TrainerClass, AchievementStanding][];
}

export async function listAchievements(player: string): Promise<AchievementSheet> {
  return listAchievementsOnServer(player);
}

async function listAchievementsOnServer(player: string): Promise<AchievementSheet> {
  'use server';
  const standings = await readOnServer(player);

  return {
    lines: [...standings.lines],
    types: [...standings.types],
    trainers: [...standings.trainers],
  };
}

/** The titles the signed-in player has earned */
export async function listMyTitles(): Promise<Title[]> {
  return listTitlesFor(await getIdToken());
}

async function listTitlesFor(token: string): Promise<Title[]> {
  'use server';
  return listTitlesOnServer(await requireUid(token));
}

/** Wear a title, or null to wear none. Resolves whether it stuck */
export async function saveTitle(title: Title | null): Promise<boolean> {
  return saveTitleOnServer(await getIdToken(), title);
}

async function saveTitleOnServer(token: string, title: Title | null): Promise<boolean> {
  'use server';
  return setTitleOnServer(await requireUid(token), title);
}

/** The characters the signed-in player has earned the right to wear */
export async function listMySprites(): Promise<string[]> {
  return listSpritesFor(await getIdToken());
}

async function listSpritesFor(token: string): Promise<string[]> {
  'use server';
  return listSpritesOnServer(await requireUid(token));
}

/** Go about as one of them. Resolves whether it stuck */
export async function saveSprite(sprite: string): Promise<boolean> {
  return saveSpriteOnServer(await getIdToken(), sprite);
}

async function saveSpriteOnServer(token: string, sprite: string): Promise<boolean> {
  'use server';
  return setSpriteOnServer(await requireUid(token), sprite);
}
