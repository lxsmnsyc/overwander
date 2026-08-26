import 'server-only';
import Awards, { KANTO_BADGES, KANTO_HONORS } from '../data/ids/awards';
import {
  ACHIEVEMENT_LINES,
  ACHIEVEMENT_TYPES,
  AchievementTier,
  type Achievements,
  deriveAchievements,
} from '../data/achievements';
import { LadderTitle, type Title, lineTitle, typeTitle } from '../data/ids/titles';
import { listAwards } from './awards';
import { getSql } from './db';
import { readProgress } from './quest-progress';

/**
 * Achievement standings and the titles they unlock, derived rather
 * than stored: the lifetime counters are the truth, so a standing is
 * computed from them wherever it is asked for and can never drift
 */

export async function readAchievements(player: string): Promise<Achievements> {
  return deriveAchievements(await readProgress(player));
}

/**
 * Every title this player may wear: Gold unlocks a line's base title
 * and Platinum its Master variant, and the badge ladder adds its own
 * 3 on top
 */
export async function listUnlockedTitles(player: string): Promise<Title[]> {
  const [standings, held] = await Promise.all([readAchievements(player), listAwards(player)]);
  const awards = new Set(held.map((entry) => entry.award));
  const titles: Title[] = [];

  for (const line of ACHIEVEMENT_LINES) {
    const tier = standings.lines.get(line)?.tier ?? AchievementTier.None;

    if (tier >= AchievementTier.Gold) {
      titles.push(lineTitle(line, false));
    }
    if (tier >= AchievementTier.Platinum) {
      titles.push(lineTitle(line, true));
    }
  }
  for (const type of ACHIEVEMENT_TYPES) {
    const tier = standings.types.get(type)?.tier ?? AchievementTier.None;

    if (tier >= AchievementTier.Gold) {
      titles.push(typeTitle(type, false));
    }
    if (tier >= AchievementTier.Platinum) {
      titles.push(typeTitle(type, true));
    }
  }
  if (KANTO_BADGES.every((badge) => awards.has(badge))) {
    titles.push(LadderTitle.LeagueChallenger);
  }
  if (KANTO_HONORS.every((honor) => awards.has(honor))) {
    titles.push(LadderTitle.EliteConqueror);
  }
  if (awards.has(Awards.KantoChampion)) {
    titles.push(LadderTitle.KantoChampion);
  }
  return titles;
}

/**
 * Put a title on the profile, or take it off with null. Entitlement
 * is re-derived here, so a client can only ever wear what it earned.
 * Resolves whether the write happened
 */
export async function setTitle(uid: string, title: Title | null): Promise<boolean> {
  if (title != null) {
    const unlocked = await listUnlockedTitles(uid);

    if (!unlocked.includes(title)) {
      return false;
    }
  }
  await getSql()`update profiles set title = ${title} where id = ${uid}`;
  return true;
}
