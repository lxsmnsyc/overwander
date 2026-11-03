import * as v from 'valibot';
import type Biome from '../ids/biome';
import type { SettledBiome } from '../ids/biome';
import { BIOME_IDS } from '../ids/names';
import { type Locale, baseLocale, currentLocale } from '../../i18n/locale';
import { idOf, localeFile } from '../yaml';

/**
 * What a town is called.
 *
 * Everywhere else in the world is named by what it is and where, the
 * way `namePlace` says "Taiga (12, -3)". A town is the one thing
 * players tell each other about and travel to by name, so it gets a
 * name of its own, and the name has to say something true about the
 * country it stands in: the head is drawn from its own biome's word
 * list, so a glacier town reads cold before anybody looks at the map.
 *
 * A name is worked out from where the town is, never rolled, and it
 * is five parts: an optional mark, a head, a tail welded onto it, a
 * title, and the county. Every region of a county lands on a name of
 * its own, so **two towns can never share one** and nothing has to ask
 * a store whether a name is free.
 *
 *     8 heads x 40 tails x 12 titles          = 3,840 unmarked
 *     ...and 12 marks over those               = 49,920 in all
 *     against a county's                       = 4,096 regions
 *
 * The county is what makes that fit, and what keeps it fitting. A roll
 * without one would be 262,144 regions against 49,920 names, five
 * times more world than words. See `COUNTY_NAMES`.
 *
 * The words are `text/<locale>/town-names.yaml`; how they are put
 * together is here.
 *
 * Each locale brings word lists of its own, the same lengths in the same
 * order as English, so a town is the same town in every language: it
 * keeps its place in each list and only the words change. A locale that
 * writes no file reads English. A locale that writes one writes all of
 * it, and joins the parts its own way (see `TOWN_JOINERS`)
 */

const WORDS = v.strictObject({
  heads: v.record(v.string(), v.array(v.string())),
  tails: v.array(v.string()),
  titles: v.array(v.string()),
  marks: v.array(v.string()),
  counties: v.array(v.string()),
});

type Words = v.InferOutput<typeof WORDS>;

/** The head lists by biome id, once their names are read */
function readHeads(heads: Words['heads'], where: string): Record<number, string[]> {
  const read: Record<number, string[]> = {};

  for (const [name, list] of Object.entries(heads)) {
    const at = `${where}: ${name}`;

    // The arithmetic below reads eight to a biome, and one short or over
    // would rename every town of it
    if (list.length !== 8) {
      throw new Error(`${at}: needs exactly 8 heads`);
    }
    read[idOf<Biome>(BIOME_IDS, name, at)] = list;
  }
  return read;
}

/** A locale's lists hold the places English's do, so a town keeps its name's place in all of them */
export function checkTownWords(written: Words, english: Words, where: string): void {
  for (const list of ['tails', 'titles', 'marks', 'counties'] as const) {
    if (written[list].length !== english[list].length) {
      throw new Error(
        `${where}: ${list} has ${written[list].length} words, English has ${english[list].length}`,
      );
    }
  }
  for (const name of Object.keys(english.heads)) {
    if (!Object.hasOwn(written.heads, name)) {
      throw new Error(`${where}: heads has no ${name}`);
    }
  }
  readHeads(written.heads, where);
}

const TOWN_WORDS = localeFile(
  import.meta.glob('../text/*/town-names.yaml', { eager: true, import: 'default' }),
  'text/<locale>/town-names.yaml',
  WORDS,
  checkTownWords,
);

const words = TOWN_WORDS.english;

/**
 * The head of a name, by the biome the town stands on. One entry per
 * country a town can be settled on and no others: the open seas and
 * `Beyond` are out of the type rather than filled with words nothing
 * would ever reach. Total, so a biome added to the world cannot be
 * built on until it has been given words. Public so a test can hold
 * it to that
 */
export const TOWN_HEADS: Record<number, string[]> = readHeads(
  words.heads,
  'text/en/town-names.yaml',
);

/**
 * What is welded onto the head, which is what makes the name one word
 * rather than two. Shared across the world: the ground a town stands
 * on says where it is, and a tail says what shape the place takes
 */
const TAILS: string[] = words.tails;

/**
 * What the place calls itself. Rolled rather than taken from how many
 * lots the town has: a title that tracked the size would be a fifth
 * of the names gone, and a hamlet with a gym in it is the sort of
 * thing a real map is full of
 */
const TITLES: string[] = words.titles;

/**
 * The word in front, where there is one. Most towns have none, since
 * a world where every place is an Upper or a New reads as a joke
 */
const MARKS: string[] = words.marks;

/**
 * The counties the world is divided into, which is the second half of
 * every town's name.
 *
 * A name has to be unique, and nothing that only looks at one town can
 * promise that on its own: the world has 262,144 regions and one
 * biome's words make 49,920 names, so a roll would run out five times
 * over. Dividing the world settles it. A name only has to be unique
 * inside **one county and one biome**, and a county holds 4,096
 * regions, so the words already have room to spare and always will.
 *
 * The division is what makes this independent of how big the world is.
 * A county is `floor(region / 64)`, which reads a town's own
 * coordinates and nothing else, so a world grown larger leaves every
 * existing town in the county it was already in, under the name it
 * already had. It only wants more counties at the edges
 */
export const COUNTY_NAMES: string[] = words.counties;

/** How many regions to a county, on each axis */
export const COUNTY_REGIONS = 64;

/** How many counties the world is divided into, on each axis */
export const COUNTY_GRID = 8;

/** The regions of one county, which is what a local name tells apart */
const COUNTY_SPAN = COUNTY_REGIONS * COUNTY_REGIONS;

/** How many words of its own each biome brings */
export const HEADS_PER_BIOME = 8;

/** The names that carry no mark in front, which is most of them */
const PLAIN_NAMES = HEADS_PER_BIOME * TAILS.length * TITLES.length;

/** How many names the parts can make for one biome */
export const NAMES_PER_BIOME = PLAIN_NAMES * (MARKS.length + 1);

/**
 * What a county's regions are stirred by before they are read off as
 * words. Odd, so multiplying by it is a bijection on the county rather
 * than a collision: without it, neighbouring towns would read as a
 * numbered sequence with only the last word changing
 */
const SPIN = 2_731;

/**
 * And what the few marked names are stirred by. Coprime with
 * `PLAIN_NAMES`, so those are spread over the whole list rather than
 * bunched at its front
 */
const STEP = 1_009;

/** The parts of a name, before a locale puts them together */
export interface TownParts {
  /** The word in front, or null for the towns that carry none */
  mark: string | null;
  head: string;
  /** What is welded onto the head in English, one word with it */
  tail: string;
  title: string;
  county: string;
}

/** The Spanish titles that take a feminine adjective */
const FEMININE_TITLES = new Set(['Ciudad', 'Aldea', 'Parada']);

/** The Spanish titles that are plural */
const PLURAL_TITLES = new Set(['Molinos']);

/** The marks that are adjectives, by the stem they inflect from */
const ADJECTIVE_MARKS = new Map([
  ['Nuevo', 'Nuev'],
  ['Viejo', 'Viej'],
  ['Alto', 'Alt'],
  ['Bajo', 'Baj'],
  ['Pequeño', 'Pequeñ'],
]);

/** A Spanish mark made to agree with the title it follows ("Ciudad Nueva", "Molinos Nuevos") */
function agreeSpanish(mark: string, title: string): string {
  const stem = ADJECTIVE_MARKS.get(mark);

  if (stem == null) {
    return mark;
  }
  return `${stem}${FEMININE_TITLES.has(title) ? 'a' : 'o'}${PLURAL_TITLES.has(title) ? 's' : ''}`;
}

/**
 * How a locale puts a name together, for a locale that writes its own
 * word lists. English welds the tail onto the head, sets the title
 * after and the county last. A locale with no joiner of its own joins
 * the English way
 */
export const TOWN_JOINERS: Record<string, (parts: TownParts) => string> = {
  [baseLocale]: ({ mark, head, tail, title, county }) =>
    `${mark == null ? '' : `${mark} `}${head}${tail} ${title}, ${county}`,
  // Like "さざなみぐんの しんかいがらやまタウン": the county first and set off
  // by ぐんの, as an address runs from the largest place down, then the name
  // in one word (mark, head, tail), then the title. タウン and シティ weld on
  // as in the games; the other titles are words of their own and stand apart
  ja: ({ mark, head, tail, title, county }) =>
    `${county}ぐんの ${mark ?? ''}${head}${tail}${/^\p{Script=Katakana}/u.test(title) ? '' : ' '}${title}`,
  // Title first, then the mark, as in "Ciudad Nueva Concha del Risco, Marca
  // Ceniza". The mark agrees with the title like "Ciudad Real" and "Pueblo
  // Nuevo" do, and the tail is a phrase of its own ("del Risco")
  es: ({ mark, head, tail, title, county }) =>
    `${title} ${mark == null ? '' : `${agreeSpanish(mark, title)} `}${head} ${tail}, ${county}`,
};

/** The head lists of each locale's words by biome id, read once */
const HEADS_BY_WORDS = new WeakMap<object, Record<number, string[]>>();

/** The words this locale builds names from, and the joiner that goes with them */
function townWordsFor(locale: Locale): {
  words: Words;
  heads: Record<number, string[]>;
  join: (parts: TownParts) => string;
} {
  const here = TOWN_WORDS.read();
  let heads = HEADS_BY_WORDS.get(here);

  if (heads == null) {
    heads = readHeads(here.heads, `text/${locale}/town-names.yaml`);
    HEADS_BY_WORDS.set(here, heads);
  }
  // English words keep English's joiner, whatever the locale: a locale
  // that has written no lists reads English names, not half translated ones
  const own = here !== words && Object.hasOwn(TOWN_JOINERS, locale);

  return { words: here, heads, join: TOWN_JOINERS[own ? locale : baseLocale] };
}

/** Where a region sits inside its own county, on one axis */
function withinCounty(region: number): number {
  return ((region % COUNTY_REGIONS) + COUNTY_REGIONS) % COUNTY_REGIONS;
}

/** Which county a region falls in, on one axis */
function countyOf(region: number): number {
  return Math.floor(region / COUNTY_REGIONS);
}

/**
 * What a town is called: its own name, then the county it stands in.
 *
 * Worked out rather than rolled, which is the whole point. Every
 * region of a county lands on a different name, so two towns can never
 * be called the same thing and nothing has to ask a store whether a
 * name is free. A county holds 4,096 regions and the words make 49,920
 * names, so 3,840 of them are spent before a mark is reached for at
 * all: about 1 town in 16 carries one, which is what keeps a mark a
 * flourish rather than a fixture.
 *
 * The head is the town's own biome's, so the name still says something
 * true about the country before the map is looked at, and no two
 * biomes share a head, so the biome never has to be encoded
 */
export default function nameTown(regionX: number, regionY: number, biome: SettledBiome): string {
  const countyX = countyOf(regionX) + COUNTY_GRID / 2;
  const countyY = countyOf(regionY) + COUNTY_GRID / 2;

  // Each axis on its own. Checking the two of them added together
  // would let a region off the world's west edge fold back onto a
  // county that really exists, and share its names
  if (countyX < 0 || countyX >= COUNTY_GRID || countyY < 0 || countyY >= COUNTY_GRID) {
    throw new Error(`no county name for region ${regionX}, ${regionY}`);
  }

  const county = countyY * COUNTY_GRID + countyX;

  const local = withinCounty(regionY) * COUNTY_REGIONS + withinCounty(regionX);
  // Stirred, so a town's neighbours are not its name plus one
  const spun = (local * SPIN) % COUNTY_SPAN;
  // The unmarked names are spent first, so the county's last few
  // regions are the only ones that reach for a mark
  const marked = spun >= PLAIN_NAMES;
  const over = spun - PLAIN_NAMES;
  const plain = marked ? (Math.floor(over / MARKS.length) * STEP) % PLAIN_NAMES : spun;
  const here = townWordsFor(currentLocale());

  // Each part is picked by its place in the list, so every locale names the same town
  return here.join({
    mark: marked ? here.words.marks[over % MARKS.length] : null,
    head: here.heads[biome][plain % HEADS_PER_BIOME],
    tail: here.words.tails[Math.floor(plain / HEADS_PER_BIOME) % TAILS.length],
    title: here.words.titles[Math.floor(plain / (HEADS_PER_BIOME * TAILS.length))],
    county: here.words.counties[county],
  });
}
