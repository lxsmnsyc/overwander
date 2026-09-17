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
import {
  LadderTitle,
  type Title,
  lineTitle,
  professorTitle,
  trainerTitle,
  typeTitle,
} from '../data/ids/titles';
import { REGION_DEXES, getDexRegions } from '../data/quests/dex';
import { CHARSETS } from '../data/overworld/charsets';
import { LEGENDS, LEGEND_HONORS } from '../data/overworld/experts';
import { type AwardRecord, listAwards } from './awards';
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
  const awards = heldAwards(held);
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
  if (holdsEvery(awards, KANTO_BADGES)) {
    titles.push(LadderTitle.LeagueChallenger);
  }
  if (holdsEvery(awards, KANTO_HONORS)) {
    titles.push(LadderTitle.EliteConqueror);
  }
  if (awards.has(Awards.KantoChampion)) {
    titles.push(LadderTitle.KantoChampion);
  }
  if (awards.has(Awards.JohtoChampion)) {
    titles.push(LadderTitle.JohtoChampion);
  }
  if (awards.has(Awards.HoennChampion)) {
    titles.push(LadderTitle.HoennChampion);
  }
  if (awards.has(Awards.SinnohChampion)) {
    titles.push(LadderTitle.SinnohChampion);
  }
  // One mark is enough: a legend is not a set to be walked through
  for (const legend of LEGENDS) {
    if (awards.has(LEGEND_HONORS[legend])) {
      titles.push(LadderTitle.LegendBreaker);
      break;
    }
  }
  // And a filled dex is worth that region's professor
  for (const region of getDexRegions()) {
    const dex = REGION_DEXES[region];

    if (dex != null && awards.has(dex.medal)) {
      titles.push(professorTitle(region));
    }
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
  const awards = heldAwards(held);
  const sheets: string[] = [];

  for (const { lock, sheet } of CHARSETS) {
    let unlocked: boolean;

    if (lock.kind === 'free') {
      unlocked = true;
    } else if (lock.kind === 'award') {
      unlocked = awards.has(lock.award);
    } else if (lock.kind === 'awards') {
      unlocked = holdsEvery(awards, lock.awards);
    } else {
      // The class' own wins rather than the trade's: beating
      // Kanto's swimmers never dressed anybody as a Johto one
      unlocked =
        (standings.variants.get(lock.trainer)?.tier ?? AchievementTier.None) >=
        AchievementTier.Bronze;
    }
    if (unlocked) {
      sheets.push(sheet);
    }
  }
  return sheets;
}

function heldAwards(held: AwardRecord[]): Set<Awards> {
  const awards = new Set<Awards>();

  for (const entry of held) {
    awards.add(entry.award);
  }
  return awards;
}

function holdsEvery(awards: Set<Awards>, wanted: Iterable<Awards>): boolean {
  for (const award of wanted) {
    if (!awards.has(award)) {
      return false;
    }
  }
  return true;
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
