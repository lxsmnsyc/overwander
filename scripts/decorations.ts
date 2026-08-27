import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import pack from '../src/server/sprites/packing.ts';
import groundPoint, { groundSpan } from './ground.ts';

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
const ROOT = 'public/sprites/overworld';

interface Cut {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Whether the picture is a cell of one of the rip's 16px prop grids
   * rather than a free-standing piece.
   *
   * It changes what counts as clipped. A free-standing piece has clear
   * air under its shadow, so anything lit in the row below the box is
   * the box being too small. A grid cell has the next cell of the grid
   * under it, and a box that grew into that would swallow its neighbour
   */
  grid?: true;
}

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
  { name: 'grass', x: 48, y: 320, width: 16, height: 16, grid: true },
  { name: 'flower', x: 48, y: 352, width: 16, height: 16, grid: true },
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

/** Padding between packed pictures, so no sprite bleeds into its neighbour. */
const GUTTER = 1;

interface Piece {
  name: string;
  /** The picture, cropped to its lit pixels. */
  image: Image;
  /** Where the crop sits in the shared cell. */
  trim: [number, number];
  /** The point of the cell that stands on the ground. */
  base: [number, number];
  w: number;
  h: number;
}

/** A cut cropped to its lit pixels, and where that crop sat in the cut. */
interface Crop {
  image: Image;
  left: number;
  top: number;
}

function cut(sheet: Image, area: Cut): Image {
  const out: Image = {
    width: area.width,
    height: area.height,
    rgba: Buffer.alloc(area.width * area.height * 4),
  };

  for (let y = 0; y < area.height; y += 1) {
    for (let x = 0; x < area.width; x += 1) {
      const from = ((area.y + y) * sheet.width + area.x + x) * 4;
      const to = (y * out.width + x) * 4;

      out.rgba[to] = sheet.rgba[from];
      out.rgba[to + 1] = sheet.rgba[from + 1];
      out.rgba[to + 2] = sheet.rgba[from + 2];
      out.rgba[to + 3] = sheet.rgba[from + 3];
    }
  }
  return out;
}

/** The picture again, cropped to the pixels that are actually lit. */
function tighten(image: Image): Crop {
  let left = image.width;
  let right = -1;
  let top = image.height;
  let bottom = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.rgba[(y * image.width + x) * 4 + 3] === 0) {
        continue;
      }
      if (x < left) {
        left = x;
      }
      if (x > right) {
        right = x;
      }
      if (y < top) {
        top = y;
      }
      if (y > bottom) {
        bottom = y;
      }
    }
  }
  if (right < 0) {
    return { image, left: 0, top: 0 };
  }

  const width = right - left + 1;
  const height = bottom - top + 1;
  const out: Image = { width, height, rgba: Buffer.alloc(width * height * 4) };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = ((top + y) * image.width + left + x) * 4;
      const to = (y * width + x) * 4;

      out.rgba[to] = image.rgba[from];
      out.rgba[to + 1] = image.rgba[from + 1];
      out.rgba[to + 2] = image.rgba[from + 2];
      out.rgba[to + 3] = image.rgba[from + 3];
    }
  }
  return { image: out, left, top };
}

/**
 * Whether any pixel of a row is drawn, over one span of columns
 */
function rowLit(sheet: Image, y: number, from: number, to: number): boolean {
  if (y < 0 || y >= sheet.height) {
    return false;
  }
  for (let x = Math.max(0, from); x < Math.min(sheet.width, to); x += 1) {
    if (sheet.rgba[(y * sheet.width + x) * 4 + 3] > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Refuse a box the picture spills out of.
 *
 * The coordinates were read off the rip by eye, and the way that goes
 * wrong is silent: a box measured off the foliage misses the soft
 * shadow under it, and the sprite ships with its feet cut off looking
 * like a crop nobody chose. Checked above and below rather than at the
 * sides, since the rip sets its props shoulder to shoulder and a
 * neighbour's pixels are not this one's spill
 */
function assertWhole(sheet: Image, area: Cut): void {
  if (area.grid === true) {
    return;
  }
  const to = area.x + area.width;

  for (const [edge, y] of [
    ['above', area.y - 1],
    ['below', area.y + area.height],
  ] as const) {
    if (rowLit(sheet, y, area.x, to)) {
      throw new Error(
        `The box for ${area.name} is too small: row ${y}, just ${edge} it, is still drawing.`,
      );
    }
  }
}

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

/** What ends up on a sheet: a name and the picture packed under it. */
interface Drawn {
  name: string;
  image: Image;
  /**
   * Where it meets the ground, where that is not its own to say. A
   * tree in snow stands on its trunk, and the snow hangs off the crown
   * in drips that reach lower than the trunk does
   */
  base?: [x: number, y: number];
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
  const left = Math.min(0, x);
  const top = Math.min(0, y);
  const right = Math.max(under.image.width, x + over.image.width);
  const bottom = Math.max(under.image.height, y + over.image.height);
  const out: Image = {
    width: right - left,
    height: bottom - top,
    rgba: Buffer.alloc((right - left) * (bottom - top) * 4),
  };
  const lay = (picture: Image, atX: number, atY: number): void => {
    for (let row = 0; row < picture.height; row += 1) {
      for (let column = 0; column < picture.width; column += 1) {
        const from = (row * picture.width + column) * 4;
        const alpha = picture.rgba[from + 3];

        if (alpha === 0) {
          continue;
        }
        const to = ((atY + row) * out.width + atX + column) * 4;
        const behind = (out.rgba[to + 3] * (255 - alpha)) / 255;

        for (let band = 0; band < 3; band += 1) {
          out.rgba[to + band] = Math.round(
            (picture.rgba[from + band] * alpha + out.rgba[to + band] * behind) / (alpha + behind),
          );
        }
        out.rgba[to + 3] = Math.min(255, Math.round(alpha + behind));
      }
    }
  };

  lay(under.image, -left, -top);
  lay(over.image, x - left, y - top);

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

/**
 * The cell a sheet is packed in: its own tallest piece, squared.
 *
 * One cell to a sheet rather than one across both. A caller draws a
 * cell at whatever a board cell is worth, so measuring a rock against
 * the tallest pine there is left it a fifth of a square and drew it as
 * a speck. Within a sheet the proportions are still the rip's own
 */
function cellFor(art: Drawn[]): number {
  return Math.max(...art.map((one) => Math.max(one.image.width, one.image.height)));
}

/**
 * A piece placed on the floor of its cell and centred across it, so
 * the cell is a square anything on the sheet can be drawn in
 */
function pieceOf({ name, image, base }: Drawn, cell: number): Piece {
  const trim: [number, number] = [Math.floor((cell - image.width) / 2), cell - image.height];
  const [baseX, baseY] = base ?? groundPoint(image);

  return {
    name,
    image,
    trim,
    // Written in the cell's own coordinates, which is what a caller
    // standing one on a tile is working in
    base: [trim[0] + baseX, trim[1] + baseY],
    w: image.width + GUTTER,
    h: image.height + GUTTER,
  };
}

/**
 * How much ground the pieces of a sheet cover, in cell pixels: the
 * middle one of them, so one odd wide piece does not size the rest.
 *
 * A sheet that says this is drawn so that much ground covers a tile,
 * which sizes a tree by the tree rather than by whatever square the
 * packing happened to need
 */
function standsOn(art: Drawn[]): number {
  const spans = art.map((one) => groundSpan(one.image)).sort((left, right) => left - right);

  return spans[Math.floor(spans.length / 2)];
}

function build(folder: string, art: Drawn[], stands?: number): void {
  const cell = cellFor(art);
  const pieces = art.map((one) => pieceOf(one, cell));
  const packed = pack(pieces);
  const atlas: Image = {
    width: packed.width,
    height: packed.height,
    rgba: Buffer.alloc(packed.width * packed.height * 4),
  };

  for (const { box, x, y } of packed.placed) {
    for (let row = 0; row < box.image.height; row += 1) {
      for (let column = 0; column < box.image.width; column += 1) {
        const from = (row * box.image.width + column) * 4;
        const to = ((y + row) * atlas.width + x + column) * 4;

        atlas.rgba[to] = box.image.rgba[from];
        atlas.rgba[to + 1] = box.image.rgba[from + 1];
        atlas.rgba[to + 2] = box.image.rgba[from + 2];
        atlas.rgba[to + 3] = box.image.rgba[from + 3];
      }
    }
  }

  const drawn = encodeSmallest(atlas);
  const into = join(ROOT, folder);

  mkdirSync(into, { recursive: true });
  writeFileSync(join(into, 'image.png'), drawn.bytes);
  writeFileSync(
    join(into, 'data.json'),
    `${JSON.stringify(
      {
        compact: true,
        width: atlas.width,
        height: atlas.height,
        ...(stands == null ? {} : { stands }),
        images: packed.placed
          .map(({ box, x, y }) => ({
            name: `${box.name}.png`,
            x,
            y,
            width: box.image.width,
            height: box.image.height,
            sourceWidth: cell,
            sourceHeight: cell,
            trim: box.trim,
            base: box.base,
          }))
          .sort((one, two) => one.name.localeCompare(two.name)),
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `\n${folder}: ${pieces.length} pictures in a ${cell}x${cell} cell, ${drawn.as}` +
      (stands == null ? '' : `, standing on ${stands} of ground`),
  );
  for (const piece of pieces) {
    console.log(
      `  ${piece.name.padEnd(16)} ${String(piece.image.width).padStart(2)}x${String(piece.image.height).padStart(2)}` +
        `  at ${piece.trim[0]},${piece.trim[1]}, standing on ${piece.base[0]},${piece.base[1]} of the cell`,
    );
  }
  console.log(`  ${into}/image.png  ${atlas.width}x${atlas.height}  ${drawn.bytes.length}b`);
}

build('decorations', decorationArt);
// Measured over the trees themselves rather than the whole sheet: a
// tree in snow is the same tree, and counting both would give the
// families with the most shades the most votes
build('trees', treeArt, standsOn(bareTrees));
