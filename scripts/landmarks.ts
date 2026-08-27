import { readFileSync } from 'node:fs';
import decode from '../src/server/sprites/png.ts';
import writeAtlas, { type Cut, type Drawn, assertWhole, cut, tighten } from './atlas.ts';

/**
 * The landmarks, cut out of an overworld rip.
 *
 * Every landmark that is a **place** rather than a person: the people
 * ones stand about in charsets already, and a berry patch grows its own
 * plant. What is left was a letter in a circle. The hidden grotto is
 * not here: it is drawn as a tree with a hollow in it, off the tree
 * sheet, which is what hides it.
 *
 * A shortlist rather than a decision. Several landmarks have more than
 * one candidate here, since which of them reads as a portal or a claimed
 * seat is a matter of looking at them on the board, and the sheet is
 * cheap enough to hold the alternatives while that is settled.
 */

const SOURCE = process.argv[2] ?? 'image.png';

const CUTS: Cut[] = [
  // A cave mouth, which the rip draws in four shades on a 48px pitch.
  // The other two are the same mouth for a jungle or a glacier, which
  // is a per-biome table for free the way the trees have one. The rip
  // draws two more of the row with water pouring out of them, at 196
  // and 244, for a lair in a swamp
  { name: 'lair', x: 100, y: 600, width: 40, height: 40 },
  { name: 'lair-moss', x: 100, y: 648, width: 40, height: 40 },
  { name: 'lair-ice', x: 148, y: 648, width: 40, height: 40 },
  // The same mouth gone wrong: choked with rubble, and boarded over
  // with crossed planks. Either takes a tint to say whose it is now
  { name: 'lair-rubble', x: 244, y: 600, width: 40, height: 40 },
  { name: 'lair-sealed', x: 196, y: 600, width: 40, height: 40 },
  // A woven basket with greens in it, which is the only nest-shaped
  // thing on the rip: everything else that would do is a crate
  { name: 'nest', x: 1393, y: 993, width: 15, height: 15 },
  // A way through: a mouth cut like the lairs are, but open rather than
  // dark, with a lit sill at the threshold. A terrain tile is drawn
  // hard against its bottom row, so its box was read by eye. The two
  // arms of rock with the light between them are at 16,621
  { name: 'portal', x: 20, y: 680, width: 40, height: 40, crowded: true },
  // A seat somebody has taken: a pokemon in stone on a plinth, with a
  // plaque saying whose it is
  { name: 'seat', x: 1357, y: 998, width: 23, height: 41 },
  // Somewhere to read what is posted: a wooden notice board, posts and
  // all, from over the gym's own sign
  { name: 'board', x: 1344, y: 888, width: 34, height: 24 },
  // A ball lying in the grass, and the same ball open once somebody has
  // been. Small on purpose: a cache is something spotted rather than
  // walked up to
  { name: 'cache', x: 1409, y: 978, width: 15, height: 12 },
  { name: 'cache-taken', x: 1441, y: 976, width: 16, height: 14, crowded: true },
];

/**
 * How much ground a landmark covers, in rip pixels, drawn as one tile.
 *
 * Chosen rather than measured, which is the difference between this
 * sheet and the trees. A tree's canopy overhangs the ground it stands
 * on, so measuring the ground is what sizes it honestly; a cave mouth
 * is all base, and measuring it draws a cave you could not walk into at
 * one tile square. These are structures rather than props, so how much
 * of the world one takes up is a decision: this puts a cave mouth at
 * half again a person's height, which is the smallest that still reads
 * as somewhere to go
 */
const STANDS = 24;

const sheet = decode(readFileSync(SOURCE));

for (const area of CUTS) {
  assertWhole(sheet, area);
}

const art: Drawn[] = CUTS.map((area) => ({
  name: area.name,
  image: tighten(cut(sheet, area)).image,
}));

writeAtlas('landmarks', art, STANDS);
