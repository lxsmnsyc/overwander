import type Awards from '../ids/awards';
import {
  CHAMPIONS,
  CHAMPION_CHARSETS,
  CHAMPION_NAMES,
  CHAMPION_TITLES,
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  ELITE_MEMBER_NAMES,
  GYM_LEADERS,
  GYM_LEADER_BADGES,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_NAMES,
} from './experts';
import { ACHIEVEMENT_TRAINERS } from '../achievements';
import { TRAINER_CHARSETS, TRAINER_NAMES, type TrainerClass } from './trainers';

/**
 * Who a trainer is seen as: the overworld character standing beside
 * their name, and the one walking their chunk.
 *
 * Nothing here is a new list. Every gym leader, every one of the Elite
 * Four and every class of duelling trainer already names the charsets
 * they are drawn in, and already names the award or the achievement
 * line that beating them settles. A sprite is unlocked by the same
 * thing, which is why this file is derivations rather than a table:
 * beat the Bug Catchers often enough and you may go about dressed as
 * one.
 */

/** How a charset is unlocked. */
export type CharsetLock =
  /** Nobody has to do anything: the two the game starts you as */
  | { kind: 'free' }
  /** Held by whoever holds the award, which is a badge or a seat */
  | { kind: 'award'; award: Awards }
  /** Held at Bronze in that class' line, the way its title is */
  | { kind: 'trainer'; trainer: TrainerClass };

/** One character a trainer may go about as. */
export interface Charset {
  /** The sheet, under `sprites/overworld` */
  sheet: string;
  /** Who it is, for the picker and for the profile */
  name: string;
  lock: CharsetLock;
}

/**
 * The two the game starts you as, and the only two nobody has to earn.
 * Both are player characters rather than somebody met on the road,
 * which is what makes them the pair to choose between at the start
 */
export const FREE_CHARSETS = ['characters/frlg/red', 'characters/frlg/leaf'];

/** What the game draws a trainer as before they have chosen. */
export const DEFAULT_CHARSET = FREE_CHARSETS[0];

/**
 * Every charset a trainer can wear, and what unlocks it.
 *
 * A sheet named by two sources keeps the first claim on it, which is
 * how Red stays free rather than becoming the Champion's: the free
 * pair is laid down first and nothing later overwrites it
 */
function buildCharsets(): Charset[] {
  const found = new Map<string, Charset>();
  const add = (sheet: string, name: string, lock: CharsetLock): void => {
    if (!found.has(sheet)) {
      found.set(sheet, { sheet, name, lock });
    }
  };

  add(FREE_CHARSETS[0], 'Red', { kind: 'free' });
  add(FREE_CHARSETS[1], 'Leaf', { kind: 'free' });

  for (const leader of GYM_LEADERS) {
    for (const sheet of GYM_LEADER_CHARSETS[leader]) {
      add(sheet, GYM_LEADER_NAMES[leader], { kind: 'award', award: GYM_LEADER_BADGES[leader] });
    }
  }
  for (const member of ELITE_MEMBERS) {
    for (const sheet of ELITE_MEMBER_CHARSETS[member]) {
      add(sheet, ELITE_MEMBER_NAMES[member], {
        kind: 'award',
        award: ELITE_MEMBER_HONORS[member],
      });
    }
  }
  for (const champion of CHAMPIONS) {
    for (const sheet of CHAMPION_CHARSETS[champion]) {
      add(sheet, CHAMPION_NAMES[champion], {
        kind: 'award',
        award: CHAMPION_TITLES[champion],
      });
    }
  }
  for (const trainer of ACHIEVEMENT_TRAINERS) {
    for (const sheet of TRAINER_CHARSETS[trainer]) {
      add(sheet, TRAINER_NAMES[trainer], { kind: 'trainer', trainer });
    }
  }
  return [...found.values()];
}

export const CHARSETS: Charset[] = buildCharsets();

const BY_SHEET = new Map(CHARSETS.map((charset) => [charset.sheet, charset]));

export function getCharset(sheet: string): Charset | null {
  return BY_SHEET.get(sheet) ?? null;
}

/**
 * What to call the character on a sheet. Two styles of the same person
 * are the same person, so the style is said after the name: a player
 * choosing between two Brocks is choosing which game's Brock
 */
export function getCharsetName(sheet: string): string {
  const known = getCharset(sheet);

  if (known == null) {
    return 'Trainer';
  }
  const [, style] = sheet.split('/');

  return style === '' ? known.name : `${known.name} (${style.toUpperCase()})`;
}
