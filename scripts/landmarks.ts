import { readFileSync } from 'node:fs';
import decode, { type Image } from '../src/server/sprites/png.ts';
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
  // The stone pokemon on a plinth the gym seat used to be drawn as. A
  // raid is a thing to walk up to rather than a hole to go into, and
  // the statue says that where a cave mouth said the opposite.
  //
  // One picture rather than the five mouths there used to be: the
  // shadow lair takes the same statue through `SHADOW_STONE` below,
  // and the biome mouths are gone. The cave mouths are still on the
  // rip at 100,600 and the two beside them if they are wanted back
  { name: 'lair', x: 1357, y: 998, width: 23, height: 41 },
  // A woven basket with greens in it, which is the only nest-shaped
  // thing on the rip: everything else that would do is a crate
  { name: 'nest', x: 1393, y: 993, width: 15, height: 15 },
  // A way through: the gatepost with a ball set into it, the leftmost
  // of the three the rip draws in a row. A post rather than a board,
  // which is what makes it read as somewhere to walk through rather
  // than something to stop and read
  { name: 'portal', x: 1265, y: 928, width: 15, height: 32 },
  // The gym's own signage: the arch with its three lamps, which is
  // what a gym is marked with everywhere else. Shelved hard against
  // the waymarker on its left, so the box was read by eye
  { name: 'seat', x: 1360, y: 919, width: 16, height: 25, crowded: true },
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

/**
 * The statue's stone, turned the colour a shadow is everywhere else.
 *
 * A shadow lair is the same place as a legendary one and a different
 * thing to walk into, so it is the same statue in the violet the
 * auras and the moon beside a caught shadow already use: the darkest
 * is the pool a shadow stands in, the middles are its wisps, and the
 * lightest is the violet the interface paints `arcane` with. Each
 * swap keeps the grey's place in the ramp, so the statue is shaded
 * exactly as it was
 */
const SHADOW_STONE: Record<string, string> = {
  '#4d5558': '#2e164a',
  '#6c767b': '#4a2b77',
  '#899696': '#7b4fc0',
  '#c4cbcb': '#a077e6',
  '#f7f7ee': '#e8dcff',
  '#f7f7f7': '#ece2ff',
  '#fbfbf7': '#f2ebff',
};

/** The same picture with every colour in the table swapped out. */
function shade(image: Image, swaps: Record<string, string>): Image {
  const out: Image = { width: image.width, height: image.height, rgba: Buffer.from(image.rgba) };
  const missed = new Set<string>();

  for (let at = 0; at < out.rgba.length; at += 4) {
    if (out.rgba[at + 3] === 0) {
      continue;
    }

    const was = `#${[0, 1, 2].map((channel) => out.rgba[at + channel].toString(16).padStart(2, '0')).join('')}`;

    // A shadow's own drop shadow is black at a low alpha and stays
    // that way: it is the ground, not the statue
    if (!Object.hasOwn(swaps, was)) {
      if (out.rgba[at + 3] === 255) {
        missed.add(was);
      }
      continue;
    }

    const now = swaps[was];

    out.rgba[at] = Number.parseInt(now.slice(1, 3), 16);
    out.rgba[at + 1] = Number.parseInt(now.slice(3, 5), 16);
    out.rgba[at + 2] = Number.parseInt(now.slice(5, 7), 16);
  }
  if (missed.size > 0) {
    throw new Error(`nothing to swap ${[...missed].sort().join(' ')} for`);
  }
  return out;
}

const sheet = decode(readFileSync(SOURCE));

for (const area of CUTS) {
  assertWhole(sheet, area);
}

const art: Drawn[] = CUTS.map((area) => ({
  name: area.name,
  image: tighten(cut(sheet, area)).image,
}));

// The shadow lair is the legendary one recoloured rather than a cut of
// its own, so the two can never drift apart
const lair = art.find((one) => one.name === 'lair');

if (lair == null) {
  throw new Error('no lair to shade');
}
art.push({ name: 'lair-rubble', image: shade(lair.image, SHADOW_STONE) });

writeAtlas('landmarks', art, STANDS);
