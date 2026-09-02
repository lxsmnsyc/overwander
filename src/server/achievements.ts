import 'server-only';
import Awards, { KANTO_BADGES, KANTO_HONORS } from '../data/ids/awards';
import {
  ACHIEVEMENT_LINES,
  ACHIEVEMENT_TRAINERS,
  ACHIEVEMENT_TYPES,
  AchievementTier,
  type Achievements,
  deriveAchievements,
} from '../data/achievements';
import { LadderTitle, type Title, lineTitle, trainerTitle, typeTitle } from '../data/ids/titles';
import { CHARSETS } from '../data/overworld/charsets';
import { LEGENDS, LEGEND_HONORS } from '../data/overworld/experts';
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
 * Every title this player may wear: Bronze unlocks a line's base
 * title (the badge it is drawn on carries the tier's colour from
 * there), Platinum its Master variant, and the badge ladder adds its
 * own 3 on top. Beating trainers earns their class' name the same
 * way — enough Bug Catchers put down is what makes a player one
 */
export async function listUnlockedTitles(player: string): Promise<Title[]> {
  const [standings, held] = await Promise.all([readAchievements(player), listAwards(player)]);
  const awards = new Set(held.map((entry) => entry.award));
  const titles: Title[] = [];

  for (const line of ACHIEVEMENT_LINES) {
    const tier = standings.lines.get(line)?.tier ?? AchievementTier.None;

    if (tier >= AchievementTier.Bronze) {
      titles.push(lineTitle(line, false));
    }
    if (tier >= AchievementTier.Platinum) {
      titles.push(lineTitle(line, true));
    }
  }
  for (const type of ACHIEVEMENT_TYPES) {
    const tier = standings.types.get(type)?.tier ?? AchievementTier.None;

    if (tier >= AchievementTier.Bronze) {
      titles.push(typeTitle(type, false));
    }
    if (tier >= AchievementTier.Platinum) {
      titles.push(typeTitle(type, true));
    }
  }
  for (const trainer of ACHIEVEMENT_TRAINERS) {
    const tier = standings.trainers.get(trainer)?.tier ?? AchievementTier.None;

    if (tier >= AchievementTier.Bronze) {
      titles.push(trainerTitle(trainer, false));
    }
    if (tier >= AchievementTier.Platinum) {
      titles.push(trainerTitle(trainer, true));
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
  if (awards.has(Awards.JohtoChampion)) {
    titles.push(LadderTitle.JohtoChampion);
  }
  // One mark is enough: a legend is not a set to be walked through
  if (LEGENDS.some((legend) => awards.has(LEGEND_HONORS[legend]))) {
    titles.push(LadderTitle.LegendBreaker);
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

/**
 * Every character this player may go about as.
 *
 * The same entitlement the titles run on, over the same two facts: an
 * award held, or a trainer class' line at Bronze. Beating a gym is
 * what lets somebody dress as its leader, and putting down enough Bug
 * Catchers is what makes them one
 */
export async function listUnlockedSprites(player: string): Promise<string[]> {
  const [standings, held] = await Promise.all([readAchievements(player), listAwards(player)]);
  const awards = new Set(held.map((entry) => entry.award));

  return CHARSETS.filter((charset) => {
    switch (charset.lock.kind) {
      case 'free':
        return true;
      case 'award':
        return awards.has(charset.lock.award);
      case 'awards':
        return charset.lock.awards.every((award) => awards.has(award));
      default:
        return (
          (standings.trainers.get(charset.lock.trainer)?.tier ?? AchievementTier.None) >=
          AchievementTier.Bronze
        );
    }
  }).map((charset) => charset.sheet);
}

/**
 * Wear a character. Entitlement is re-derived here rather than trusted,
 * which is the whole reason the column is not the player's to write.
 * Resolves whether the write happened
 */
export async function setSprite(uid: string, sprite: string): Promise<boolean> {
  const unlocked = await listUnlockedSprites(uid);

  if (!unlocked.includes(sprite)) {
    return false;
  }
  await getSql()`update profiles set sprite = ${sprite} where id = ${uid}`;
  return true;
}
