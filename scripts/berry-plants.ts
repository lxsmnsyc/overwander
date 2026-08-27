import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import groundPoint from './ground.ts';

/**
 * The berry plants, cut out of a rip and filed one to a berry.
 *
 * The sheet is a table: four bands of sixteen berries, each berry two
 * frames across and three growth stages down. Numbering runs **right
 * to left** within a band, which is the one thing about it nothing in
 * the pixels says.
 *
 * Berries the rip has no plant for are drawn from a relative: the
 * donor's fruit is found by which colours its ripe stage has that its
 * bare stage does not, and those are turned to the hue of the berry's
 * own icon. Everything else about the plant is left alone.
 */

const SOURCE = process.argv[2] ?? 'image.png';
const ROOT = 'public/sprites/overworld/landmarks-berry';
const ICONS = 'public/sprites/ui/items/berries';

/** The cell grid, measured off the rules in the sheet. */
const CELL = { width: 22, height: 34 };
const COLUMN_PITCH = 23.5;
const ROW_PITCH = 35;
const BANDS = [2, 108, 214, 320];
const FRAMES = 2;
const STAGES = 3;

/** The berries of the generation this sheet was ripped from, in order. */
const SHEET_ORDER = `cheri chesto pecha rawst aspear leppa oran persim lum sitrus figy wiki mago
aguav iapapa razz bluk nanab wepear pinap pomeg kelpsy qualot hondew grepa tamato cornn magost
rabuta nomel spelon pamtre watmel durin belue occa passho wacan rindo yache chople kebia shuca coba
payapa tanga charti kasib haban colbur babiri chilan liechi ganlon salac petaya apicot lansat starf
enigma micle custap jaboca rowap`
  .split(/\s+/)
  .filter((one) => one.length > 0);

/** The berries this game registers, by the name their icon is filed under. */
const OURS = `cheri chesto pecha rawst aspear leppa oran persim lum sitrus figy wiki mago aguav
iapapa razz bluk nanab wepear pinap pomeg kelpsy qualot hondew grepa tamato cornn magost rabuta
nomel spelon pamtre watmel durin belue occa passho wacan rindo yache chople kebia shuca coba payapa
tanga charti kasib haban colbur babiri chilan roseli liechi ganlon salac petaya apicot lansat starf
custap micle enigma kee maranga jaboca rowap
silver-razz golden-razz silver-nanab golden-nanab silver-pinap golden-pinap`
  .split(/\s+/)
  .filter((one) => one.length > 0);

/**
 * Berries the rip never drew, and the relative each is grown from.
 * All three arrived after the sheet did, and each is paired with the
 * berry it shares its mechanic with
 */
const GROWN_FROM = new Map<string, string>([
  ['roseli', 'chilan'],
  ['kee', 'jaboca'],
  ['maranga', 'rowap'],
  // The prize grades are the same three fruits the sheet already
  // draws, so each is its own plain berry with the fruit repainted
  ['silver-razz', 'razz'],
  ['golden-razz', 'razz'],
  ['silver-nanab', 'nanab'],
  ['golden-nanab', 'nanab'],
  ['silver-pinap', 'pinap'],
  ['golden-pinap', 'pinap'],
]);

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** One icon's place on the berry sheet, as its description records it. */
interface IconEntry {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Which block of the sheet a berry sits on, counting from the right. */
function blockOf(name: string): { band: number; pair: number } | null {
  const id = SHEET_ORDER.indexOf(name);

  if (id < 0) {
    return null;
  }
  return { band: Math.floor(id / 16), pair: 15 - (id % 16) };
}

function pixelAt(image: Image, x: number, y: number): Rgb & { a: number } {
  const at = (y * image.width + x) * 4;

  return {
    r: image.rgba[at],
    g: image.rgba[at + 1],
    b: image.rgba[at + 2],
    a: image.rgba[at + 3],
  };
}

/** One 22x34 cell lifted off the sheet, its paper flooded away. */
function cutCell(sheet: Image, left: number, top: number): Image {
  const out: Image = {
    width: CELL.width,
    height: CELL.height,
    rgba: Buffer.alloc(CELL.width * CELL.height * 4),
  };

  for (let y = 0; y < CELL.height; y += 1) {
    for (let x = 0; x < CELL.width; x += 1) {
      const from = pixelAt(sheet, left + x, top + y);
      const at = (y * out.width + x) * 4;

      out.rgba[at] = from.r;
      out.rgba[at + 1] = from.g;
      out.rgba[at + 2] = from.b;
      out.rgba[at + 3] = 255;
    }
  }

  /**
   * The paper is flooded from the edges rather than keyed by colour.
   * Several of these plants have white flowers, and keying white
   * would punch holes through them
   */
  const paper = (x: number, y: number): boolean => {
    const found = pixelAt(out, x, y);

    return found.a > 0 && found.r > 232 && found.g > 232 && found.b > 232;
  };
  const stack: [number, number][] = [];

  for (let x = 0; x < CELL.width; x += 1) {
    stack.push([x, 0], [x, CELL.height - 1]);
  }
  for (let y = 0; y < CELL.height; y += 1) {
    stack.push([0, y], [CELL.width - 1, y]);
  }
  while (stack.length > 0) {
    const spot = stack.pop();

    if (spot == null) {
      break;
    }
    const [x, y] = spot;

    if (x < 0 || y < 0 || x >= CELL.width || y >= CELL.height || !paper(x, y)) {
      continue;
    }
    out.rgba[(y * out.width + x) * 4 + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return out;
}

/** Every cell of one berry, frames across and stages down. */
function cutPlant(sheet: Image, band: number, pair: number): Image[] {
  const cells: Image[] = [];

  for (let stage = 0; stage < STAGES; stage += 1) {
    for (let frame = 0; frame < FRAMES; frame += 1) {
      cells.push(
        cutCell(
          sheet,
          2 + Math.floor((pair * FRAMES + frame) * COLUMN_PITCH),
          BANDS[band] + stage * ROW_PITCH,
        ),
      );
    }
  }
  return cells;
}

/** The tightest box that still holds every cell's drawing. */
function trimOf(cells: Image[]): { x: number; y: number; width: number; height: number } {
  let left = CELL.width;
  let top = CELL.height;
  let right = -1;
  let bottom = -1;

  for (const cell of cells) {
    for (let y = 0; y < CELL.height; y += 1) {
      for (let x = 0; x < CELL.width; x += 1) {
        if (cell.rgba[(y * cell.width + x) * 4 + 3] === 0) {
          continue;
        }
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < 0) {
    return { x: 0, y: 0, width: CELL.width, height: CELL.height };
  }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/** The cells laid out as one grid, cropped alike so it stays a grid. */
function packGrid(
  cells: Image[],
  trim: { x: number; y: number; width: number; height: number },
): Image {
  const out: Image = {
    width: trim.width * FRAMES,
    height: trim.height * STAGES,
    rgba: Buffer.alloc(trim.width * FRAMES * trim.height * STAGES * 4),
  };

  for (let at = 0; at < cells.length; at += 1) {
    const column = at % FRAMES;
    const row = Math.floor(at / FRAMES);

    for (let y = 0; y < trim.height; y += 1) {
      for (let x = 0; x < trim.width; x += 1) {
        const from = ((trim.y + y) * CELL.width + trim.x + x) * 4;
        const to = ((row * trim.height + y) * out.width + column * trim.width + x) * 4;

        cells[at].rgba.copy(out.rgba, to, from, from + 4);
      }
    }
  }
  return out;
}

/** A colour as hue, saturation and lightness, each 0 to 1. */
interface Hsl {
  h: number;
  s: number;
  l: number;
}

function toHsl(colour: Rgb): Hsl {
  const r = colour.r / 255;
  const g = colour.g / 255;
  const b = colour.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const span = max - min;

  if (span === 0) {
    return { h: 0, s: 0, l };
  }
  const s = l > 0.5 ? span / (2 - max - min) : span / (max + min);
  const sixth = ((): number => {
    if (max === r) {
      return (g - b) / span + (g < b ? 6 : 0);
    }
    return max === g ? (b - r) / span + 2 : (r - g) / span + 4;
  })();

  return { h: sixth / 6, s, l };
}

function toRgb(hsl: Hsl): Rgb {
  const { h, s, l } = hsl;

  if (s === 0) {
    const flat = Math.round(l * 255);

    return { r: flat, g: flat, b: flat };
  }
  const second = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const first = 2 * l - second;
  const channel = (shift: number): number => {
    const at = (h + shift + 1) % 1;

    if (at < 1 / 6) {
      return first + (second - first) * 6 * at;
    }
    if (at < 1 / 2) {
      return second;
    }
    if (at < 2 / 3) {
      return first + (second - first) * (2 / 3 - at) * 6;
    }
    return first;
  };

  return {
    r: Math.round(channel(1 / 3) * 255),
    g: Math.round(channel(0) * 255),
    b: Math.round(channel(-1 / 3) * 255),
  };
}

/**
 * The colours the fruit is drawn in, as the ones the ripe stage has
 * and the bare stage has not. The plant grows as well as fruits, so
 * more of a leaf colour is not news; a colour that was not there is
 */
function coloursIn(cells: Image[], from: number, to: number): Set<string> {
  const found = new Set<string>();

  for (let at = from; at < to; at += 1) {
    const { rgba } = cells[at];

    for (let pixel = 0; pixel < CELL.width * CELL.height; pixel += 1) {
      if (rgba[pixel * 4 + 3] === 0) {
        continue;
      }
      found.add(`${rgba[pixel * 4]},${rgba[pixel * 4 + 1]},${rgba[pixel * 4 + 2]}`);
    }
  }
  return found;
}

/**
 * How many of the sheet's berries draw each colour. Soil, shadow and
 * the grass around a mound are drawn the same for every plant, so a
 * colour a crowd of berries shares is the sheet's furniture whatever
 * the growth stage it turns up in
 */
function sheetSpread(sheet: Image): Map<string, number> {
  const spread = new Map<string, number>();

  for (let band = 0; band < BANDS.length; band += 1) {
    for (let pair = 0; pair < 16; pair += 1) {
      for (const key of coloursIn(cutPlant(sheet, band, pair), 0, FRAMES * STAGES)) {
        spread.set(key, (spread.get(key) ?? 0) + 1);
      }
    }
  }
  return spread;
}

/** Berries a colour may be shared by before it counts as furniture. */
const FURNITURE_SHARE = 1 / 8;

/**
 * What to repaint when a berry is grown from a relative.
 *
 * A colour is the fruit's if the plant had no such colour before it
 * bore any, which leaves the leaves, the stem and the mound alone
 * however their shading shifts between stages. Counting the pixels
 * instead would not: a mound is drawn larger under a grown plant, so
 * every shade of soil would read as fruit
 */
function fruitColours(cells: Image[], spread: Map<string, number>, blocks: number): Set<string> {
  const bare = coloursIn(cells, 0, FRAMES);
  const shared = Math.max(2, Math.round(blocks * FURNITURE_SHARE));
  const fruit = new Set<string>();

  for (const key of coloursIn(cells, FRAMES * 2, FRAMES * 3)) {
    if (!bare.has(key) && (spread.get(key) ?? 0) < shared) {
      fruit.add(key);
    }
  }
  return fruit;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

/**
 * Where every berry icon sits on its sheet. Read loosely, since this
 * is an asset the packer wrote rather than input to be trusted
 */
function iconsOnSheet(): IconEntry[] {
  const described: unknown = JSON.parse(readFileSync(join(ICONS, 'data.json'), 'utf8'));
  const images = isRecord(described) ? described.images : undefined;

  if (!Array.isArray(images)) {
    return [];
  }
  const found: IconEntry[] = [];

  for (let at = 0; at < images.length; at += 1) {
    const entry: unknown = images[at];

    if (!isRecord(entry)) {
      continue;
    }
    const { name, x, y, width, height } = entry;

    if (
      typeof name === 'string' &&
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      found.push({ name, x, y, width, height });
    }
  }
  return found;
}

/** What an icon is mostly coloured, taken from its most saturated third. */
function iconColour(name: string): Rgb {
  const sheet = decode(readFileSync(join(ICONS, 'image.png')));
  const entry = iconsOnSheet().find((one) => one.name === `${name}.png`);

  if (entry == null) {
    throw new Error(`No icon for ${name}, so nothing says what colour it should be`);
  }
  const found: { colour: Rgb; saturation: number }[] = [];

  for (let y = 0; y < entry.height; y += 1) {
    for (let x = 0; x < entry.width; x += 1) {
      const at = pixelAt(sheet, entry.x + x, entry.y + y);

      if (at.a < 200 || Math.max(at.r, at.g, at.b) < 60) {
        continue;
      }
      found.push({
        colour: at,
        saturation: Math.max(at.r, at.g, at.b) - Math.min(at.r, at.g, at.b),
      });
    }
  }
  if (found.length === 0) {
    throw new Error(`The icon for ${name} has no colour to take`);
  }
  found.sort((one, two) => two.saturation - one.saturation);
  const kept = found.slice(0, Math.max(3, Math.floor(found.length / 3)));

  return {
    r: Math.round(kept.reduce((total, one) => total + one.colour.r, 0) / kept.length),
    g: Math.round(kept.reduce((total, one) => total + one.colour.g, 0) / kept.length),
    b: Math.round(kept.reduce((total, one) => total + one.colour.b, 0) / kept.length),
  };
}

/**
 * The finish a prize grade wears, as hue and saturation.
 *
 * A grade is a metal rather than another berry's colour, and its icon
 * cannot say so: silver's own pixels are nearly colourless, so the
 * most saturated third of a silver icon is its leaf, and taking a hue
 * from one paints the fruit green. Saturation here is authoritative
 * rather than a floor, since being nearly colourless is the whole of
 * what silver is
 */
const GRADES = new Map<string, Hsl>([
  ['silver', { h: 212 / 360, s: 0.16, l: 0 }],
  ['golden', { h: 45 / 360, s: 0.95, l: 0 }],
]);

/**
 * How to paint one grown berry's fruit. Lightness is the donor's
 * either way, so the fruit keeps its own shading and highlight rather
 * than becoming a flat patch of the new colour
 */
function paintFor(name: string): (was: Hsl) => Hsl {
  const grade = GRADES.get(name.split('-')[0]);

  if (grade != null) {
    return (was) => ({ h: grade.h, s: grade.s, l: was.l });
  }
  const wanted = toHsl(iconColour(name));

  return (was) => ({ h: wanted.h, s: Math.max(wanted.s, was.s * 0.6), l: was.l });
}

/** The donor's cells with its fruit painted another colour. */
function recolour(cells: Image[], fruit: Set<string>, paint: (was: Hsl) => Hsl): Image[] {
  const swaps = new Map<string, Rgb>();

  for (const key of fruit) {
    const [r, g, b] = key.split(',').map(Number);

    swaps.set(key, toRgb(paint(toHsl({ r, g, b }))));
  }
  return cells.map((cell) => {
    const out: Image = { width: cell.width, height: cell.height, rgba: Buffer.from(cell.rgba) };

    for (let pixel = 0; pixel < cell.width * cell.height; pixel += 1) {
      if (out.rgba[pixel * 4 + 3] === 0) {
        continue;
      }
      const now = swaps.get(
        `${out.rgba[pixel * 4]},${out.rgba[pixel * 4 + 1]},${out.rgba[pixel * 4 + 2]}`,
      );

      if (now == null) {
        continue;
      }
      out.rgba[pixel * 4] = now.r;
      out.rgba[pixel * 4 + 1] = now.g;
      out.rgba[pixel * 4 + 2] = now.b;
    }
    return out;
  });
}

/** One berry's grid and the description beside it. */
function write(name: string, cells: Image[]): { path: string; bytes: number } {
  const trim = trimOf(cells);
  const grid = packGrid(cells, trim);
  const drawn = encodeSmallest(grid);
  const folder = join(ROOT, name);
  // Where the soil the plant grows out of meets the tile, taken off the
  // grown plant and written in the cell's own coordinates. Every stage
  // is drawn on the same mound, so one point serves the row: a patch
  // that has just been picked must not shift on the board
  const base = groundPoint(cells[(STAGES - 1) * FRAMES]);

  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'image.png'), drawn.bytes);
  writeFileSync(
    join(folder, 'data.json'),
    `${JSON.stringify(
      {
        compact: true,
        width: grid.width,
        height: grid.height,
        grid: {
          columns: FRAMES,
          rows: STAGES,
          frameWidth: trim.width,
          frameHeight: trim.height,
          sourceFrameWidth: CELL.width,
          sourceFrameHeight: CELL.height,
          trim: [trim.x, trim.y],
          base,
        },
        images: [
          {
            name: 'grid',
            x: 0,
            y: 0,
            width: grid.width,
            height: grid.height,
            sourceWidth: CELL.width * FRAMES,
            sourceHeight: CELL.height * STAGES,
            trim: [trim.x, trim.y],
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  return { path: join(folder, 'image.png'), bytes: drawn.bytes.length };
}

const sheet = decode(readFileSync(SOURCE));
const spread = sheetSpread(sheet);
const blocks = BANDS.length * 16;
let cut = 0;
let grown = 0;

for (const name of OURS) {
  const block = blockOf(name);

  if (block != null) {
    const { path, bytes } = write(name, cutPlant(sheet, block.band, block.pair));

    cut += 1;
    console.log(`  ${name.padEnd(13)} cut     ${String(bytes).padStart(5)}b  ${path}`);
    continue;
  }
  const donor = GROWN_FROM.get(name);
  const from = donor == null ? null : blockOf(donor);

  if (donor == null || from == null) {
    console.log(`  ${name.padEnd(9)} SKIPPED, no plant and nothing to grow it from`);
    continue;
  }
  const cells = cutPlant(sheet, from.band, from.pair);
  const fruit = fruitColours(cells, spread, blocks);
  const { path, bytes } = write(name, recolour(cells, fruit, paintFor(name)));

  grown += 1;
  console.log(
    `  ${name.padEnd(13)} grown from ${donor.padEnd(7)} ${String(bytes).padStart(5)}b` +
      `  ${fruit.size} colours repainted  ${path}`,
  );
}
console.log(`\n${cut} cut from the sheet, ${grown} grown from a relative, ${OURS.length} berries`);
