import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import pack from '../src/server/sprites/packing.ts';

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

interface Sheet {
  folder: string;
  cuts: Cut[];
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
  // Under snow. The rip draws one of these beside every family, on the
  // family's own silhouette, so a tree that goes under snow is the same
  // tree rather than a different one. There is no snowbound palm, and
  // no beach cold enough to want one
  { name: 'round-snow', x: 786, y: 0, width: 44, height: 43 },
  { name: 'leaf-snow', x: 1044, y: 67, width: 58, height: 47 },
  { name: 'jungle-snow', x: 661, y: 67, width: 54, height: 52 },
  { name: 'olive-snow', x: 1434, y: 67, width: 51, height: 53 },
  { name: 'dry-snow', x: 1360, y: 0, width: 47, height: 40 },
  { name: 'fir-snow', x: 1124, y: 3, width: 40, height: 41 },
  { name: 'pine-snow', x: 341, y: 64, width: 53, height: 56 },
];

const SHEETS: Sheet[] = [
  { folder: 'decorations', cuts: DECORATION_CUTS },
  { folder: 'trees', cuts: TREE_CUTS },
];

/** Padding between packed pictures, so no sprite bleeds into its neighbour. */
const GUTTER = 1;

interface Piece {
  name: string;
  /** The picture, cropped to its lit pixels. */
  image: Image;
  /** Where the crop sits in the shared cell. */
  trim: [number, number];
  w: number;
  h: number;
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
function tighten(image: Image): Image {
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
    return image;
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
  return out;
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

for (const one of SHEETS) {
  for (const area of one.cuts) {
    assertWhole(sheet, area);
  }
}

const tightened = SHEETS.map((one) => ({
  folder: one.folder,
  pictures: one.cuts.map((area) => ({ name: area.name, image: tighten(cut(sheet, area)) })),
}));

// One cell across both sheets, big enough for the tallest and widest of
// either. Sizes are read off the cell rather than the crop, so scenery
// drawn side by side keeps the proportions the rip drew it in, and a
// cell of either sheet is worth the same on the board
const CELL = Math.max(
  ...tightened.flatMap((one) =>
    one.pictures.map((picture) => Math.max(picture.image.width, picture.image.height)),
  ),
);

function build(folder: string, pictures: { name: string; image: Image }[]): void {
  const pieces: Piece[] = pictures.map(({ name, image }) => ({
    name,
    image,
    // Standing on the floor of the cell, centred across it: the point a
    // caller puts scenery on is the ground it is standing on
    trim: [Math.floor((CELL - image.width) / 2), CELL - image.height],
    w: image.width + GUTTER,
    h: image.height + GUTTER,
  }));
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
        images: packed.placed
          .map(({ box, x, y }) => ({
            name: `${box.name}.png`,
            x,
            y,
            width: box.image.width,
            height: box.image.height,
            sourceWidth: CELL,
            sourceHeight: CELL,
            trim: box.trim,
          }))
          .sort((one, two) => one.name.localeCompare(two.name)),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`\n${folder}: ${pieces.length} pictures, ${drawn.as}`);
  for (const piece of pieces) {
    console.log(
      `  ${piece.name.padEnd(10)} ${String(piece.image.width).padStart(2)}x${String(piece.image.height).padStart(2)}` +
        `  at ${piece.trim[0]},${piece.trim[1]} in the cell`,
    );
  }
  console.log(`  ${into}/image.png  ${atlas.width}x${atlas.height}  ${drawn.bytes.length}b`);
}

console.log(`one ${CELL}x${CELL} cell for both sheets`);
for (const one of tightened) {
  build(one.folder, one.pictures);
}
