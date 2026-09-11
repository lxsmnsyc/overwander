import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import pack from '../src/server/sprites/packing.ts';

/**
 * The Battle Frontier symbols, as pixel art.
 *
 * The renders they come from are smooth: anti-aliased medallions a
 * hundred pixels across with gradients on the metal, which is nothing
 * like the rest of what this game draws. So they are cut down to one
 * item's worth of pixels and repainted in the palette the item sheets
 * use, four steps of metal and two of glyph, with a hard outline round
 * the coin.
 *
 * ```bash
 * pnpm frontier-symbols ~/Downloads/frontier
 * ```
 *
 * Run `pnpm compact-sprites` afterwards to record the sheet.
 */

const OUT = 'public/sprites/extras/badges';

const SHEET = 'frontier-emerald';

/**
 * How wide a symbol is drawn. An item's picture is around twenty
 * pixels in its thirty-two pixel cell, and a medallion beside one has
 * to read as the same size of thing
 */
const SIZE = 22;

/** Padding between packed pictures, so no symbol bleeds into its neighbour. */
const GUTTER = 1;

/** The symbol is spelled Spirits, and one render was saved singular. */
const RENAMES: Partial<Record<string, string>> = { 'spirit-silver': 'spirits-silver' };

function hex(value: string): [number, number, number] {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

/**
 * The two finishes, in the golds and greys the item sheets are already
 * drawn in. Taking a hue off the render instead gave olive and mint:
 * the silver has no hue to take, and averaging the gold's shadows with
 * its highlights lands between them
 */
const GRADES = {
  gold: {
    metal: ['#ffe68b', '#f6d552', '#de9c29', '#946a18'].map(hex),
    glyph: ['#5a4a29', '#312918'].map(hex),
  },
  silver: {
    metal: ['#ffffff', '#e6e6f6', '#a4a4c5', '#7b7b8b'].map(hex),
    glyph: ['#4a525a', '#292f39'].map(hex),
  },
};

const OUTLINE = hex('#202020');

/**
 * Where the glyph ends and the metal begins, read off the renders: the
 * glyph is a flat band around a third of the way up, and every lit
 * pixel above it is metal
 */
const GLYPH_MAX = 0.42;
const GLYPH_DARK = 0.36;

/** Which step of the metal a pixel's own lightness lands on. */
const METAL_STOPS = [0.86, 0.68, 0.52];

interface Symbol {
  name: string;
  image: Image;
  w: number;
  h: number;
}

/** One render, cut down and repainted. */
async function symbolOf(source: string, file: string): Promise<Symbol> {
  const stem = file.replace(/\.png$/, '');
  const grade = stem.endsWith('-silver') ? GRADES.silver : GRADES.gold;
  const { data } = await sharp(join(source, file))
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  // A drawn circle rather than the one the downscale leaves behind. A
  // medallion is round and all fourteen are the same medallion; the
  // render's own alpha comes back at this size with nubs and flats on
  // it, and fourteen differently dented circles read as a mistake
  const middle = (SIZE - 1) / 2;
  const radius = SIZE / 2 - 0.5;
  const lit = (x: number, y: number): boolean =>
    x >= 0 &&
    y >= 0 &&
    x < SIZE &&
    y < SIZE &&
    Math.hypot(x - middle, y - middle) <= radius &&
    data[(y * SIZE + x) * 4 + 3] > 0;
  /** Eight neighbours, so a diagonal step in the circle still closes. */
  const edge = (x: number, y: number): boolean => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if ((dx !== 0 || dy !== 0) && !lit(x + dx, y + dy)) {
          return true;
        }
      }
    }
    return false;
  };

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const at = (y * SIZE + x) * 4;

      if (!lit(x, y)) {
        continue;
      }
      const max = Math.max(data[at], data[at + 1], data[at + 2]) / 255;
      const min = Math.min(data[at], data[at + 1], data[at + 2]) / 255;
      const light = (max + min) / 2;
      const inside = !edge(x - 1, y) && !edge(x + 1, y) && !edge(x, y - 1) && !edge(x, y + 1);
      let colour: [number, number, number];

      if (edge(x, y)) {
        colour = OUTLINE;
      } else if (light >= GLYPH_MAX) {
        const step = METAL_STOPS.findIndex((stop) => light > stop);

        colour = grade.metal[step < 0 ? 3 : step];
      } else if (inside) {
        colour = light < GLYPH_DARK ? grade.glyph[1] : grade.glyph[0];
      } else {
        // The coin's own dark rim sits against the outline, so a dark
        // pixel is only the glyph two pixels in
        colour = grade.metal[3];
      }
      rgba[at] = colour[0];
      rgba[at + 1] = colour[1];
      rgba[at + 2] = colour[2];
      rgba[at + 3] = 255;
    }
  }
  return {
    name: RENAMES[stem] ?? stem,
    image: { width: SIZE, height: SIZE, rgba },
    w: SIZE + GUTTER,
    h: SIZE + GUTTER,
  };
}

const source = process.argv[2] ?? '';

if (source.length === 0) {
  throw new Error('Say which folder the renders are in');
}
const symbols = await Promise.all(
  readdirSync(source)
    .filter((file) => file.endsWith('.png'))
    .map(async (file) => symbolOf(source, file)),
);
const layout = pack(symbols);
const sheet: Image = {
  width: layout.width,
  height: layout.height,
  rgba: Buffer.alloc(layout.width * layout.height * 4),
};
const placed = [];

for (const { box, x, y } of layout.placed) {
  for (let row = 0; row < SIZE; row += 1) {
    const from = row * SIZE * 4;

    box.image.rgba.copy(sheet.rgba, ((y + row) * sheet.width + x) * 4, from, from + SIZE * 4);
  }
  placed.push({
    name: box.name,
    x,
    y,
    width: SIZE,
    height: SIZE,
    sourceWidth: SIZE,
    sourceHeight: SIZE,
    trim: [0, 0],
  });
}

const drawn = encodeSmallest(sheet);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, `${SHEET}.png`), drawn.bytes);
writeFileSync(
  join(OUT, `${SHEET}.json`),
  `${JSON.stringify(
    {
      compact: true,
      width: sheet.width,
      height: sheet.height,
      // By name, so the file does not change because the folder was
      // read in a different order
      images: placed.sort((one, two) => one.name.localeCompare(two.name)),
    },
    null,
    2,
  )}\n`,
);
console.log(
  `${OUT}/${SHEET}.png  ${sheet.width}x${sheet.height}, ${placed.length} symbols, ` +
    `${(drawn.bytes.length / 1024).toFixed(1)}K as ${drawn.as}`,
);
