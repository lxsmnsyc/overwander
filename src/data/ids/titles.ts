import { TYPE_NAMES, type Types } from '../constants/types';
import { TRAINER_BASE_NAMES, TRAINER_TRADES, type TrainerClass } from '../overworld/trainers';
import Regions from './regions';
import { REGIONS, REGION_NAMES } from '../species/regions';
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
 * lines' (base at even, Master at odd), 200-299 the types'
 * (Specialist at even, Master at odd), 300-399 the trainer trades'
 * (the trade's name at even, Master at odd), and 400+ the regions'
 * professor, one apiece
 */
export type Title = number;

export const enum LadderTitle {
  /** All 8 of the region's badges */
  LeagueChallenger = 0,
  /** All 4 of the Elite Four beaten */
  EliteConqueror = 1,
  /** The Champion's own seat */
  KantoChampion = 2,
  JohtoChampion = 3,
  /** Any legend's mark: the fight the league does not ask for */
  LegendBreaker = 4,
}

const LINE_TITLE_BASE = 100;
const TYPE_TITLE_BASE = 200;
const TRAINER_TITLE_BASE = 300;
const PROFESSOR_TITLE_BASE = 400;

/** The title an achievement line's Bronze (or, `master`, Platinum) tier unlocks */
export function lineTitle(line: AchievementLine, master: boolean): Title {
  return LINE_TITLE_BASE + line * 2 + (master ? 1 : 0);
}

/** The title a type line's Bronze (or, `master`, Platinum) tier unlocks */
export function typeTitle(type: Types, master: boolean): Title {
  return TYPE_TITLE_BASE + type * 2 + (master ? 1 : 0);
}

/**
 * The title a trainer line's Bronze (or, `master`, Platinum) tier
 * unlocks: beating enough Bug Catchers is what lets a player be
 * called one. It is the **trade** that is titled, so both regions'
 * count towards the one title
 */
export function trainerTitle(trade: TrainerClass, master: boolean): Title {
  return TRAINER_TITLE_BASE + trade * 2 + (master ? 1 : 0);
}

/**
 * The achievement line a title belongs to, or null for one that is
 * not a line's. The wearer's tier on this line is what colours the
 * badge the title is worn on
 */
export function titleLine(title: Title): AchievementLine | null {
  if (title < LINE_TITLE_BASE || title >= TYPE_TITLE_BASE) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const line = Math.floor((title - LINE_TITLE_BASE) / 2) as AchievementLine;

  return ACHIEVEMENT_LINES.includes(line) ? line : null;
}

/** The type line a title belongs to, or null for one that is not a type's */
export function titleType(title: Title): Types | null {
  if (title < TYPE_TITLE_BASE || title >= TRAINER_TITLE_BASE) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const type = Math.floor((title - TYPE_TITLE_BASE) / 2) as Types;

  return ACHIEVEMENT_TYPES.includes(type) ? type : null;
}

/**
 * The title filling a region's pokedex is worth: the region's own
 * professor, since the dex was theirs to fill
 */
export function professorTitle(region: Regions): Title {
  return PROFESSOR_TITLE_BASE + region;
}

/** The region a professor title belongs to, or null for anything else */
export function titleProfessor(title: Title): Regions | null {
  if (title < PROFESSOR_TITLE_BASE) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const region = (title - PROFESSOR_TITLE_BASE) as Regions;

  return REGIONS.includes(region) && region !== Regions.Unknown ? region : null;
}

/**
 * The trainer trade a title belongs to, or null for one that is not a
 * trade's
 */
export function titleTrainer(title: Title): TrainerClass | null {
  if (title < TRAINER_TITLE_BASE || title >= PROFESSOR_TITLE_BASE) {
    return null;
  }

  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const trainer = Math.floor((title - TRAINER_TITLE_BASE) / 2) as TrainerClass;

  // A trade carries the title, so a region's own class resolves to
  // none: there is no Swimmer (Johto) title, only a Swimmer one
  return TRAINER_TRADES.includes(trainer) ? trainer : null;
}

const LADDER_TITLE_NAMES: Record<LadderTitle, string> = {
  [LadderTitle.LeagueChallenger]: 'League Challenger',
  [LadderTitle.EliteConqueror]: 'Elite Conqueror',
  [LadderTitle.KantoChampion]: 'Kanto Champion',
  [LadderTitle.JohtoChampion]: 'Johto Champion',
  [LadderTitle.LegendBreaker]: 'Legend Breaker',
};

/**
 * What a title is called, or null for a number that names none: a
 * stored title is only ever shown through here, so a stale id reads
 * as no title rather than as garbage
 */
export function getTitleName(title: Title): string | null {
  const region = titleProfessor(title);

  if (region != null) {
    const name = REGION_NAMES[region];

    return `${name.slice(0, 1).toUpperCase()}${name.slice(1)} Professor`;
  }

  const trainer = titleTrainer(title);

  if (trainer != null) {
    // The mainline's own name, not the region-tagged one: a title is
    // what a player is called, and nobody is called a Swimmer (Johto)
    const name = TRAINER_BASE_NAMES[trainer];

    return title % 2 === 1 ? `Master ${name}` : name;
  }

  const type = titleType(title);

  if (type != null) {
    const name = TYPE_NAMES[type];

    return title % 2 === 1 ? `${name} Master` : `${name} Specialist`;
  }

  const line = titleLine(title);

  if (line != null) {
    const name = LINE_NAMES[line];

    return title % 2 === 1 ? `Master ${name}` : name;
  }
  if (title >= LINE_TITLE_BASE) {
    return null;
  }

  const ladder: Record<number, string> = LADDER_TITLE_NAMES;

  return ladder[title] ?? null;
}
