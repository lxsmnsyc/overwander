import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import pack from '../src/server/sprites/packing.ts';
import groundPoint, { groundSpan } from './ground.ts';

/**
 * Cutting pictures out of a rip and packing them into a sheet.
 *
 * The rips are walls of tiles and props with no table in them, so every
 * tool that reads one carries its own list of boxes. What they share is
 * everything after that: crop to the lit pixels, refuse a box the
 * picture spills out of, place each piece in a square, and write the
 * `image.png` and `data.json` the board reads.
 */

export const ROOT = 'public/sprites/overworld';

/** Padding between packed pictures, so no sprite bleeds into its neighbour. */
const GUTTER = 1;

export interface Cut {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Whether the rip draws something else hard against this box.
   *
   * It changes what counts as clipped. A free-standing piece has clear
   * air under its shadow, so anything lit in the row below the box is
   * the box being too small. A cell of one of the rip's prop grids has
   * the next cell of the grid under it, and a prop shelved among others
   * has a neighbour's shadow over it: a box that grew into either would
   * swallow the neighbour, so the check is off and the box was read by
   * eye instead
   */
  crowded?: true;
}

/** A cut cropped to its lit pixels, and where that crop sat in the cut. */
export interface Crop {
  image: Image;
  left: number;
  top: number;
}

/** What ends up on a sheet: a name and the picture packed under it. */
export interface Drawn {
  name: string;
  image: Image;
  /**
   * Where it meets the ground, where that is not its own to say. A tree
   * in snow stands on its trunk, and the snow hangs off the crown in
   * drips that reach lower than the trunk does
   */
  base?: [x: number, y: number];
}

interface Piece {
  name: string;
  image: Image;
  trim: [number, number];
  base: [number, number];
  w: number;
  h: number;
}

export function cut(sheet: Image, area: Cut): Image {
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
export function tighten(image: Image): Crop {
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
export function assertWhole(sheet: Image, area: Cut): void {
  if (area.crowded === true) {
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

/**
 * One picture laid over another, in the order given.
 *
 * The rips draw some things in pieces: snow as a bare coat with no tree
 * under it, a cave mouth that has to be put behind the foliage hiding
 * it. The result is packed as one picture, so the sheet holds what the
 * board draws instead of two pictures that have to keep finding each
 * other
 */
export function compose(layers: { image: Image; x: number; y: number }[]): Image {
  const left = Math.min(...layers.map((one) => one.x));
  const top = Math.min(...layers.map((one) => one.y));
  const right = Math.max(...layers.map((one) => one.x + one.image.width));
  const bottom = Math.max(...layers.map((one) => one.y + one.image.height));
  const out: Image = {
    width: right - left,
    height: bottom - top,
    rgba: Buffer.alloc((right - left) * (bottom - top) * 4),
  };

  for (const layer of layers) {
    for (let row = 0; row < layer.image.height; row += 1) {
      for (let column = 0; column < layer.image.width; column += 1) {
        const from = (row * layer.image.width + column) * 4;
        const alpha = layer.image.rgba[from + 3];

        if (alpha === 0) {
          continue;
        }

        const to = ((layer.y - top + row) * out.width + (layer.x - left + column)) * 4;
        const behind = (out.rgba[to + 3] * (255 - alpha)) / 255;

        for (let band = 0; band < 3; band += 1) {
          out.rgba[to + band] = Math.round(
            (layer.image.rgba[from + band] * alpha + out.rgba[to + band] * behind) /
              (alpha + behind),
          );
        }
        out.rgba[to + 3] = Math.min(255, Math.round(alpha + behind));
      }
    }
  }
  return out;
}

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
export function standsOn(art: Drawn[]): number {
  const spans = art.map((one) => groundSpan(one.image)).sort((left, right) => left - right);

  return spans[Math.floor(spans.length / 2)];
}

export default function writeAtlas(folder: string, art: Drawn[], stands?: number): void {
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
