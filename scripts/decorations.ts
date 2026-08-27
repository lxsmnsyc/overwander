import { readFileSync } from 'node:fs';
import decode, { type Image } from '../src/server/sprites/png.ts';
import writeAtlas, {
  type Crop,
  type Cut,
  type Drawn,
  assertWhole,
  compose,
  cut,
  standsOn,
  tighten,
} from './atlas.ts';
import groundPoint from './ground.ts';

/**
 * The scenery, cut out of an overworld rip and packed into two atlases.
 *
 * The rip is a wall of tiles, buildings and props with no table in it,
 * so where each piece of scenery sits is written down here. The
 * coordinates were read off the sheet by looking: they are the one
 * thing about this that cannot be derived.
 *
 * Trees are a sheet of their own because there are many of them: the
 * rip draws each tree in four or five shades and the biomes want
 * different ones, so a board loads a dozen trees and eleven other props
 * rather than one sheet that grows every time a biome is given a tree.
 *
 * Both sheets share **one cell**, sized off the tallest piece of either.
 * A caller draws a cell at whatever a board cell is worth, so two
 * sheets measured against different squares would put a rock and a pine
 * at sizes the rip never drew them.
 */

const SOURCE = process.argv[2] ?? 'image.png';

/**
 * Where each piece sits on the rip, and what it is.
 *
 * Boxes take in the **shadow** as well as the picture: every
 * free-standing piece here is drawn over a soft ellipse of its own, and
 * a box measured off the lit foliage alone cuts the bottom off it
 */
const DECORATION_CUTS: Cut[] = [
  { name: 'cactus', x: 321, y: 195, width: 30, height: 29 },
  { name: 'shrub', x: 210, y: 202, width: 27, height: 25 },
  { name: 'grass', x: 48, y: 320, width: 16, height: 16, crowded: true },
  { name: 'flower', x: 48, y: 352, width: 16, height: 16, crowded: true },
  { name: 'rock', x: 481, y: 369, width: 14, height: 14 },
  { name: 'boulder', x: 484, y: 645, width: 24, height: 27 },
  // Reeds and kelp are the same plant here, so the tallest blades on
  // the sheet stand for both
  { name: 'reed', x: 528, y: 328, width: 30, height: 36 },
  { name: 'coral', x: 451, y: 370, width: 11, height: 13 },
  { name: 'ice', x: 417, y: 627, width: 30, height: 29 },
  { name: 'mushroom', x: 64, y: 197, width: 16, height: 30 },
  { name: 'stump', x: 264, y: 197, width: 32, height: 30 },
];

/**
 * The trees.
 *
 * The rip draws each tree in four or five shades along a row, so a
 * variant is one column of one of those rows. Which **row** it comes
 * from is what makes a tree a different tree rather than the same one
 * recoloured
 */
const TREE_CUTS: Cut[] = [
  { name: 'round', x: 593, y: 0, width: 46, height: 51 },
  { name: 'broadleaf', x: 789, y: 67, width: 57, height: 71 },
  { name: 'dark', x: 981, y: 67, width: 57, height: 71 },
  { name: 'jungle', x: 533, y: 67, width: 54, height: 70 },
  { name: 'olive', x: 1172, y: 67, width: 56, height: 65 },
  { name: 'autumn', x: 1504, y: 0, width: 47, height: 56 },
  { name: 'dry', x: 1552, y: 0, width: 47, height: 56 },
  { name: 'fir', x: 1028, y: 3, width: 40, height: 48 },
  { name: 'pine', x: 21, y: 64, width: 53, height: 69 },
  { name: 'pine-dark', x: 213, y: 64, width: 53, height: 69 },
  { name: 'pine-blue', x: 149, y: 64, width: 53, height: 69 },
  { name: 'palm', x: 662, y: 146, width: 36, height: 54 },
];

/**
 * The snow, which the rip draws beside every family as a coat and not
 * as a tree: bare snow in the crown's shape, nothing under it.
 *
 * So it is composed onto each tree it covers rather than packed on its
 * own, and a snowbound pine is that pine with its own trunk and shadow
 * still under the snow. Swapping in one white tree instead would take a
 * biome's chosen shade of pine away from it in the cold.
 *
 * Each family draws **two** coats, a light dusting and a full one, and
 * the full one is what these are: it is the coat cut to the family's
 * own width, and its box therefore lines up corner to corner with any
 * tree of that family. The light one is a few pixels narrower and set
 * off to one side in its cell, which is what made a coat sit inside a
 * crown with the green showing round it.
 *
 * There is no coat for the palm, and no beach cold enough to want one
 */
interface Coat extends Cut {
  /** The trees it covers. They share a silhouette, so it fits them all */
  over: string[];
}

const COAT_CUTS: Coat[] = [
  { name: 'round-snow', over: ['round'], x: 833, y: 0, width: 46, height: 43 },
  { name: 'leaf-snow', over: ['broadleaf', 'dark'], x: 1109, y: 67, width: 57, height: 46 },
  { name: 'jungle-snow', over: ['jungle'], x: 725, y: 67, width: 54, height: 51 },
  { name: 'olive-snow', over: ['olive'], x: 1492, y: 67, width: 56, height: 53 },
  { name: 'dry-snow', over: ['autumn', 'dry'], x: 1408, y: 0, width: 47, height: 40 },
  { name: 'fir-snow', over: ['fir'], x: 1124, y: 3, width: 40, height: 41 },
  {
    name: 'pine-snow',
    over: ['pine', 'pine-dark', 'pine-blue'],
    x: 341,
    y: 64,
    width: 53,
    height: 55,
  },
];

const sheet = decode(readFileSync(SOURCE));
const ALL: Cut[] = [...DECORATION_CUTS, ...TREE_CUTS, ...COAT_CUTS];

for (const area of ALL) {
  assertWhole(sheet, area);
}

const boxes = new Map<string, Image>(ALL.map((area) => [area.name, cut(sheet, area)]));

/** The cut of that name, which the tables above have or the run is wrong. */
function boxOf(name: string): Image {
  const box = boxes.get(name);

  if (box == null) {
    throw new Error(`Nothing on the rip is called ${name}.`);
  }
  return box;
}

const crops = new Map<string, Crop>(ALL.map((area) => [area.name, tighten(boxOf(area.name))]));

function cropOf(name: string): Crop {
  const crop = crops.get(name);

  if (crop == null) {
    throw new Error(`Nothing on the rip is called ${name}.`);
  }
  return crop;
}

function cutOf(name: string): Cut {
  const area = ALL.find((one) => one.name === name);

  if (area == null) {
    throw new Error(`Nothing on the rip is called ${name}.`);
  }
  return area;
}

/**
 * One tree with its coat composed onto it: the same tree, in the snow.
 *
 * Baked rather than layered at draw time. A coat carries no trunk and
 * no shadow, so laying it over the tree is the only way it reads as
 * snow at all, and doing that here means the sheet holds exactly what
 * the board draws instead of two pictures that have to keep finding
 * each other
 */
function underSnow(coat: Coat, tree: string): Drawn {
  const over = cropOf(coat.name);
  const under = cropOf(tree);
  // The coat is cut to its family's own width and sits at the same
  // place in its cell, so the two boxes line up corner to corner. The
  // widths are the check on that: a coat a few pixels narrower is the
  // light dusting from the cell beside it, which lands somewhere else
  if (cutOf(coat.name).width !== cutOf(tree).width) {
    throw new Error(`The coat ${coat.name} is not cut to the width of ${tree}.`);
  }
  const x = over.left - under.left;
  const y = cutOf(coat.name).y - cutOf(tree).y + over.top - under.top;
  const out = compose([
    { image: under.image, x: 0, y: 0 },
    { image: over.image, x, y },
  ]);
  const left = Math.min(0, x);
  const top = Math.min(0, y);

  const whole = tighten(out);
  const [baseX, baseY] = groundPoint(under.image);

  return {
    name: `${tree}-snow`,
    image: whole.image,
    base: [baseX - left - whole.left, baseY - top - whole.top],
  };
}

const decorationArt: Drawn[] = DECORATION_CUTS.map((area) => ({
  name: area.name,
  image: cropOf(area.name).image,
}));
const bareTrees: Drawn[] = TREE_CUTS.map((area) => ({
  name: area.name,
  image: cropOf(area.name).image,
}));
const treeArt: Drawn[] = [
  ...bareTrees,
  ...COAT_CUTS.flatMap((coat) => coat.over.map((tree) => underSnow(coat, tree))),
];

writeAtlas('decorations', decorationArt);
// Measured over the trees themselves rather than the whole sheet: a
// tree in snow is the same tree, and counting both would give the
// families with the most shades the most votes
writeAtlas('trees', treeArt, standsOn(bareTrees));
