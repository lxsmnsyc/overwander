import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';

/**
 * The seven apricorn trees, grown out of the Nanab berry plant.
 *
 * Nobody drew an apricorn tree for this game, and the berry rip has
 * one plant shaped exactly like one: a round canopy on a short trunk
 * with big round fruit hanging in it. So the apricorns borrow it. The
 * canopy is painted green, which a fruit tree ought to be and the
 * Nanab is not, and the fruit takes the colour of the apricorn it
 * bears, the way the prize berries take theirs.
 *
 * The two halves are told apart by what the growth stages say: a
 * colour the ripe stage has and the bare stage has not is fruit, and
 * the rest of the plant is what was there all along. Both are then
 * painted by hue, so every pixel keeps the shading it was drawn with
 * rather than becoming a flat patch of colour.
 *
 * ```bash
 * pnpm apricorn-trees
 * ```
 *
 * Run `pnpm compact-sprites` afterwards, which records the sheets it
 * writes.
 */

/** The plant they are all grown from. */
const DONOR = 'public/sprites/overworld/landmarks-berry/nanab';

const ROOT = 'public/sprites/overworld/landmarks-apricorn';

/** The apricorn icons, which is where each fruit's colour comes from. */
const ICONS = 'public/sprites/ui/items/apricorn';

/**
 * The seven, as [`apricorns.ts`](../src/data/items/apricorns.ts) files
 * them. Written out rather than imported, since that module reaches
 * the `const enum`s node refuses to load
 */
const COLOURS = ['red', 'blue', 'yellow', 'green', 'pink', 'white', 'black'];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/**
 * The hue a leaf is, and how much of the donor's own saturation it
 * keeps. The Nanab's canopy is blue, so this is what makes the tree
 * read as a tree rather than as somebody else's berry
 */
const LEAF = { h: 128 / 360, saturation: 0.85 };

/** Which hues the canopy is drawn in, as degrees, ends included. */
const FOLIAGE_HUES = [180, 260];

/** And the fruit, which is the one part a stage tells apart. */
const FRUIT_HUES = [280, 330];

/**
 * White and black have no hue to take: their icons are nearly
 * colourless, so the most saturated pixel of one is its stem. They are
 * painted by lightness instead, mapped into a band so the fruit keeps
 * its own shading and its highlight
 */
const COLOURLESS: Partial<Record<string, { saturation: number; from: number; span: number }>> = {
  white: { saturation: 0.08, from: 0.6, span: 0.38 },
  black: { saturation: 0.1, from: 0.08, span: 0.32 },
};

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

/** Whether a colour's hue falls in a band, which is written in degrees. */
function within(colour: Rgb, band: number[]): boolean {
  const { h, s } = toHsl(colour);

  // A grey has no hue to be in a band, and the outlines are grey
  return s > 0.1 && h * 360 >= band[0] && h * 360 <= band[1];
}

function keyOf(colour: Rgb): string {
  return `${colour.r},${colour.g},${colour.b}`;
}

function colourAt(image: Image, at: number): Rgb & { a: number } {
  return {
    r: image.rgba[at * 4],
    g: image.rgba[at * 4 + 1],
    b: image.rgba[at * 4 + 2],
    a: image.rgba[at * 4 + 3],
  };
}

interface Described {
  grid: { columns: number; rows: number; frameWidth: number; frameHeight: number };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

/** The donor's own description, which the trees are written back with. */
function describedBy(folder: string): Described {
  const parsed: unknown = JSON.parse(readFileSync(join(folder, 'data.json'), 'utf8'));

  if (!isRecord(parsed) || !isRecord(parsed.grid)) {
    throw new Error(`${folder} has no grid to grow a tree on`);
  }
  const grid = parsed.grid;

  return {
    grid: {
      columns: Number(grid.columns),
      rows: Number(grid.rows),
      frameWidth: Number(grid.frameWidth),
      frameHeight: Number(grid.frameHeight),
    },
  };
}

/** Every colour lit in one row of the growth grid, and how much of it. */
function coloursInStage(image: Image, described: Described, stage: number): Map<string, number> {
  const { frameHeight } = described.grid;
  const found = new Map<string, number>();

  for (let y = stage * frameHeight; y < (stage + 1) * frameHeight && y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const at = colourAt(image, y * image.width + x);

      if (at.a > 0) {
        found.set(keyOf(at), (found.get(keyOf(at)) ?? 0) + 1);
      }
    }
  }
  return found;
}

/**
 * What an icon is mostly coloured, taken from its most saturated
 * third. The same measure the berry plants take theirs by
 */
function iconColour(colour: string): Rgb {
  const sheet = decode(readFileSync(join(ICONS, 'image.png')));
  const described: unknown = JSON.parse(readFileSync(join(ICONS, 'data.json'), 'utf8'));
  const images = isRecord(described) && Array.isArray(described.images) ? described.images : [];
  const entry = images.filter(isRecord).find((one) => one.name === `${colour}.png`);

  if (entry == null) {
    throw new Error(`No icon for ${colour}, so nothing says what colour its fruit is`);
  }
  const left = Number(entry.x);
  const top = Number(entry.y);
  const found: { colour: Rgb; saturation: number }[] = [];

  for (let y = 0; y < Number(entry.height); y += 1) {
    for (let x = 0; x < Number(entry.width); x += 1) {
      const at = colourAt(sheet, (top + y) * sheet.width + left + x);

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
    throw new Error(`The icon for ${colour} has no colour to take`);
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
 * How much a fruit that is nearly the colour of a leaf is pushed away
 * from it, in lightness and in saturation. Without it the green
 * apricorn hangs in a green canopy and reads as more canopy
 */
const AGAINST_LEAF = { degrees: 35, darker: 0.1, saturation: 1.3 };

/**
 * How much of the donor's shading spread the fruit keeps. The Nanab's
 * fruit is drawn nearly black in shadow and nearly white in highlight,
 * which is a wider range than a small apricorn wants: compressed, the
 * shading still reads and the colour is the colour it is named after
 */
const SHADING = 0.65;

/**
 * How to paint one apricorn's fruit, given what the pixel was.
 *
 * The drawn shading is kept as a **spread** rather than as absolute
 * lightness: the fruit's pixels keep how far apart they are, and the
 * middle of them moves to the icon's own lightness. Keeping the
 * donor's lightness outright makes a pink apricorn a maroon one, since
 * the Nanab it is painted over is a darker fruit than a pink apricorn
 * is
 */
function fruitPaint(colour: string, middle: number): (was: Hsl) => Hsl {
  const flat = COLOURLESS[colour];

  if (flat != null) {
    return (was) => ({ h: 0, s: flat.saturation, l: flat.from + was.l * flat.span });
  }
  const wanted = toHsl(iconColour(colour));
  const apart = Math.abs(wanted.h - LEAF.h) * 360;
  const close = Math.min(apart, 360 - apart) < AGAINST_LEAF.degrees;
  const sink = close ? AGAINST_LEAF.darker : 0;
  const saturation = wanted.s * (close ? AGAINST_LEAF.saturation : 1);

  return (was) => ({
    h: wanted.h,
    s: Math.min(1, Math.max(saturation, was.s * 0.6)),
    l: Math.min(0.97, Math.max(0.06, wanted.l + (was.l - middle) * SHADING - sink)),
  });
}

/** The canopy, in green, however blue it was drawn. */
function leafPaint(was: Hsl): Hsl {
  return { h: LEAF.h, s: was.s * LEAF.saturation, l: was.l };
}

/**
 * One tree: the donor's pixels with the canopy turned green and the
 * fruit turned whatever colour this apricorn is. Anything that is
 * neither, the trunk, the mound and the grass round it, is left as it
 * was drawn
 */
function grow(donor: Image, swaps: Map<string, Rgb>): Image {
  const grown: Image = { width: donor.width, height: donor.height, rgba: Buffer.from(donor.rgba) };

  for (let pixel = 0; pixel < donor.width * donor.height; pixel += 1) {
    const at = colourAt(grown, pixel);

    if (at.a === 0) {
      continue;
    }
    const now = swaps.get(keyOf(at));

    if (now == null) {
      continue;
    }
    grown.rgba[pixel * 4] = now.r;
    grown.rgba[pixel * 4 + 1] = now.g;
    grown.rgba[pixel * 4 + 2] = now.b;
  }
  return grown;
}

function write(colour: string, grown: Image, description: string): number {
  const drawn = encodeSmallest(grown);
  const folder = join(ROOT, colour);

  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'image.png'), drawn.bytes);
  writeFileSync(join(folder, 'data.json'), description);
  return drawn.bytes.length;
}

const donor = decode(readFileSync(join(DONOR, 'image.png')));
const described = describedBy(DONOR);
const description = readFileSync(join(DONOR, 'data.json'), 'utf8');
const bare = coloursInStage(donor, described, 0);
const ripe = coloursInStage(donor, described, described.grid.rows - 1);

/**
 * The fruit, and the canopy it hangs in.
 *
 * A colour the ripe stage has and the bare stage has not is fruit, and
 * the hue bands are what keep the shadow a fruit casts on a leaf out
 * of the fruit: it arrives with the fruit and it is a leaf colour
 */
function colourOf(key: string): Rgb {
  const [r, g, b] = key.split(',').map(Number);

  return { r, g, b };
}

const fruit = [...ripe]
  .filter(([key]) => !bare.has(key))
  .map(([key, pixels]) => ({ colour: colourOf(key), pixels }))
  .filter((one) => within(one.colour, FRUIT_HUES));

const foliage = [...new Set([...bare.keys(), ...ripe.keys()])]
  .map(colourOf)
  .filter((colour) => within(colour, FOLIAGE_HUES));

if (fruit.length === 0 || foliage.length === 0) {
  throw new Error('The donor has no fruit or no canopy to paint, so nothing here would show');
}

const leaves = new Map<string, Rgb>();

for (const colour of foliage) {
  leaves.set(keyOf(colour), toRgb(leafPaint(toHsl(colour))));
}

/**
 * The shade the fruit is mostly drawn in, which is the one painted the
 * icon's own colour: the rest of the shading is hung above and below
 * it. The **most drawn** shade rather than the average of them, so a
 * one-pixel highlight cannot drag the body of the fruit darker than
 * the apricorn it is supposed to be
 */
const body = fruit.reduce((most, one) => (one.pixels > most.pixels ? one : most), fruit[0]);
const middle = toHsl(body.colour).l;

for (const colour of COLOURS) {
  const paint = fruitPaint(colour, middle);
  const swaps = new Map(leaves);

  for (const { colour: was } of fruit) {
    swaps.set(keyOf(was), toRgb(paint(toHsl(was))));
  }
  const bytes = write(colour, grow(donor, swaps), description);

  console.log(`${join(ROOT, colour)}  ${(bytes / 1024).toFixed(1)}K`);
}
console.log(
  `${COLOURS.length} trees from ${DONOR}: ${foliage.length} canopy colours, ${fruit.length} fruit`,
);
