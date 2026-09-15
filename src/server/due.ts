import 'server-only';
import { QUESTS } from '../data/quests';
import { dailyWindow, weeklyWindow } from '../data/quests/rotations';
import { readProgress } from './quest-progress';
import { listQuests } from './quests';
import { listRotations } from './rotations';

/**
 * What is standing ready to claim, for the announcement rather than
 * the board.
 *
 * The board says the same thing in more detail, and a player reading
 * it needs no toast; this is for the one out walking who has just
 * finished something without knowing it. Each ask carries a key that
 * is stable for as long as the ask is, so it is said once — a
 * rotating one's key holds its window, and a new day says it again
 */

export interface DueQuest {
  key: string;
  name: string;
}

export default async function listDueQuests(uid: string, now: number): Promise<DueQuest[]> {
  // Both boards count the same progress, and every signed-in player
  // polls this, so it is read once and handed to both
  const progress = await readProgress(uid);
  const [board, rotations] = await Promise.all([
    listQuests(uid, progress),
    listRotations(uid, now, progress),
  ]);
  const due: DueQuest[] = [];

  for (const standing of board) {
    if (standing.claimable) {
      due.push({ key: `quest-${standing.quest}`, name: QUESTS[standing.quest].name });
    }
  }
  for (const standing of rotations.daily) {
    if (standing.claimable) {
      due.push({
        key: `daily-${dailyWindow(now)}-${standing.quest.slot}`,
        name: standing.quest.name,
      });
    }
  }
  if (rotations.weekly.claimable) {
    due.push({ key: `weekly-${weeklyWindow(now)}`, name: rotations.weekly.quest.name });
  }
  return due;
}
