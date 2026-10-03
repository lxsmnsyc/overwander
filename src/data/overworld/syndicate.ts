import * as v from 'valibot';
import type Awards from '../ids/awards';
import type Biome from '../ids/biome';
import Executive from '../ids/executives';
import { AWARD_IDS, BIOME_IDS, EXECUTIVE_IDS, SYNDICATE_IDS } from '../ids/names';
import Syndicate from '../ids/syndicates';
import executiveTextFile from '../text/en/executives.yaml';
import syndicateTextFile from '../text/en/syndicates.yaml';
import { idOf, idsOf } from '../yaml';
import executivesFile from './executives.yaml';
import syndicatesFile from './syndicates.yaml';

export { Executive, Syndicate };

/**
 * The syndicates and the executives who answer to their bosses, read
 * out of `syndicates.yaml`, `executives.yaml` and their text under
 * `text/en/`; the numbers are `ids/syndicates.ts` and
 * `ids/executives.ts`
 */
const RANK = v.object({ sheets: v.array(v.string()), honor: v.string() });

const SYNDICATE = v.object({
  grunt: RANK,
  executives: v.array(v.string()),
  boss: RANK,
  biomes: v.array(v.string()),
});

const SYNDICATE_TEXT = v.object({
  name: v.string(),
  boss: v.string(),
  'boss-title': v.string(),
  'executive-title': v.string(),
  'boss-quote': v.string(),
  'grunt-quote': v.string(),
});

const EXECUTIVE_TEXT = v.object({ name: v.string(), quote: v.string() });

export const EXECUTIVE_NAMES: Record<number, string> = {};

export const EXECUTIVE_CHARSETS: Record<number, string[]> = {};

/** The mark putting one of them down is worth, one to each */
export const EXECUTIVE_HONORS: Record<number, Awards> = {};

/** What each says as they bar the cell */
export const EXECUTIVE_QUOTES: Record<number, string> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), RANK), executivesFile))) {
  const where = `executives.yaml: ${name}`;
  const executive = idOf<Executive>(EXECUTIVE_IDS, name, where);

  EXECUTIVE_CHARSETS[executive] = written.sheets;
  EXECUTIVE_HONORS[executive] = idOf<Awards>(AWARD_IDS, written.honor, where);
}
for (const [name, said] of Object.entries(
  v.parse(v.record(v.string(), EXECUTIVE_TEXT), executiveTextFile),
)) {
  const executive = idOf<Executive>(EXECUTIVE_IDS, name, `text/en/executives.yaml: ${name}`);

  EXECUTIVE_NAMES[executive] = said.name;
  EXECUTIVE_QUOTES[executive] = said.quote;
}

/** Every team, in the order they are numbered */
export const SYNDICATES: Syndicate[] = [];

export const SYNDICATE_NAMES: Record<number, string> = {};

/** The uniform the rank and file are met in */
export const SYNDICATE_GRUNT_CHARSETS: Record<number, string[]> = {};

/**
 * One mark for clearing a cell of that team's rank and file, however
 * many are put down: a grunt is a uniform rather than a person
 */
export const SYNDICATE_GRUNT_HONORS: Record<number, Awards> = {};

/**
 * Who answers to each boss. Rolled apart from the rank, so a team
 * with two of them is no likelier to field one than a team with four
 */
export const SYNDICATE_EXECUTIVES: Record<number, Executive[]> = {};

export const SYNDICATE_BOSS_NAMES: Record<number, string> = {};

export const SYNDICATE_BOSS_CHARSETS: Record<number, string[]> = {};

export const SYNDICATE_BOSS_HONORS: Record<number, Awards> = {};

/** What each boss says as they bar the cell */
export const SYNDICATE_BOSS_QUOTES: Record<number, string> = {};

/** What the rank and file say as they bar the cell */
export const SYNDICATE_GRUNT_QUOTES: Record<number, string> = {};

/**
 * What each team calls its own ranks. A person at one of these
 * landmarks is introduced the way the games introduce them, team
 * first and title before the name, so who is standing there says
 * which organisation and how far up it in one line
 */
export const SYNDICATE_BOSS_TITLES: Record<number, string> = {};

export const SYNDICATE_EXECUTIVE_TITLES: Record<number, string> = {};

/**
 * Whose cell each biome is. A biome nobody claims is Rocket's, so one
 * added later belongs to Rocket until somebody says otherwise; where
 * two claim one, the team written later keeps it
 */
const CLAIMED = new Map<Biome, Syndicate>();

for (const [name, written] of Object.entries(
  v.parse(v.record(v.string(), SYNDICATE), syndicatesFile),
)) {
  const where = `syndicates.yaml: ${name}`;
  const syndicate = idOf<Syndicate>(SYNDICATE_IDS, name, where);

  SYNDICATES.push(syndicate);
  SYNDICATE_GRUNT_CHARSETS[syndicate] = written.grunt.sheets;
  SYNDICATE_GRUNT_HONORS[syndicate] = idOf<Awards>(AWARD_IDS, written.grunt.honor, where);
  SYNDICATE_EXECUTIVES[syndicate] = idsOf<Executive>(EXECUTIVE_IDS, written.executives, where);
  SYNDICATE_BOSS_CHARSETS[syndicate] = written.boss.sheets;
  SYNDICATE_BOSS_HONORS[syndicate] = idOf<Awards>(AWARD_IDS, written.boss.honor, where);
  for (const biome of idsOf<Biome>(BIOME_IDS, written.biomes, where)) {
    CLAIMED.set(biome, syndicate);
  }
}
SYNDICATES.sort((one, two) => one - two);

for (const [name, said] of Object.entries(
  v.parse(v.record(v.string(), SYNDICATE_TEXT), syndicateTextFile),
)) {
  const syndicate = idOf<Syndicate>(SYNDICATE_IDS, name, `text/en/syndicates.yaml: ${name}`);

  SYNDICATE_NAMES[syndicate] = said.name;
  SYNDICATE_BOSS_NAMES[syndicate] = said.boss;
  SYNDICATE_BOSS_TITLES[syndicate] = said['boss-title'];
  SYNDICATE_EXECUTIVE_TITLES[syndicate] = said['executive-title'];
  SYNDICATE_BOSS_QUOTES[syndicate] = said['boss-quote'];
  SYNDICATE_GRUNT_QUOTES[syndicate] = said['grunt-quote'];
}

// Every team and every executive the enums have is written down, so
// nobody bars a cell nameless or bare
for (const [name, syndicate] of Object.entries(SYNDICATE_IDS)) {
  if (
    !Object.hasOwn(SYNDICATE_BOSS_HONORS, syndicate) ||
    !Object.hasOwn(SYNDICATE_NAMES, syndicate)
  ) {
    throw new Error(`${name} needs a record in syndicates.yaml and its words in text/en`);
  }
}
for (const [name, executive] of Object.entries(EXECUTIVE_IDS)) {
  if (!Object.hasOwn(EXECUTIVE_HONORS, executive) || !Object.hasOwn(EXECUTIVE_NAMES, executive)) {
    throw new Error(`${name} needs a record in executives.yaml and its words in text/en`);
  }
}

/** Whose cell this is, in this biome */
export function getSyndicate(biome: Biome): Syndicate {
  return CLAIMED.get(biome) ?? Syndicate.Rocket;
}

/** "Team Aqua Leader Archie" */
export function bossName(syndicate: Syndicate): string {
  return `${SYNDICATE_NAMES[syndicate]} ${SYNDICATE_BOSS_TITLES[syndicate]} ${SYNDICATE_BOSS_NAMES[syndicate]}`;
}

/** "Team Magma Admin Tabitha" */
export function executiveName(syndicate: Syndicate, executive: Executive): string {
  return `${SYNDICATE_NAMES[syndicate]} ${SYNDICATE_EXECUTIVE_TITLES[syndicate]} ${EXECUTIVE_NAMES[executive]}`;
}

/** "Team Aqua Grunt", who is a uniform rather than a person */
export function gruntName(syndicate: Syndicate): string {
  return `${SYNDICATE_NAMES[syndicate]} Grunt`;
}

/** Every mark they pay, for the shelf that lists them */
export const SYNDICATE_HONORS: Awards[] = (() => {
  const honors: Awards[] = [];

  for (const syndicate of SYNDICATES) {
    honors.push(SYNDICATE_GRUNT_HONORS[syndicate]);
    for (const executive of SYNDICATE_EXECUTIVES[syndicate]) {
      honors.push(EXECUTIVE_HONORS[executive]);
    }
    honors.push(SYNDICATE_BOSS_HONORS[syndicate]);
  }
  return honors;
})();
