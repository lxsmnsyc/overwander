import Awards from '../ids/awards';
import {
  CHAMPIONS,
  CHAMPION_CHARSETS,
  CHAMPION_NAMES,
  CHAMPION_PRIZE_CHARSETS,
  CHAMPION_TITLES,
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  ELITE_MEMBER_NAMES,
  GYM_LEADERS,
  GYM_LEADER_BADGES,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_LATER_CHARSETS,
  GYM_LEADER_NAMES,
  GYM_LEADER_PRIZE_CHARSETS,
  LEGENDS,
  LEGEND_HONORS,
  LEGEND_NAMES,
  LEGEND_PRIZE_CHARSETS,
} from './experts';
import Npc, {
  GIOVANNI_CHARSETS,
  GIOVANNI_HONOR,
  GIOVANNI_NAME,
  NPC_NAMES,
  ROCKET_EXECUTIVES,
  ROCKET_EXECUTIVE_CHARSETS,
  ROCKET_EXECUTIVE_HONORS,
  ROCKET_EXECUTIVE_NAMES,
  ROCKET_GRUNT_HONOR,
  npcSheets,
} from './npc';
import {
  TRAINER_BASE_NAMES,
  TRAINER_CHARSETS,
  TRAINER_CLASSES,
  type TrainerClass,
} from './trainers';

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
  /** Held by whoever holds every one of them: a coat two deeds wide */
  | { kind: 'awards'; awards: Awards[] }
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
 * The coats an award pays that nobody in the world wears.
 *
 * Everything else here is somebody a walk can run into, and their
 * coats are the ones they are drawn in. These are people the game
 * does not stage: the professors, and Blue as the man who took
 * Viridian's gym back after his year at the top. A coat listing two
 * awards asks for both
 */
const AWARDED_CHARSETS: { sheet: string; name: string; awards: Awards[] }[] = [
  {
    sheet: 'characters/hgss/blue',
    name: 'Blue',
    awards: [Awards.KantoChampion, Awards.JohtoChampion],
  },
  { sheet: 'characters/frlg/oak', name: 'Professor Oak', awards: [Awards.KantoDexMedal] },
  { sheet: 'characters/lgpe/oak', name: 'Professor Oak', awards: [Awards.KantoDexMedal] },
  { sheet: 'characters/hgss/elm', name: 'Professor Elm', awards: [Awards.JohtoDexMedal] },
  {
    sheet: 'characters/hgss/oak',
    name: 'Professor Oak',
    awards: [Awards.KantoDexMedal, Awards.JohtoDexMedal],
  },
  { sheet: 'characters/oras/birch', name: 'Professor Birch', awards: [Awards.HoennDexMedal] },
];

/**
 * Who a sheet is, where that is not who unlocks it. One entry: by
 * Johto's era the Fuchsia gym is Janine's, and it is her father's
 * badge that pays it
 */
const SHEET_PEOPLE: Record<string, string> = {
  'characters/hgss/janine': 'Janine',
};

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
    for (const sheet of [
      ...GYM_LEADER_CHARSETS[leader],
      ...(GYM_LEADER_PRIZE_CHARSETS[leader] ?? []),
    ]) {
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
    for (const sheet of [
      ...CHAMPION_CHARSETS[champion],
      ...(CHAMPION_PRIZE_CHARSETS[champion] ?? []),
    ]) {
      add(sheet, CHAMPION_NAMES[champion], {
        kind: 'award',
        award: CHAMPION_TITLES[champion],
      });
    }
  }
  for (const sheet of GIOVANNI_CHARSETS) {
    add(sheet, GIOVANNI_NAME, { kind: 'award', award: GIOVANNI_HONOR });
  }
  for (const executive of ROCKET_EXECUTIVES) {
    for (const sheet of ROCKET_EXECUTIVE_CHARSETS[executive]) {
      add(sheet, ROCKET_EXECUTIVE_NAMES[executive], {
        kind: 'award',
        award: ROCKET_EXECUTIVE_HONORS[executive],
      });
    }
  }
  for (const sheet of npcSheets(Npc.RocketGrunt)) {
    add(sheet, NPC_NAMES[Npc.RocketGrunt], { kind: 'award', award: ROCKET_GRUNT_HONOR });
  }
  for (const { sheet, name, awards } of AWARDED_CHARSETS) {
    add(
      sheet,
      name,
      awards.length === 1 ? { kind: 'award', award: awards[0] } : { kind: 'awards', awards },
    );
  }
  // A Kanto gym's later look, which is the badge and Johto's crown
  for (const leader of GYM_LEADERS) {
    for (const sheet of GYM_LEADER_LATER_CHARSETS[leader] ?? []) {
      add(sheet, SHEET_PEOPLE[sheet] ?? GYM_LEADER_NAMES[leader], {
        kind: 'awards',
        awards: [GYM_LEADER_BADGES[leader], Awards.JohtoChampion],
      });
    }
  }
  for (const legend of LEGENDS) {
    for (const sheet of LEGEND_PRIZE_CHARSETS[legend]) {
      add(sheet, LEGEND_NAMES[legend], { kind: 'award', award: LEGEND_HONORS[legend] });
    }
  }
  // Every class rather than every trade: a coat is one region's own,
  // and it is that region's wins that open it
  for (const trainer of TRAINER_CLASSES) {
    for (const sheet of TRAINER_CHARSETS[trainer]) {
      add(sheet, TRAINER_BASE_NAMES[trainer], { kind: 'trainer', trainer });
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
