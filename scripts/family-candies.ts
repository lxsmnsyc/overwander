import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import pack from '../src/server/sprites/packing.ts';

/**
 * A candy per evolution family, in that family's own colours.
 *
 * Candy is held by the family rather than by the species, so a bag row
 * needs one picture per family and no way to confuse two. There is one
 * drawing of a candy, the PokeSprite hard candy, and ten colours of
 * it: not a hundred and thirty. So each family's candy is a **palette
 * swap** of that drawing, painted in the colours its own sprite is
 * mostly drawn in.
 *
 * The drawing is a ball with three wrapper stripes across it, and the
 * three colours land one to a surface: the most drawn on the ball, the
 * second on the top and bottom stripes, the third on the middle one.
 * The shadow under the ball and the glint on it are not colours of
 * their own, they are that surface lit and unlit, so a swap keeps how
 * far each pixel sits from its surface's own tone.
 *
 * The colours are read off the sheet of the family's base species,
 * which is the pokemon the family is named after.
 *
 * ```bash
 * pnpm family-candies
 * ```
 *
 * Run `pnpm compact-sprites` afterwards to record the sheets.
 */

const SPECIES_ROOT = 'src/data/species';

const SPRITE_ROOT = 'public/sprites/pokemon';

const OUT = 'public/sprites/ui/candies';

/** The drawing every candy is a recolour of. */
const TEMPLATE = { sheet: 'public/sprites/ui/items/candies', picture: 'red.png' };

/**
 * Which regions have sheets, by the dex numbers they cover. Repeated
 * from [`regions.ts`](../src/data/species/regions.ts), which cannot be
 * imported into a script: it reads `const enum`s, which node refuses
 */
const REGIONS: { name: string; from: number; to: number }[] = [
  { name: 'kanto', from: 1, to: 151 },
  { name: 'johto', from: 152, to: 251 },
  { name: 'hoenn', from: 252, to: 386 },
];

/** Where the ids are written down, read as text for the same reason. */
const IDS = {
  species: 'src/data/ids/species.ts',
  families: 'src/data/ids/families.ts',
};

/**
 * How far apart two hues have to be to be two colours rather than one
 * and its shading, in degrees. A pokemon's shading is its own hue
 * darkened, so a ramp lands well inside this
 */
const APART = 25;

/**
 * Under this much chroma a colour has no hue worth grouping by: it is
 * the sprite's white, grey or cream, and those are gathered together
 */
const NEUTRAL = 0.25;

/**
 * How much a neutral counts for against a coloured cluster of the same
 * size. A pokemon drawn half in white and half in red is a red one
 */
const NEUTRAL_WEIGHT = 0.4;

/**
 * How much of a sprite a colour has to cover to be one of its
 * colours. Under this it is an eye, a tongue or an outline seam, which
 * is not what the pokemon looks like
 */
const SHARE = 0.06;

/** Pixels this dark are the outline, whatever hue they carry. */
const OUTLINE_LIGHT = 0.16;

/**
 * The lightness a cluster is named by. A sprite's own mid tone is what
 * the candy is painted in: its highlights are the light on it rather
 * than its colour, and painting from one of those gives a peach
 * Charmander
 */
const NAMED_BY = { from: 0.25, to: 0.68 };

/** The template's outline, which no family repaints. */
const OUTLINE = '41,41,41';

/**
 * The wrapper's colours in the template: the stripes lit, shaded, and
 * where the light catches them. Everything else lit is the ball
 */
const WRAPPER = new Set(['238,222,238', '197,189,222', '255,246,246']);

/**
 * The template colour each surface is measured from, so a swap keeps
 * the drawing's shading: how far a pixel sits from its surface's own
 * tone is what carries over, not its absolute lightness
 */
const REFERENCE = { ball: '230,82,98', stripe: '238,222,238' };

/**
 * How much of a colour's darkness the stripes take. They are the light
 * part of the candy, and a family whose second colour is a dark blue
 * still needs stripes that read as stripes
 */
const STRIPE_LIFT = 0.45;

/** How far the stripes stay from the ball in lightness, so they show. */
const SEPARATION = 0.22;

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Which surface a pixel of the template belongs to. */
type Surface = 'ball' | 'stripe' | 'middle';

interface Entry {
  species: number;
  dex: number;
  family: number;
  from: number | null;
}

interface Candy {
  name: string;
  image: Image;
  w: number;
  h: number;
}

function say(message: string): void {
  console.log(message);
}

/** The numbers one `const enum` gives out, by name. */
function idsOf(file: string, name: string): Map<string, number> {
  const source = readFileSync(file, 'utf8');
  const body = source.slice(source.indexOf(`enum ${name} {`));
  const ids = new Map<string, number>();

  for (const [, key, id] of body.slice(0, body.indexOf('\n}')).matchAll(/(\w+) = (\d+),/g)) {
    ids.set(key, Number(id));
  }
  return ids;
}

/**
 * Every registered species with the three things a family needs of it:
 * which family it belongs to, its dex number, and what it evolved
 * from. Read out of the registration calls as text, since their files
 * reach the `const enum`s node will not load
 */
function entriesOf(species: Map<string, number>, families: Map<string, number>): Entry[] {
  const entries: Entry[] = [];

  for (const generation of readdirSync(SPECIES_ROOT).filter((name) => name.startsWith('gen-'))) {
    const folder = join(SPECIES_ROOT, generation);

    for (const file of readdirSync(folder).filter((name) => name.endsWith('.ts'))) {
      const source = readFileSync(join(folder, file), 'utf8');

      for (const block of source.split('registerSpecies(Species.').slice(1)) {
        const id = species.get(block.slice(0, block.indexOf(',')));
        const family = families.get(/family: Families\.(\w+),/.exec(block)?.[1] ?? '');
        const dex = Number(/dexNumber: (\d+),/.exec(block)?.[1] ?? 0);
        const from = species.get(/evolvesFrom: Species\.(\w+),/.exec(block)?.[1] ?? '');

        if (id != null && family != null) {
          entries.push({ species: id, dex, family, from: from ?? null });
        }
      }
    }
  }
  return entries;
}

/**
 * A family whose species are registered in a loop rather than one call
 * at a time, which the scan above cannot see. Unown is the only one:
 * its twenty-eight forms are written out of a list, so the family is
 * matched to the species of the same name instead, whose id is its dex
 * number
 */
function loopRegistered(
  entries: Entry[],
  species: Map<string, number>,
  families: Map<string, number>,
): Entry[] {
  const found = new Set(entries.map((entry) => entry.family));
  const missed: Entry[] = [];

  for (const [name, family] of families) {
    const id = species.get(name);

    if (!found.has(family) && id != null) {
      missed.push({ species: id, dex: id, family, from: null });
    }
  }
  return missed;
}

function toHsl(colour: [number, number, number]): Hsl {
  const [red, green, blue] = colour.map((part) => part / 255);
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  const span = high - low;
  const l = (high + low) / 2;
  let h = 0;

  if (span > 0) {
    if (high === red) {
      h = ((green - blue) / span + (green < blue ? 6 : 0)) / 6;
    } else if (high === green) {
      h = ((blue - red) / span + 2) / 6;
    } else {
      h = ((red - green) / span + 4) / 6;
    }
  }
  return { h, s: span === 0 ? 0 : span / (1 - Math.abs(2 * l - 1)), l };
}

function fromHsl({ h, s, l }: Hsl): [number, number, number] {
  const reach = Math.min(Math.max(s, 0), 1) * Math.min(l, 1 - l);
  const at = (turn: number): number => {
    const k = (turn + ((h % 1) + 1) * 12) % 12;

    return Math.round((l - reach * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
  };

  return [at(0), at(8), at(4)];
}

function keyOf(rgba: Uint8Array, at: number): string {
  return `${rgba[at]},${rgba[at + 1]},${rgba[at + 2]}`;
}

function colourOf(key: string): [number, number, number] {
  const [red, green, blue] = key.split(',').map(Number);

  return [red, green, blue];
}

interface Shade extends Hsl {
  colour: [number, number, number];
  /** How much colour it carries at all, which lightness does not say. */
  chroma: number;
  pixels: number;
}

/** Every exact colour one sheet is drawn in, most-drawn first. */
function shadesOf(sheet: Image): Shade[] {
  const counts = new Map<string, number>();

  for (let at = 0; at < sheet.rgba.length; at += 4) {
    const key = keyOf(sheet.rgba, at);

    // The outline is left out: every pokemon is drawn in it, so it
    // says nothing about any of them
    if (sheet.rgba[at + 3] < 255 || toHsl(colourOf(key)).l < OUTLINE_LIGHT) {
      continue;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .sort((one, two) => two[1] - one[1])
    .map(([key, pixels]) => {
      const colour = colourOf(key);
      const parts = colour.map((part) => part / 255);

      return { colour, ...toHsl(colour), chroma: Math.max(...parts) - Math.min(...parts), pixels };
    });
}

/** Whether one shade is another one lit differently rather than another colour. */
function alike(one: Shade, two: Shade): boolean {
  if (one.chroma < NEUTRAL || two.chroma < NEUTRAL) {
    return one.chroma < NEUTRAL && two.chroma < NEUTRAL;
  }
  const turn = Math.abs(one.h - two.h);

  return Math.min(turn, 1 - turn) * 360 < APART;
}

/**
 * The colours one sprite is mostly drawn in, the one it is mostly
 * drawn in first.
 *
 * Shades of one colour are gathered together, so a body and the shadow
 * across it count once, and a cluster is named by a mid tone of it
 * rather than by whichever shade covers the most pixels
 */
function coloursOf(sheet: Image): [number, number, number][] {
  const shades = shadesOf(sheet);
  const drawn = shades.reduce((total, shade) => total + shade.pixels, 0);
  const clusters: { shades: Shade[]; pixels: number }[] = [];

  for (const shade of shades) {
    const near = clusters.find((cluster) => alike(cluster.shades[0], shade));

    if (near == null) {
      clusters.push({ shades: [shade], pixels: shade.pixels });
    } else {
      near.shades.push(shade);
      near.pixels += shade.pixels;
    }
  }
  return clusters
    .filter((cluster) => cluster.pixels >= drawn * SHARE)
    .sort(
      (one, two) =>
        two.pixels * (NEUTRAL_WEIGHT + two.shades[0].chroma) -
        one.pixels * (NEUTRAL_WEIGHT + one.shades[0].chroma),
    )
    .slice(0, 3)
    .map(
      (cluster) =>
        (
          cluster.shades.find((shade) => shade.l >= NAMED_BY.from && shade.l <= NAMED_BY.to) ??
          cluster.shades[0]
        ).colour,
    );
}

/** One picture off a packed sheet, as its own image. */
function pictureOf(folder: string, name: string): Image {
  const parsed: unknown = JSON.parse(readFileSync(join(folder, 'data.json'), 'utf8'));
  const held =
    typeof parsed === 'object' &&
    parsed != null &&
    'images' in parsed &&
    Array.isArray(parsed.images)
      ? parsed.images
      : [];
  const box = held
    .map((entry: Record<string, unknown>) => ({
      name: String(entry.name),
      x: Number(entry.x),
      y: Number(entry.y),
      width: Number(entry.width),
      height: Number(entry.height),
    }))
    .find((entry) => entry.name === name);

  if (box == null) {
    throw new Error(`No ${name} on ${folder}`);
  }
  const atlas = decode(readFileSync(join(folder, 'image.png')));
  const picture: Image = {
    width: box.width,
    height: box.height,
    rgba: Buffer.alloc(box.width * box.height * 4),
  };

  for (let y = 0; y < box.height; y += 1) {
    for (let x = 0; x < box.width; x += 1) {
      const from = ((box.y + y) * atlas.width + box.x + x) * 4;

      picture.rgba.set(atlas.rgba.subarray(from, from + 4), (y * box.width + x) * 4);
    }
  }
  return picture;
}

/**
 * Which surface each pixel of the template is part of, or nothing for
 * the outline and the empty corners.
 *
 * The stripes are found rather than listed: the wrapper's pixels fall
 * into three runs across the ball, and the one in the middle is the
 * middle stripe. Reading them off the drawing means a template redrawn
 * a pixel wider still paints correctly
 */
function neighbours(at: number, width: number, height: number): number[] {
  const x = at % width;
  const y = Math.floor(at / width);
  const found: number[] = [];

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
        found.push((y + dy) * width + x + dx);
      }
    }
  }
  return found;
}

function surfacesOf(template: Image): (Surface | null)[] {
  const { width, height, rgba } = template;
  const wrapper = (at: number): boolean => rgba[at * 4 + 3] > 0 && WRAPPER.has(keyOf(rgba, at * 4));
  const bands: number[][] = [];
  const seen = new Set<number>();

  for (let at = 0; at < width * height; at += 1) {
    if (!wrapper(at) || seen.has(at)) {
      continue;
    }
    const band: number[] = [];
    const walking = [at];

    seen.add(at);
    while (walking.length > 0) {
      const held = walking.pop() ?? 0;

      band.push(held);
      for (const next of neighbours(held, width, height)) {
        if (wrapper(next) && !seen.has(next)) {
          seen.add(next);
          walking.push(next);
        }
      }
    }
    bands.push(band);
  }

  /** How far down the ball a band sits, which is what orders them. */
  const down = (band: number[]): number =>
    band.reduce((total, at) => total + Math.floor(at / width), 0) / band.length;

  bands.sort((one, two) => down(one) - down(two));

  const middle = bands[Math.floor(bands.length / 2)] ?? [];
  const surfaces: (Surface | null)[] = [];

  for (let at = 0; at < width * height; at += 1) {
    if (rgba[at * 4 + 3] === 0 || keyOf(rgba, at * 4) === OUTLINE) {
      surfaces.push(null);
    } else {
      surfaces.push(wrapper(at) ? 'stripe' : 'ball');
    }
  }
  for (const at of middle) {
    surfaces[at] = 'middle';
  }
  return surfaces;
}

/**
 * One template pixel repainted in a family's colour.
 *
 * The template's own tone for the surface is the anchor: how far the
 * pixel sits from it in saturation and lightness is what makes the ball
 * look round, and that distance is what carries over. The hue is the
 * family's outright
 */
function swap(colour: string, surface: Surface, into: Hsl): [number, number, number] {
  const from = toHsl(colourOf(colour));
  const anchor = toHsl(colourOf(surface === 'ball' ? REFERENCE.ball : REFERENCE.stripe));

  return fromHsl({
    h: into.h,
    s: anchor.s === 0 ? into.s : Math.min((from.s / anchor.s) * into.s, 1),
    l: Math.min(
      Math.max(from.l + (into.l - anchor.l) * (surface === 'ball' ? 1 : STRIPE_LIFT), 0.12),
      0.97,
    ),
  });
}

/**
 * What each surface is painted in, from however many colours the
 * sprite gave up.
 *
 * A family drawn in one colour still has a wrapper to paint, so the
 * stripes are that colour turned up until they read as stripes, and
 * the middle one is a shade off the other two
 */
function palette(colours: [number, number, number][]): Record<Surface, Hsl> {
  const ball = toHsl(colours[0]);
  const second = colours.length > 1 ? toHsl(colours[1]) : { ...ball, s: ball.s * 0.5, l: 0.9 };
  const stripe =
    Math.abs(second.l - ball.l) < SEPARATION
      ? { ...second, l: Math.min(Math.max(second.l, ball.l + SEPARATION), 0.94) }
      : second;

  return {
    ball,
    stripe,
    middle:
      colours.length > 2
        ? toHsl(colours[2])
        : { ...stripe, s: stripe.s * 0.75, l: stripe.l - 0.09 },
  };
}

/** The template repainted for one family. */
function candyOf(
  template: Image,
  surfaces: (Surface | null)[],
  colours: [number, number, number][],
): Image {
  const paint = palette(colours);
  const painted = new Map<string, [number, number, number]>();
  const image: Image = {
    width: template.width,
    height: template.height,
    rgba: Buffer.from(template.rgba),
  };

  for (let at = 0; at < surfaces.length; at += 1) {
    const surface = surfaces[at];

    if (surface == null) {
      continue;
    }
    const colour = keyOf(image.rgba, at * 4);
    const key = `${surface} ${colour}`;
    const into = painted.get(key) ?? swap(colour, surface, paint[surface]);

    painted.set(key, into);
    image.rgba[at * 4] = into[0];
    image.rgba[at * 4 + 1] = into[1];
    image.rgba[at * 4 + 2] = into[2];
  }
  return image;
}

/** Which region's sheet a family's candy goes on. */
function regionOf(dex: number): string | null {
  return REGIONS.find((region) => dex >= region.from && dex <= region.to)?.name ?? null;
}

/** One species' sheet, or nothing for one nobody has drawn. */
function sheetOf(species: number, dex: number): Image | null {
  const region = regionOf(dex);

  if (region == null) {
    return null;
  }
  try {
    return decode(readFileSync(join(SPRITE_ROOT, region, String(species), 'regular.png')));
  } catch {
    return null;
  }
}

/** One sheet of candies, written out. */
function write(region: string, candies: Candy[]): void {
  const layout = pack(candies);
  const sheet: Image = {
    width: layout.width,
    height: layout.height,
    rgba: Buffer.alloc(layout.width * layout.height * 4),
  };
  const placed = [];

  for (const { box, x, y } of layout.placed) {
    for (let row = 0; row < box.image.height; row += 1) {
      const from = row * box.image.width * 4;

      box.image.rgba.copy(
        sheet.rgba,
        ((y + row) * sheet.width + x) * 4,
        from,
        from + box.image.width * 4,
      );
    }
    placed.push({
      name: box.name,
      x,
      y,
      width: box.image.width,
      height: box.image.height,
      // The candy is drawn small inside an item's cell, the way the
      // sheet it was cut from has it
      sourceWidth: 32,
      sourceHeight: 32,
      trim: [8, 12],
    });
  }

  const drawn = encodeSmallest(sheet);
  const folder = join(OUT, region);

  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, 'image.png'), drawn.bytes);
  writeFileSync(
    join(folder, 'data.json'),
    `${JSON.stringify({
      compact: true,
      width: sheet.width,
      height: sheet.height,
      // By family, so a candy added later does not move the rest
      images: placed.sort((one, two) => Number(one.name) - Number(two.name)),
    })}\n`,
  );
  say(
    `${folder}  ${sheet.width}x${sheet.height}, ${placed.length} candies, ` +
      `${(drawn.bytes.length / 1024).toFixed(1)}K as ${drawn.as}`,
  );
}

const species = idsOf(IDS.species, 'Species');
const families = idsOf(IDS.families, 'Families');
const entries = entriesOf(species, families);

entries.push(...loopRegistered(entries, species, families));

const template = pictureOf(TEMPLATE.sheet, TEMPLATE.picture);
const surfaces = surfacesOf(template);
const byRegion = new Map<string, Candy[]>();
const undrawn: number[] = [];

for (const family of [...new Set(entries.map((entry) => entry.family))].sort(
  (one, two) => one - two,
)) {
  const members = entries
    .filter((entry) => entry.family === family)
    .sort((one, two) => one.dex - two.dex);
  // The base is what the family is called and so what its candy is
  // painted from; the earliest member is where the line comes from and
  // so which sheet it is filed on. A baby added a generation later
  // makes those two different pokemon
  const base = members.find((entry) => entry.from == null) ?? members[0];
  const region = regionOf(members[0].dex);
  const sheet = sheetOf(base.species, base.dex);
  const colours = sheet == null ? [] : coloursOf(sheet);

  if (region == null || colours.length === 0) {
    undrawn.push(family);
    continue;
  }
  const held = byRegion.get(region) ?? [];

  held.push({
    name: String(family),
    image: candyOf(template, surfaces, colours),
    w: template.width,
    h: template.height,
  });
  byRegion.set(region, held);
}

for (const [region, candies] of byRegion) {
  write(region, candies);
}
if (undrawn.length > 0) {
  say(`no sprite to read a colour off for ${undrawn.length} families: ${undrawn.join(', ')}`);
}
