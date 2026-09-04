import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import decode, { type Image, encodeSmallest } from '../src/server/sprites/png.ts';
import { packSmallest } from '../src/server/sprites/packing.ts';

/**
 * Item pictures that no rip drew.
 *
 * A few items are this engine's own and have no mainline art anywhere:
 * a portal key, a purifying gem, a utility belt. They used to point at
 * somebody else's picture, which is a loan that goes wrong twice over,
 * once when the borrowed item is added and wants its picture back, and
 * once when a tray shows two rows with the same square in them.
 *
 * So they are made here instead. Most are a **palette swap** of a
 * picture that already has the right shape, which is how the sheets
 * draw eighteen gems and eighteen plates; the swaps are exact colour
 * for exact colour, because the art is indexed in practice. Two are
 * drawn outright from grids written down below.
 */

const ROOT = 'public/sprites/ui/items';

/** How wide a cell of an item sheet is. Every sheet is cut at this. */
const CELL = 32;

interface Picture {
  name: string;
  image: Image;
  /** Where it sits in its 32x32 cell. */
  trim: [number, number];
  /** Where it sits on the sheet, or nothing until it is placed. */
  at?: [number, number];
}

interface Sheet {
  atlas: Image;
  pictures: Picture[];
}

function hexOf(image: Image, at: number): string {
  return `#${((image.rgba[at] << 16) | (image.rgba[at + 1] << 8) | image.rgba[at + 2])
    .toString(16)
    .padStart(6, '0')}`;
}

function readSheet(name: string): Sheet {
  const parsed: unknown = JSON.parse(readFileSync(join(ROOT, name, 'data.json'), 'utf8'));

  if (typeof parsed !== 'object' || parsed === null || !('images' in parsed)) {
    throw new Error(`Sheet ${name} has no description`);
  }
  const images = parsed.images;

  if (!Array.isArray(images)) {
    throw new Error(`Sheet ${name} describes no pictures`);
  }
  const atlas = decode(readFileSync(join(ROOT, name, 'image.png')));

  return {
    atlas,
    pictures: images.map((entry: Record<string, number | string | number[]>) => {
      const box = {
        name: String(entry.name).replace(/\.png$/, ''),
        x: Number(entry.x),
        y: Number(entry.y),
        width: Number(entry.width),
        height: Number(entry.height),
        trim: Array.isArray(entry.trim) ? entry.trim.map(Number) : [0, 0],
      };
      const image: Image = {
        width: box.width,
        height: box.height,
        rgba: Buffer.alloc(box.width * box.height * 4),
      };

      for (let y = 0; y < box.height; y += 1) {
        for (let x = 0; x < box.width; x += 1) {
          const from = ((box.y + y) * atlas.width + box.x + x) * 4;
          const to = (y * box.width + x) * 4;

          image.rgba.set(atlas.rgba.subarray(from, from + 4), to);
        }
      }
      return {
        name: box.name,
        image,
        trim: [box.trim[0], box.trim[1]] as [number, number],
        at: [box.x, box.y] as [number, number],
      };
    }),
  };
}

/**
 * Where a picture can go on a sheet without moving anything already on
 * it, or nothing if there is no room. Top-left first fit, which is
 * enough: the pictures are all about a cell wide and the gaps left by
 * the sheets' own packing are about that size too
 */
function roomFor(
  taken: Uint8Array,
  width: number,
  height: number,
  want: Image,
): [number, number] | null {
  for (let y = 0; y + want.height <= height; y += 1) {
    for (let x = 0; x + want.width <= width; x += 1) {
      let free = true;

      for (let row = 0; row < want.height && free; row += 1) {
        for (let column = 0; column < want.width; column += 1) {
          if (taken[(y + row) * width + x + column] === 1) {
            free = false;
            break;
          }
        }
      }
      if (free) {
        return [x, y];
      }
    }
  }
  return null;
}

function mark(taken: Uint8Array, width: number, at: [number, number], image: Image): void {
  for (let row = 0; row < image.height; row += 1) {
    for (let column = 0; column < image.width; column += 1) {
      taken[(at[1] + row) * width + at[0] + column] = 1;
    }
  }
}

/**
 * Writes a file in one step.
 *
 * Through a temporary name and a rename, which is atomic: a sheet is
 * two files that have to agree, and a description caught half-written
 * is one nothing can parse
 */
function write(path: string, body: Buffer | string): void {
  writeFileSync(`${path}.writing`, body);
  renameSync(`${path}.writing`, path);
}

/** A sheet's pictures each given a place, and how big that came to. */
interface Layout {
  places: Map<string, [number, number]>;
  width: number;
  height: number;
}

function areaOf(layout: Layout): number {
  return layout.width * layout.height;
}

/**
 * Every picture kept exactly where it is, with the new ones dropped
 * into the gaps and the sheet grown only when nothing fits
 */
function keptInPlace(sheet: Sheet): Layout {
  const width = sheet.atlas.width;
  let height = sheet.atlas.height;
  let taken = new Uint8Array(width * height);
  const places = new Map<string, [number, number]>();

  for (const picture of sheet.pictures) {
    if (picture.at != null) {
      places.set(picture.name, picture.at);
      mark(taken, width, picture.at, picture.image);
    }
  }

  for (const picture of sheet.pictures) {
    if (picture.at != null) {
      continue;
    }
    let where = roomFor(taken, width, height, picture.image);

    if (where == null) {
      const grown = new Uint8Array(width * (height + picture.image.height));

      grown.set(taken, 0);
      taken = grown;
      height += picture.image.height;
      where = roomFor(taken, width, height, picture.image);
    }
    if (where == null) {
      throw new Error(`No room on the sheet for ${picture.name}`);
    }
    places.set(picture.name, where);
    mark(taken, width, where, picture.image);
  }
  return { places, width, height };
}

/**
 * Every picture placed again from scratch, nothing kept: the tree
 * packer, and rows at every width worth trying, whichever comes out
 * smallest
 */
function packedAfresh(sheet: Sheet): Layout {
  const packed = packSmallest(
    sheet.pictures.map((one) => ({ one, w: one.image.width, h: one.image.height })),
  );

  return {
    places: new Map(packed.placed.map(({ box, x, y }) => [box.one.name, [x, y]])),
    width: packed.width,
    height: packed.height,
  };
}

/**
 * How much smaller a repack has to come out before it is worth moving
 * every picture on the sheet.
 *
 * A high bar, because a repack costs more than the churn in the diff:
 * the sheet keeps its path, so a browser holding the old drawing pairs
 * it with the new description and every icon on the page is then a
 * slice of the wrong thing until the cache turns over. Worth it to save
 * a fifth of a sheet, not worth it to save a twentieth
 */
const WORTH_REPACKING = 0.85;

/**
 * Puts the new pictures on the sheet and writes it back.
 *
 * Keeping what is already placed is the first choice: these sheets
 * were packed by whatever tool cut them, tighter than the packer in
 * this repo manages, so a repack usually costs area rather than saving
 * it. The exception is a sheet that has to grow anyway, where the
 * strip left over can be worse than starting again, so both are worked
 * out and the smaller one wins
 */
function writeSheet(name: string, sheet: Sheet): void {
  const kept = keptInPlace(sheet);
  const grew = kept.width !== sheet.atlas.width || kept.height !== sheet.atlas.height;
  const afresh = grew ? packedAfresh(sheet) : null;
  const layout = afresh != null && areaOf(afresh) < areaOf(kept) * WORTH_REPACKING ? afresh : kept;
  const atlas: Image = {
    width: layout.width,
    height: layout.height,
    rgba: Buffer.alloc(layout.width * layout.height * 4),
  };

  for (const picture of sheet.pictures) {
    const [x, y] = layout.places.get(picture.name) ?? [0, 0];

    for (let row = 0; row < picture.image.height; row += 1) {
      for (let column = 0; column < picture.image.width; column += 1) {
        const from = (row * picture.image.width + column) * 4;

        atlas.rgba.set(
          picture.image.rgba.subarray(from, from + 4),
          ((y + row) * atlas.width + x + column) * 4,
        );
      }
    }
  }

  const encoded = encodeSmallest(atlas);

  write(join(ROOT, name, 'image.png'), encoded.bytes);
  write(
    join(ROOT, name, 'data.json'),
    `${JSON.stringify(
      {
        compact: true,
        width: atlas.width,
        height: atlas.height,
        images: sheet.pictures
          .map((picture) => {
            const [x, y] = layout.places.get(picture.name) ?? [0, 0];

            return {
              name: `${picture.name}.png`,
              x,
              y,
              width: picture.image.width,
              height: picture.image.height,
              sourceWidth: CELL,
              sourceHeight: CELL,
              trim: picture.trim,
            };
          })
          .sort((one, two) => one.name.localeCompare(two.name)),
      },
      null,
      2,
    )}\n`,
  );

  const lit = sheet.pictures.reduce((sum, one) => sum + one.image.width * one.image.height, 0);

  console.log(
    `${name}: ${sheet.pictures.length} pictures, ${atlas.width}x${atlas.height}, ` +
      `${Math.round((lit / areaOf(layout)) * 100)}% full, ` +
      (layout === afresh ? 'packed again' : 'kept as it was'),
  );
}

/** One picture made out of another by swapping its colours one for one. */
interface Tint {
  /** The picture it is made from, as `sheet/name`. */
  from: string;
  /** Where the result lands, as `sheet/name`. */
  to: string;
  /** Why it is not simply borrowing the picture it is made from. */
  why: string;
  /** `#rrggbb` to `#rrggbb`. Every colour of the source must be named. */
  swaps: Record<string, string>;
  /**
   * Pixels painted over the swap afterwards, one row of the picture to
   * a string, a dot for a pixel the swap already got right. A swap can
   * only say what a colour becomes everywhere it appears, and a mark
   * drawn on one part of an object is not a colour: this is for those.
   * A pixel the source left empty stays empty
   */
  paint?: { rows: string[]; colours: Record<string, string> };
}

const TINTS: Tint[] = [
  {
    from: 'key/silver-wing',
    to: 'held/fairy-feather',
    why: 'the boosters are one object each, and the silver wing is its own item',
    swaps: {
      '#202020': '#2a1a24',
      '#e6eeff': '#ffeef6',
      '#bdcdee': '#ffd5ee',
      '#b4c5e6': '#f6c5de',
      '#94acde': '#de94c5',
      '#8394bd': '#c57bb4',
      '#5a6a94': '#a45a8b',
      '#5a7b83': '#8b4a6a',
      '#4a5a6a': '#6a3952',
    },
  },
  {
    from: 'key/intriguing-stone',
    to: 'key/portal-key',
    why: 'the mystic ticket is a mythical item of its own, and the key stone is mega evolution',
    swaps: {
      '#202020': '#141026',
      '#ffffff': '#ffffff',
      '#f6eef6': '#e6f6ff',
      // The warm half of the stone, taken round to the cold end so the
      // two halves read as a way through rather than as a gemstone
      '#ffcd00': '#94f6ff',
      '#ffe683': '#bdffff',
      '#ffeea4': '#d5ffff',
      '#eec573': '#62deee',
      '#f6dea4': '#94eeff',
      '#ffbd7b': '#73e6f6',
      '#eea400': '#41c5de',
      '#f6a44a': '#52cde6',
      '#ee8300': '#29a4c5',
      '#ff5210': '#1883ac',
      '#d52029': '#10628b',
      '#d5005a': '#08396a',
      // The cool half, deepened so the core reads lit against it
      '#b4089c': '#5a1894',
      '#9420b4': '#41108b',
      '#8b4aee': '#7339de',
      '#6239b4': '#39208b',
      '#a4a4f6': '#a494ff',
      '#9483de': '#7b6ac5',
      '#bdc5ff': '#c5b4ff',
      '#5a73e6': '#4a41c5',
    },
  },
  {
    from: 'partner/beach-glass',
    to: 'held/purifying-gem',
    why: 'the sparkling stone is held for Z-Moves, and sea glass is a partner keepsake',
    // A shadow is purple and what lifts it is the light version of the
    // same, so the shard goes white through lilac rather than gold:
    // the sheets are already crowded with gold
    swaps: {
      '#292929': '#2a2135',
      '#b4f6ff': '#fffbff',
      '#94e6ee': '#f6eeff',
      '#73dede': '#eedeff',
      '#52c5e6': '#dec5ff',
      '#52acd5': '#c5a4f6',
      '#529cc5': '#b494ee',
      '#52a4cd': '#bd9cf6',
      '#6ab4cd': '#cdb4ff',
      '#5a9ccd': '#a483e6',
      '#5a8bbd': '#8b6ad5',
    },
  },
  {
    from: 'balls/park',
    to: 'key/gs-ball',
    why: 'the relic is a ball, and the park ball is the one already drawn gold over white',
    // The gold and the white are the park ball's own. What changes is
    // the band, which is black rather than blue, and the button, which
    // is glass rather than orange
    swaps: {
      '#202020': '#202020',
      '#f6d552': '#f6d552',
      '#ffe68b': '#ffe68b',
      '#ffffff': '#ffffff',
      '#de9c29': '#de9c29',
      '#296acd': '#39393f',
      '#7b7b83': '#2a2a2f',
      '#94739c': '#31313a',
      '#ac5a18': '#a4a4c5',
      '#ff8b31': '#f6f6ff',
      '#decdf6': '#decdf6',
      '#a4a4c5': '#a4a4c5',
    },
    paint: {
      // The park ball's blue is a wide sweep rather than a band, so
      // most of it is given back to the lower half: a GS ball is a
      // band, a button and two hemispheres. The hook is the mark on
      // its gold, which is as much of the pair as eighteen pixels
      // hold, since the lower half is a third of the height and a
      // second glyph there reads as a smudge
      rows: [
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '...KKKK...........',
        '...K..............',
        '...K..............',
        '...KKK............',
        '.....K............',
        '..................',
        '..................',
        '..........wwwwws..',
        '........wwwwwws...',
        '.....ssswwwwws....',
        '..................',
        '..................',
        '..................',
      ],
      colours: { K: '#202020', w: '#decdf6', s: '#a4a4c5' },
    },
  },
  {
    from: 'key/member-card',
    to: 'key/wish-tag',
    why: 'the member card is a card, and a wish tag is a paper strip of the same shape',
    // Paper rather than plastic: the card's warm face goes pale sky
    // and its gilt edge goes indigo, which is the sky the comet the
    // tag is written for passes over. The gold the face gives up is
    // what the star is painted in
    swaps: {
      '#202020': '#202020',
      '#ffde83': '#d5e9ff',
      '#f6b47b': '#94b4de',
      '#ffe6b4': '#f6fbff',
      '#946a18': '#31528b',
      '#9c8b20': '#294a7b',
      '#626262': '#8ba4c5',
    },
    paint: {
      // The wish itself, as much of it as five pixels hold: a star on
      // the face of the tag, in the gold the card was drawn in. A
      // written wish would be a smudge at this size
      rows: [
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.........s...........',
        '........sss..........',
        '.........s...........',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
        '.....................',
      ],
      colours: { s: '#ffde83' },
    },
  },
  {
    from: 'ev-items/power-lens',
    to: 'ev-items/utility-belt',
    why: 'the power lens is worn by a pokemon that is already holding it',
    // The ring is a band with fittings set into it, so leather and
    // brass make it a belt without a pixel moving
    swaps: {
      '#202020': '#231810',
      '#ffffff': '#fff6de',
      '#f6b4ff': '#e6bd83',
      '#f652f6': '#d59c5a',
      '#ff62ff': '#c58b4a',
      '#c541de': '#9c6231',
      '#a441bd': '#8b5231',
      '#94419c': '#7b4a29',
      '#6a3973': '#4a2d18',
      '#20e6ff': '#ffcd52',
      '#3994ff': '#e6a420',
    },
  },
];

/**
 * The marks a swap cannot make, painted on where the picture already
 * has a pixel. Nothing is drawn outside the silhouette: a mark is on
 * an object rather than beside it, and painting past the edge would
 * change the shape the picture was borrowed for
 */
function painted(
  name: string,
  image: Image,
  paint: { rows: string[]; colours: Record<string, string> },
): void {
  if (paint.rows.length !== image.height) {
    throw new Error(`${name} paints ${paint.rows.length} rows over ${image.height}`);
  }

  for (let y = 0; y < image.height; y += 1) {
    if (paint.rows[y].length !== image.width) {
      throw new Error(`${name} paints ${paint.rows[y].length} pixels across ${image.width}`);
    }

    for (let x = 0; x < image.width; x += 1) {
      const key = paint.rows[y][x];
      const at = (y * image.width + x) * 4;

      if (key === '.' || image.rgba[at + 3] === 0) {
        continue;
      }
      if (!Object.hasOwn(paint.colours, key)) {
        throw new Error(`${name} paints with ${key}, which it does not name`);
      }
      const packedColour = Number.parseInt(paint.colours[key].slice(1), 16);

      image.rgba[at] = (packedColour >> 16) & 0xff;
      image.rgba[at + 1] = (packedColour >> 8) & 0xff;
      image.rgba[at + 2] = packedColour & 0xff;
    }
  }
}

function tinted(tint: Tint, sheets: Map<string, Sheet>): Picture {
  const [fromSheet, fromName] = tint.from.split('/');
  const source = sheets.get(fromSheet)?.pictures.find((one) => one.name === fromName);

  if (source == null) {
    throw new Error(`Nothing called ${tint.from} to make ${tint.to} from`);
  }
  const image: Image = {
    width: source.image.width,
    height: source.image.height,
    rgba: Buffer.from(source.image.rgba),
  };
  const missed = new Set<string>();

  for (let at = 0; at < image.rgba.length; at += 4) {
    if (image.rgba[at + 3] === 0) {
      continue;
    }
    const was = hexOf(image, at);

    if (!Object.hasOwn(tint.swaps, was)) {
      missed.add(was);
      continue;
    }
    const packedColour = Number.parseInt(tint.swaps[was].slice(1), 16);

    image.rgba[at] = (packedColour >> 16) & 0xff;
    image.rgba[at + 1] = (packedColour >> 8) & 0xff;
    image.rgba[at + 2] = packedColour & 0xff;
  }
  if (missed.size > 0) {
    throw new Error(`${tint.to} says nothing about ${[...missed].sort().join(' ')}`);
  }
  if (tint.paint != null) {
    painted(tint.to, image, tint.paint);
  }
  return { name: tint.to.split('/')[1], image, trim: [source.trim[0], source.trim[1]] };
}

/**
 * The one picture drawn here rather than made out of another.
 *
 * An omamori: a paper charm on a cord, which is the shape the item is
 * named for and one no sheet carries. It is built out of three pieces
 * rather than one grid, because a grid wide enough to hold all of it
 * is counted by hand and miscounted by hand.
 */
const AMULET_COLOURS: Record<string, string> = {
  K: '#241c2d',
  // The cord, the only saturated thing on it
  r: '#c5294a',
  R: '#ee5a73',
  d: '#8b1839',
  // The card behind, which is what "clear" means here: it has no
  // colour of its own and takes whatever the light is doing
  w: '#fff6ff',
  p: '#ffcdee',
  c: '#b4eeff',
  v: '#d5c5ff',
  // The mark on it
  g: '#ffbd18',
  G: '#ffe694',
  b: '#c58310',
};

/**
 * The loop it hangs by: an arch of cord off the card's top edge, open
 * at the bottom because that is where it goes into the card
 */
const AMULET_CORD = [
  '......KKKKKK......',
  '.....KrRRRRrK.....',
  '....KrR....RrK....',
  '....KrR....RrK....',
  '....KrR....RrK....',
  '....KdR....RdK....',
  '....KdrK..KrdK....',
];

/**
 * The mark stamped on the card. Typed as its gold alone: the dark line
 * round it is drawn afterwards, which is the only way an outline stays
 * one pixel everywhere
 */
const AMULET_MARK = [
  '....gg....',
  '....gg....',
  '....gg....',
  'GGGGGGGGGG',
  'gggggggggg',
  '....gg....',
  '....gg....',
  '...gggg...',
  '..gg..gg..',
  '.bg....gb.',
];

/**
 * The card's own colour, corner to corner. Banded on the diagonal
 * rather than in stripes, which is the difference between a prism and
 * a flag
 */
const AMULET_BANDS = ['w', 'p', 'c', 'v'];

const CARD = 18;
const MARK_INK = new Set(['g', 'G', 'b']);

/**
 * The charm, as a grid of letters: the cord, then the card under it,
 * then the mark on the card, then a line drawn round the mark
 */
function amulet(): string[] {
  const rows = [...AMULET_CORD];
  const top = rows.length;

  const inner = CARD - 4;

  for (let y = 0; y < CARD; y += 1) {
    const inside = Array.from({ length: inner }, (_, x) => {
      const along = (x / (inner - 1) + y / (CARD - 1)) / 2;

      return AMULET_BANDS[Math.min(AMULET_BANDS.length - 1, Math.floor(along * 4))];
    });

    rows.push(y === 0 || y === CARD - 1 ? `..${'K'.repeat(inner)}..` : `.K${inside.join('')}K.`);
  }

  const grid = rows.map((row) => row.padEnd(CARD, '.').split(''));
  const markLeft = Math.floor((CARD - AMULET_MARK[0].length) / 2);
  const markTop = top + Math.floor((CARD - AMULET_MARK.length) / 2);

  AMULET_MARK.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== '.') {
        grid[markTop + y][markLeft + x] = row[x];
      }
    }
  });

  // The line round the mark, laid only over the card so the card's own
  // border keeps its shape
  const under = grid.map((row) => [...row.values()]);

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < CARD; x += 1) {
      if (MARK_INK.has(under[y][x]) || !'wpcv'.includes(under[y][x])) {
        continue;
      }
      const beside = [-1, 0, 1].some((dy) =>
        [-1, 0, 1].some((dx) => MARK_INK.has(under[y + dy]?.[x + dx] ?? '.')),
      );

      if (beside) {
        grid[y][x] = 'K';
      }
    }
  }
  return grid.map((row) => row.join(''));
}

/** The grid with the empty rows and columns round it taken off. */
function cropped(grid: string[][]): string[] {
  let top = grid.length;
  let bottom = -1;
  let left = grid[0].length;
  let right = -1;

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] !== '.') {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return grid.slice(top, bottom + 1).map((row) => row.slice(left, right + 1).join(''));
}

/** A picture out of a grid of letters, one letter to a pixel. */
function drawn(name: string, rows: string[], colours: Record<string, string>): Picture {
  const width = Math.max(...rows.map((row) => row.length));
  const image: Image = {
    width,
    height: rows.length,
    rgba: Buffer.alloc(width * rows.length * 4),
  };

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (!Object.hasOwn(colours, row[x])) {
        continue;
      }
      const colour = Number.parseInt(colours[row[x]].slice(1), 16);
      const at = (y * width + x) * 4;

      image.rgba[at] = (colour >> 16) & 0xff;
      image.rgba[at + 1] = (colour >> 8) & 0xff;
      image.rgba[at + 2] = colour & 0xff;
      image.rgba[at + 3] = 255;
    }
  });
  return {
    name,
    image,
    trim: [Math.floor((CELL - width) / 2), Math.floor((CELL - rows.length) / 2)],
  };
}

const CORD_COLOURS: Record<string, string> = {
  K: '#202020',
  // The plug: a lit top face over a warm charcoal body, with the
  // contacts gold so the two ends read as ends at 32 pixels
  M: '#c5bdb4',
  P: '#8b8378',
  p: '#5a524a',
  g: '#ffcd52',
  // The cable, lit along the side the rest of the sheet is lit from
  C: '#6a625a',
  c: '#4a423b',
  d: '#312b26',
};

type Point = [x: number, y: number];

/**
 * The line the cord runs along, as the few points it bends through.
 * A curve rather than a grid of letters, because a cord drawn as
 * letters comes out a staple: what makes it read is that it bends
 */
const CORD_PATH: Point[] = [
  [6, 5],
  [3, 12],
  [9, 18],
  [16, 15],
  [19, 6],
];

/** Half the cable's thickness, so three pixels across. */
const CORD_RADIUS = 1.6;

/** Where the light comes from, as the sheet lights everything else. */
const CORD_LIGHT: Point = [-0.707, -0.707];

/** How far off the centreline the cable stops reading as its mid tone. */
const CORD_EDGE = 0.4;

/** A plug, row by row: a lit top face, a body with a seam, contacts. */
const CORD_PLUG = ['MMMMM', 'pPPPp', 'pPPPp', 'pPPPp', 'ggggg'];

/** A point along a Catmull-Rom through the path's bends. */
function alongCord(t: number): Point {
  const span = CORD_PATH.length - 1;
  const at = Math.min(span - 1, Math.floor(t * span));
  const local = t * span - at;
  const before = CORD_PATH[Math.max(0, at - 1)];
  const one = CORD_PATH[at];
  const two = CORD_PATH[at + 1];
  const after = CORD_PATH[Math.min(span, at + 2)];

  const axis = (a: number, b: number, c: number, d: number): number =>
    0.5 *
    (2 * b +
      (c - a) * local +
      (2 * a - 5 * b + 4 * c - d) * local * local +
      (3 * b - a - 3 * c + d) * local * local * local);

  return [axis(before[0], one[0], two[0], after[0]), axis(before[1], one[1], two[1], after[1])];
}

/**
 * The cord, drawn rather than typed: the cable is stamped along the
 * curve and shaded by which side of it a pixel sits on, the plugs are
 * blocks at either end, and the outline is whatever ends up beside
 * something
 */
function cord(): string[] {
  const width = 24;
  const height = 24;
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
  const samples: Point[] = [];

  for (let step = 0; step <= 400; step += 1) {
    samples.push(alongCord(step / 400));
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let nearest: Point | null = null;
      let closest = Number.POSITIVE_INFINITY;

      for (const point of samples) {
        const off = (point[0] - x) ** 2 + (point[1] - y) ** 2;

        if (off < closest) {
          closest = off;
          nearest = point;
        }
      }
      if (nearest == null || Math.sqrt(closest) > CORD_RADIUS) {
        continue;
      }
      // Which side of the centreline the pixel is on, along the light
      const side = (x - nearest[0]) * CORD_LIGHT[0] + (y - nearest[1]) * CORD_LIGHT[1];

      if (side < -CORD_EDGE) {
        grid[y][x] = 'C';
      } else if (side > CORD_EDGE) {
        grid[y][x] = 'd';
      } else {
        grid[y][x] = 'c';
      }
    }
  }

  // A plug at either end, sat over the cable rather than beside it, so
  // the cord runs into it instead of stopping short
  for (const end of [CORD_PATH[0], CORD_PATH[CORD_PATH.length - 1]]) {
    const left = Math.round(end[0]) - 2;
    const top = Math.round(end[1]) - 3;

    for (let row = 0; row < CORD_PLUG.length; row += 1) {
      for (let column = 0; column < CORD_PLUG[row].length; column += 1) {
        grid[top + row][left + column] = CORD_PLUG[row][column];
      }
    }
  }

  // The line round all of it, one pixel everywhere
  const under = grid.map((row) => [...row.values()]);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (under[y][x] !== '.') {
        continue;
      }
      const beside = [-1, 0, 1].some((dy) =>
        [-1, 0, 1].some((dx) => (under[y + dy]?.[x + dx] ?? '.') !== '.'),
      );

      if (beside) {
        grid[y][x] = 'K';
      }
    }
  }
  return cropped(grid);
}

const DRAWN: { to: string; rows: string[]; colours: Record<string, string> }[] = [
  { to: 'held/clear-amulet', rows: amulet(), colours: AMULET_COLOURS },
  { to: 'evolutions/linking-cord', rows: cord(), colours: CORD_COLOURS },
];

const sheets = new Map<string, Sheet>();
const reading = new Set(
  [...TINTS.flatMap((one) => [one.from, one.to]), ...DRAWN.map((one) => one.to)].map(
    (spec) => spec.split('/')[0],
  ),
);

for (const name of reading) {
  sheets.set(name, readSheet(name));
}

const touched = new Set<string>();

function put(sheetName: string, picture: Picture): void {
  const sheet = sheets.get(sheetName);

  if (sheet == null) {
    throw new Error(`No sheet called ${sheetName}`);
  }
  const at = sheet.pictures.findIndex((one) => one.name === picture.name);

  if (at < 0) {
    sheet.pictures.push(picture);
  } else {
    // A picture the same size keeps the place it already had, so
    // running this again after changing a swap list rewrites those
    // pixels and moves nothing
    const was = sheet.pictures[at];
    const fits =
      was.image.width === picture.image.width && was.image.height === picture.image.height;

    sheet.pictures[at] = fits ? { ...picture, at: was.at } : picture;
  }
  touched.add(sheetName);
  console.log(`  ${sheetName}/${picture.name}  ${picture.image.width}x${picture.image.height}`);
}

for (const tint of TINTS) {
  put(tint.to.split('/')[0], tinted(tint, sheets));
}
for (const one of DRAWN) {
  put(one.to.split('/')[0], drawn(one.to.split('/')[1], one.rows, one.colours));
}
for (const name of touched) {
  const sheet = sheets.get(name);

  if (sheet != null) {
    writeSheet(name, sheet);
  }
}
