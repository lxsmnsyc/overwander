import * as v from 'valibot';
import type Biome from '../ids/biome';
import type { SettledBiome } from '../ids/biome';
import { BIOME_IDS } from '../ids/names';
import townNamesFile from '../text/en/town-names.yaml';
import { idOf } from '../yaml';

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
 * The words are `text/en/town-names.yaml`; how they are put together
 * is here
 */

const WORDS = v.object({
  heads: v.record(v.string(), v.array(v.string())),
  tails: v.array(v.string()),
  titles: v.array(v.string()),
  marks: v.array(v.string()),
  counties: v.array(v.string()),
});

const words = v.parse(WORDS, townNamesFile);

/**
 * The head of a name, by the biome the town stands on. One entry per
 * country a town can be settled on and no others: the open seas and
 * `Beyond` are out of the type rather than filled with words nothing
 * would ever reach. Total, so a biome added to the world cannot be
 * built on until it has been given words. Public so a test can hold
 * it to that
 */
export const TOWN_HEADS: Record<number, string[]> = {};

for (const [name, heads] of Object.entries(words.heads)) {
  const where = `text/en/town-names.yaml: ${name}`;

  // The arithmetic below reads eight to a biome, and one short or over
  // would rename every town of it
  if (heads.length !== 8) {
    throw new Error(`${where}: needs exactly 8 heads`);
  }
  TOWN_HEADS[idOf<Biome>(BIOME_IDS, name, where)] = heads;
}

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
const COUNTY_NAMES: string[] = words.counties;

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
  const head = TOWN_HEADS[biome][plain % HEADS_PER_BIOME];
  const tail = TAILS[Math.floor(plain / HEADS_PER_BIOME) % TAILS.length];
  const title = TITLES[Math.floor(plain / (HEADS_PER_BIOME * TAILS.length))];
  const mark = marked ? `${MARKS[over % MARKS.length]} ` : '';

  return `${mark}${head}${tail} ${title}, ${COUNTY_NAMES[county]}`;
}
