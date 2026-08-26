import { TYPE_NAMES, type Types } from '../constants/types';
import {
  ACHIEVEMENT_LINES,
  ACHIEVEMENT_TYPES,
  type AchievementLine,
  LINE_NAMES,
} from '../achievements';

/**
 * Player titles: one may be worn on the profile at a time. A title is
 * a number rather than an enum entry per name because nearly all of
 * them are systematic — every achievement line carries a pair, every
 * type carries a pair — and a table of 60 hand-written entries would
 * only be something to fall out of step with.
 *
 * The id space: 0-99 the ladder titles, 100-199 the achievement
 * lines' (base at even, Master at odd), 200+ the types' (Specialist
 * at even, Master at odd)
 */
export type Title = number;

export const enum LadderTitle {
  /** All 8 of the region's badges */
  LeagueChallenger = 0,
  /** All 4 of the Elite Four beaten */
  EliteConqueror = 1,
  /** The Champion's own seat */
  KantoChampion = 2,
}

const LINE_TITLE_BASE = 100;
const TYPE_TITLE_BASE = 200;

/** The title an achievement line's Gold (or, `master`, Platinum) tier unlocks */
export function lineTitle(line: AchievementLine, master: boolean): Title {
  return LINE_TITLE_BASE + line * 2 + (master ? 1 : 0);
}

/** The title a type line's Gold (or, `master`, Platinum) tier unlocks */
export function typeTitle(type: Types, master: boolean): Title {
  return TYPE_TITLE_BASE + type * 2 + (master ? 1 : 0);
}

const LADDER_TITLE_NAMES: Record<LadderTitle, string> = {
  [LadderTitle.LeagueChallenger]: 'League Challenger',
  [LadderTitle.EliteConqueror]: 'Elite Conqueror',
  [LadderTitle.KantoChampion]: 'Kanto Champion',
};

/**
 * What a title is called, or null for a number that names none: a
 * stored title is only ever shown through here, so a stale id reads
 * as no title rather than as garbage
 */
export function getTitleName(title: Title): string | null {
  if (title >= TYPE_TITLE_BASE) {
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const type = Math.floor((title - TYPE_TITLE_BASE) / 2) as Types;

    if (!ACHIEVEMENT_TYPES.includes(type)) {
      return null;
    }

    const name = TYPE_NAMES[type];

    return title % 2 === 1 ? `${name} Master` : `${name} Specialist`;
  }
  if (title >= LINE_TITLE_BASE) {
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const line = Math.floor((title - LINE_TITLE_BASE) / 2) as AchievementLine;

    if (!ACHIEVEMENT_LINES.includes(line)) {
      return null;
    }

    const name = LINE_NAMES[line];

    return title % 2 === 1 ? `Master ${name}` : name;
  }
  const ladder: Record<number, string> = LADDER_TITLE_NAMES;

  return ladder[title] ?? null;
}
