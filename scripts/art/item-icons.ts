import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import decode, { type Image, encodeSmallest } from '../../src/server/sprites/png.ts';
import { packSmallest } from '../../src/server/sprites/packing.ts';

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

/**
 * A `sheet/name` spec cut at its last slash, since a sheet may sit in
 * a folder of its own (`zenith/kanto/arcanine` is on `zenith/kanto`)
 */
function sheetOf(spec: string): string {
  return spec.slice(0, spec.lastIndexOf('/'));
}

function nameOf(spec: string): string {
  return spec.slice(spec.lastIndexOf('/') + 1);
}

function readSheet(name: string): Sheet {
  // A sheet nothing has been put on yet starts empty, a cell wide so
  // its first picture has somewhere to go
  if (!existsSync(join(ROOT, name, 'data.json'))) {
    return { atlas: { width: CELL, height: 0, rgba: Buffer.alloc(0) }, pictures: [] };
  }
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
  mkdirSync(dirname(path), { recursive: true });
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
 * How full a sheet has to be to be left as it is. A picture that
 * changed size leaves a hole its replacement does not fit in, so a
 * sheet can end up a fifth empty without ever growing
 */
const WORTH_TIDYING = 0.9;

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
  const lit = sheet.pictures.reduce((sum, one) => sum + one.image.width * one.image.height, 0);
  const grew = kept.width !== sheet.atlas.width || kept.height !== sheet.atlas.height;
  const loose = lit / areaOf(kept) < WORTH_TIDYING;
  const afresh = grew || loose ? packedAfresh(sheet) : null;
  // A sheet that is already wasting a fifth of itself has nothing to
  // keep, so any smaller layout wins rather than a much smaller one
  const layout =
    afresh != null && areaOf(afresh) < areaOf(kept) * (loose ? 1 : WORTH_REPACKING) ? afresh : kept;
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
  /**
   * Every colour the swaps do not name, worked out from the colour
   * itself: for a picture shaded in too many tones to list, such as a
   * whole apple turned another hue
   */
  recolour?: (colour: string) => string;
  /** A colour worked out per pixel after the swap, for a gradient no swap can draw */
  shade?: (colour: string, x: number, y: number, width: number, height: number) => string;
}

const TINTS: Tint[] = [
  {
    from: 'key/powder-jar',
    to: 'key/balm',
    why: 'the Balm a Noble is calmed with is its own item, and no sheet draws it',
    // The jar under a linen cloth tied at the neck, full of a pale green
    // salve with a cream leaf pressed on the front
    swaps: {
      '#303030': '#28302a',
      '#70f070': '#f4efe2',
      '#48b850': '#cfc5aa',
      '#604830': '#5a4a36',
      '#806030': '#8c7350',
      '#888030': '#4f7a58',
      '#d0a830': '#8fc89a',
      '#f8e848': '#d6f4cf',
      '#e0c838': '#b2e0b2',
      '#f8b030': '#f2e4b0',
    },
  },
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
  {
    from: 'key/fashion-case',
    to: 'key/music-box',
    why: 'no rip drew a music box, and the fashion case is already a lidded box with fittings',
    // The case is a lid, a body and a clasp. Wood down the body and
    // brass on the fittings make it an old music box without a pixel
    // moving
    swaps: {
      '#202020': '#291f18',
      '#ffffff': '#ffeec5',
      // The body, lightest to darkest, taken round to walnut. It is
      // kept dark on purpose: the scrollwork over it is brass, and
      // wood this side of the metal is what lets the metal read
      '#ffc5ff': '#c5915a',
      '#ff9cee': '#ac7b4a',
      '#ff83ee': '#9c6a3a',
      '#ff62ee': '#8b5a31',
      '#ff31e6': '#7b4a29',
      '#de10a4': '#6a3f21',
      '#d500bd': '#5a3519',
      '#ac1094': '#412410',
      // The trim and the clasp, which were yellow and blue, both to
      // brass so the fittings read as one metal
      '#ffff52': '#ffd54a',
      '#5ab4ff': '#ffe6a4',
      '#008bee': '#c59431',
    },
  },
  {
    from: 'other/heart-scale',
    to: 'key/heart-diamond',
    why: 'the heart scale is a thing a pokemon sheds, and this is the stone a Diancie presses out of its own hands',
    // The scale is pale everything: white, cold blue, a little pink
    // and a little green. Taken round to rose, with the white kept,
    // the same faceted shape reads as a cut diamond
    swaps: {
      '#202020': '#2a1a26',
      '#eeeeee': '#fff6fb',
      '#cdeeee': '#ffd5e6',
      '#eecdcd': '#ff9cc5',
      '#cdcdee': '#e6a4d5',
      '#c5e6c5': '#f6b4de',
    },
  },
  {
    from: 'valuables/relic-band',
    to: 'key/sealed-ring',
    why: 'the relic band is sold for gold, and this is one of the rings a Hoopa was shut into',
    // The band is verdigris over grey. Gold down the metal and violet
    // in the deepest shadow make it a ring with something bound in it
    swaps: {
      '#202020': '#241a2a',
      '#416a6a': '#a47318',
      '#5a7b7b': '#c58b20',
      '#949c9c': '#f6c552',
      '#acacac': '#ffde8b',
      '#c5c5bd': '#fff0bd',
      '#314a52': '#6a4a94',
    },
  },
  {
    from: 'held/metal-coat',
    to: 'key/steam-valve',
    why: 'the metal coat is held to evolve, and this is the fitting cut out of a Volcanion',
    // The coat is a steel plate with a lit rim. Copper through the
    // body and brass along the rim make it a valve off a boiler
    swaps: {
      '#202020': '#2a1a18',
      '#526a6a': '#8b3a18',
      '#6a8383': '#b45a20',
      '#b4c5c5': '#e69c3a',
      '#deeeee': '#f6c552',
      '#ffffff': '#fff0c5',
    },
  },
  {
    from: 'balls/cherish',
    to: 'key/ancient-poke-ball',
    why: 'the cherish ball is thrown, and this is the one a Magearna was shut into five hundred years ago',
    // Red down to brass and the lower half to rose, so the same ball
    // reads as old metal rather than a gift
    swaps: {
      '#202020': '#2a1a18',
      '#ff4131': '#c59431',
      '#de4131': '#b48320',
      '#cd3920': '#a47318',
      '#a43929': '#7b5210',
      '#ff736a': '#e6b452',
      '#ff9c9c': '#ffde8b',
      '#ffffff': '#fff6d5',
      '#4a5252': '#8b4a5a',
    },
  },
  {
    from: 'key/old-charm',
    to: 'key/heros-charm',
    why: 'the old charm is a keepsake of Sinnoh, and this is the one the hero Marshadow shadows carried',
    // Yellow to a weathered green and the red cord to grey
    swaps: {
      '#202020': '#1a2420',
      '#d5d562': '#8bb48b',
      '#ffff9c': '#c5e6c5',
      '#bdbd52': '#6a9c73',
      '#9c9c31': '#4a735a',
      '#ffffde': '#eef6ee',
      '#ff9494': '#b4bdc5',
      '#de5a5a': '#8b949c',
      '#c53939': '#6a737b',
      '#8b3939': '#4a525a',
    },
  },
  {
    from: 'key/oval-charm',
    to: 'key/windmill-charm',
    why: 'the oval charm is about eggs, and this is the one sold at the festival of the city of windmills',
    // Pink and violet to sky blue and white, the colours of the wind
    swaps: {
      '#202020': '#18222a',
      '#ffc5e6': '#d5eeff',
      '#8352de': '#3a83c5',
      '#ac6aff': '#62acee',
      '#83d5c5': '#9ce6d5',
      '#ffffde': '#ffffff',
      '#de8ba4': '#94c5e6',
      '#bd5a62': '#5a8bb4',
    },
  },
  {
    from: 'key/medal-box',
    to: 'key/mystery-box',
    why: 'the medal box holds medals, and this is the box a Meltan comes out of',
    // Blue to steel grey, with the gold clasp kept, for Meltan's own colours
    swaps: {
      '#202020': '#202020',
      '#3183d5': '#8b8b94',
      '#2973c5': '#6a6a73',
      '#399cee': '#a4a4ac',
      '#62b4f6': '#c5c5cd',
      '#94b4e6': '#dedee6',
      '#7bd5cd': '#ffde8b',
      '#414141': '#414141',
      '#525252': '#525252',
      '#7b7b7b': '#7b7b7b',
      '#e69c20': '#e69c20',
      '#cd7b10': '#cd7b10',
      '#8b7b41': '#8b7b41',
      '#ffc529': '#ffc529',
    },
  },
  scroll(
    'other/scroll-of-darkness',
    'the scroll a Kubfu trains on in the Tower of Darkness',
    // Charcoal with a pale mark, so the body still reads off the outline
    { light: '#5a5a66', body: '#3a3a44', mark: '#c8c8d4', outline: '#141418' },
  ),
  scroll('other/scroll-of-waters', 'the scroll a Kubfu trains on in the Tower of Waters', {
    light: '#62b4f6',
    body: '#2a62b4',
    mark: '#e6f6ff',
    outline: '#18223a',
  }),
  {
    from: 'evolutions/ice-stone',
    to: 'evolutions/black-augurite',
    why: 'the stone a Scyther evolves on is its own item, and no sheet draws it',
    // The facets kept and taken to black, with the brightest glint left
    // pale so it still reads glossy
    swaps: {
      '#202020': '#050507',
      '#f6ffff': '#e8e8f4',
      '#eeffff': '#6e6e82',
      '#def6ff': '#5a5a6c',
      '#d5eef6': '#4e4e5e',
      '#bdeef6': '#42424f',
      '#94d5de': '#33333e',
      '#62bdcd': '#26262f',
      '#399cb4': '#1b1b22',
      '#186a94': '#111116',
    },
  },
  {
    from: 'key/parcel',
    to: 'evolutions/peat-block',
    why: 'the block an Ursaring evolves on is its own item, and no sheet draws it',
    // The parcel's box in dark earth: the string becomes the seams of
    // the compacted peat and the label goes into the front face
    swaps: {
      '#202020': '#100b07',
      '#f6de83': '#5e4230',
      '#c5c552': '#4e3624',
      '#a4a431': '#36261a',
      '#cdb45a': '#402c1e',
      '#737318': '#2a1c12',
      '#947b20': '#2e2016',
      '#735a10': '#22170f',
      '#cd5210': '#402c1e',
    },
  },
];

/**
 * A training scroll is the rolled Gen 3 town map in a colour of its
 * own: the gold bands and silver caps are kept, and the body and the
 * mark on it are what say which tower it is from
 */
function scroll(
  to: string,
  why: string,
  colours: { light: string; body: string; mark: string; outline: string },
): Tint {
  return {
    from: 'key/town-map-gen3',
    to,
    why: `${why}, and no sheet draws one`,
    swaps: {
      '#303030': colours.outline,
      '#e88828': colours.light,
      '#906028': colours.body,
      '#585048': colours.mark,
      '#e8f0f8': '#e8f0f8',
      '#98a0b8': '#98a0b8',
      '#c8d8e8': '#c8d8e8',
      '#908098': '#908098',
      '#f0e028': '#f0e028',
      '#c0b028': '#c0b028',
      '#807828': '#807828',
    },
  };
}

/** The colour every Max item is marked in */
const MAX_VIOLET = { dark: '#6a3194', mid: '#a462de', light: '#e6b4ff' };

/** A Max vitamin is its vitamin in a violet bottle, the cap still saying which stat */
function maxVitamin(name: string, cap: string[], label: string[]): Tint {
  const swaps: Record<string, string> = {
    '#202020': '#202020',
    '#945a39': MAX_VIOLET.dark,
    '#bd9429': MAX_VIOLET.mid,
    '#ffc573': MAX_VIOLET.light,
    '#acc5ac': '#acc5ac',
    '#c5dec5': '#c5dec5',
    '#e6f6e6': '#e6f6e6',
    '#f6fff6': '#f6fff6',
  };

  for (const colour of [...cap, ...label]) {
    swaps[colour] = colour;
  }
  return {
    from: `medicine/${name}`,
    to: `medicine/${name}-max`,
    why: 'the Max vitamins belong to this engine alone, and no rip drew them',
    swaps,
  };
}

/** A Max wing is its wing with a violet tip */
function maxWing(name: string, spot: string[]): Tint {
  const swaps: Record<string, string> = {
    '#202020': '#202020',
    '#cdeeff': '#cdeeff',
    '#eeffff': '#eeffff',
    '#9cd5e6': '#9cd5e6',
    '#8ba4ac': '#8ba4ac',
  };

  for (const colour of spot) {
    swaps[colour] = colour;
  }
  return {
    from: `medicine/${name}`,
    to: `medicine/${name}-max`,
    why: 'the Max wings belong to this engine alone, and no rip drew them',
    swaps,
    paint: {
      rows: [
        '................',
        '..........MLLM..',
        '........MLMLLMM.',
        '.......DMLMLMMM.',
        '...........DMMM.',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
      ],
      colours: { D: MAX_VIOLET.dark, M: MAX_VIOLET.mid, L: MAX_VIOLET.light },
    },
  };
}

function hexToRgb(hex: string): number[] {
  const packed = Number.parseInt(hex.slice(1), 16);

  return [(packed >> 16) & 0xff, (packed >> 8) & 0xff, packed & 0xff];
}

/** A hue at a lightness, as `#rrggbb` */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const part = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const sector = Math.floor(hue / 60) % 6;
  const [red, green, blue] = [
    [chroma, part, 0],
    [part, chroma, 0],
    [0, chroma, part],
    [0, part, chroma],
    [part, 0, chroma],
    [chroma, 0, part],
  ][sector];

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + base) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * Rare Candy Max: the candy's own tones run red to violet from one
 * wrapped end to the other. Six bands rather than a smooth ramp, so it
 * stays drawn in flat tones like the rest of the sheet
 */
function rainbow(colour: string, x: number, y: number, width: number, height: number): string {
  if (colour === '#202020') {
    return colour;
  }
  const [red, green, blue] = hexToRgb(colour);
  const lightness = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 510;
  // The candy sits diagonally, so its ends fall short of the cell's corners
  const along = ((x + (height - 1 - y)) / (width + height - 2) - 0.2) / 0.65;
  const band = Math.min(5, Math.max(0, Math.floor(along * 6)));

  return hslToHex(band * 55, 0.85, Math.min(0.88, Math.max(0.3, lightness)));
}

/** The Skill Book: the rule book with its cover turned from rose to a deep blue */
const SKILL_BOOK: Tint = {
  from: 'key/rule-book',
  to: 'key/skill-book',
  why: 'the rule book is a key item of its own, and the Skill Book needs its own cover',
  swaps: {
    '#202020': '#202020',
    '#ffffff': '#ffffff',
    '#e6dec5': '#e6dec5',
    '#a49c83': '#a49c83',
    '#acacac': '#acacac',
    '#737373': '#737373',
    '#cda4bd': '#a4bdee',
    '#bd83a4': '#8ba4e6',
    '#ac738b': '#6a83cd',
    '#73415a': '#31417b',
  },
};

TINTS.push(SKILL_BOOK);

const MAX_TINTS: Tint[] = [
  maxVitamin('hp-up', ['#5abd5a', '#a4f6a4', '#418b41'], ['#94cdff', '#6aa4ee']),
  maxVitamin('protein', ['#c56262', '#f6a4a4', '#8b4141'], ['#f6a400']),
  maxVitamin('iron', ['#bdbd5a', '#f6f6a4', '#8b8b41'], ['#31a400']),
  maxVitamin('calcium', ['#d5834a', '#ffcda4', '#b46a31'], ['#f64100']),
  maxVitamin('zinc', ['#bd8331', '#eecd6a', '#7b6a00'], ['#83de00']),
  maxVitamin('carbos', ['#5abdbd', '#a4f6f6', '#418b8b'], ['#29a4f6']),
  maxWing('health-wing', ['#b4a483', '#ffe683', '#ffcd18']),
  maxWing('muscle-wing', ['#ac8b94', '#ff7b83', '#f63941']),
  maxWing('resist-wing', ['#3162b4', '#7ba4f6', '#5283e6']),
  maxWing('genius-wing', ['#94bdc5', '#8bf6ff', '#5ae6ee']),
  maxWing('clever-wing', ['#9c629c', '#e694ee', '#d562d5']),
  maxWing('swift-wing', ['#529c41', '#a4ee83', '#52c541']),
  {
    from: 'medicine/rare-candy',
    to: 'medicine/rare-candy-max',
    why: 'Rare Candy Max belongs to this engine alone, and no rip drew it',
    swaps: {
      '#202020': '#202020',
      '#9cbdff': '#9cbdff',
      '#6273d5': '#6273d5',
      '#5262c5': '#5262c5',
      '#d5eeff': '#d5eeff',
      '#7b94ee': '#7b94ee',
      '#29399c': '#29399c',
    },
    shade: rainbow,
  },
];

TINTS.push(...MAX_TINTS);

/** A hue and saturation, from `#rrggbb` */
function hueOf(hex: string): [hue: number, saturation: number] {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255);
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  const chroma = high - low;
  const lightness = (high + low) / 2;

  if (chroma === 0) {
    return [0, 0];
  }
  const saturation = chroma / (1 - Math.abs(2 * lightness - 1));
  let sector = (red - green) / chroma + 4;

  if (high === red) {
    sector = ((green - blue) / chroma + 6) % 6;
  } else if (high === green) {
    sector = (blue - red) / chroma + 2;
  }

  return [sector * 60, saturation];
}

/** The comet shard's tones, light to dark, and which of the two types each is painted in */
const SHARD_TONES: [colour: string, lightness: number, second: boolean][] = [
  ['#c5dee6', 0.8, false],
  ['#83ace6', 0.68, false],
  ['#628bde', 0.56, false],
  ['#4a52b4', 0.46, true],
  ['#41397b', 0.32, true],
];

/**
 * A Zenith Shard is the comet shard in its Zenith's colours: the body
 * in the first type, the point it tapers to in the second, so a dual
 * type reads at a glance. The colours are the type colours the game
 * already draws its type chips in (`TYPE_COLORS`), copied rather than
 * imported because the ids behind that table are a const enum
 */
function zenithShard(region: string, holder: string, first: string, second = first): Tint {
  const swaps: Record<string, string> = { '#202020': '#202020', '#eefff6': '#fffaf2' };

  for (const [colour, lightness, isSecond] of SHARD_TONES) {
    const [hue, saturation] = hueOf(isSecond ? second : first);

    swaps[colour] = hslToHex(hue, Math.min(0.9, saturation), lightness);
  }
  return {
    from: 'valuables/comet-shard',
    to: `zenith/${region}/${holder}`,
    why: 'the Zenith Shards belong to this engine alone, and no rip drew them',
    swaps,
  };
}

/** Every Zenith Shard, with its Zenith's types' colours */
TINTS.push(zenithShard('kanto', 'butterfree', '#91a119', '#ef4179'));
TINTS.push(zenithShard('kanto', 'raticate', '#9fa19f'));
TINTS.push(zenithShard('kanto', 'fearow', '#81b9ef', '#915121'));
TINTS.push(zenithShard('kanto', 'arbok', '#9141cb', '#624d4e'));
TINTS.push(zenithShard('kanto', 'sandslash', '#915121', '#60a1b8'));
TINTS.push(zenithShard('kanto', 'nidoqueen', '#9141cb', '#915121'));
TINTS.push(zenithShard('kanto', 'nidoking', '#9141cb', '#915121'));
TINTS.push(zenithShard('kanto', 'ninetales', '#e62829', '#704170'));
TINTS.push(zenithShard('kanto', 'wigglytuff', '#9fa19f', '#ef70ef'));
TINTS.push(zenithShard('kanto', 'vileplume', '#3fa129', '#9141cb'));
TINTS.push(zenithShard('kanto', 'parasect', '#91a119', '#704170'));
TINTS.push(zenithShard('kanto', 'venomoth', '#91a119', '#9141cb'));
TINTS.push(zenithShard('kanto', 'dugtrio', '#915121'));
TINTS.push(zenithShard('kanto', 'persian', '#9fa19f'));
TINTS.push(zenithShard('kanto', 'golduck', '#2980ef', '#ef4179'));
TINTS.push(zenithShard('kanto', 'arcanine', '#e62829', '#5060e1'));
TINTS.push(zenithShard('kanto', 'poliwrath', '#2980ef', '#ff8000'));
TINTS.push(zenithShard('kanto', 'machamp', '#ff8000'));
TINTS.push(zenithShard('kanto', 'tentacruel', '#2980ef', '#9141cb'));
TINTS.push(zenithShard('kanto', 'golem', '#afa981', '#915121'));
TINTS.push(zenithShard('kanto', 'rapidash', '#e62829'));
TINTS.push(zenithShard('kanto', 'farfetchd', '#9fa19f', '#81b9ef'));
TINTS.push(zenithShard('kanto', 'dodrio', '#9fa19f', '#81b9ef'));
TINTS.push(zenithShard('kanto', 'dewgong', '#2980ef', '#3dcef3'));
TINTS.push(zenithShard('kanto', 'muk', '#9141cb'));
TINTS.push(zenithShard('kanto', 'cloyster', '#2980ef', '#3dcef3'));
TINTS.push(zenithShard('kanto', 'hypno', '#ef4179'));
TINTS.push(zenithShard('kanto', 'kingler', '#2980ef'));
TINTS.push(zenithShard('kanto', 'electrode', '#fac000'));
TINTS.push(zenithShard('kanto', 'exeggutor', '#3fa129', '#ef4179'));
TINTS.push(zenithShard('kanto', 'marowak', '#915121', '#ff8000'));
TINTS.push(zenithShard('kanto', 'hitmonlee', '#ff8000'));
TINTS.push(zenithShard('kanto', 'hitmonchan', '#ff8000'));
TINTS.push(zenithShard('kanto', 'weezing', '#9141cb'));
TINTS.push(zenithShard('kanto', 'seaking', '#2980ef'));
TINTS.push(zenithShard('kanto', 'mr-mime', '#ef4179', '#ef70ef'));
TINTS.push(zenithShard('kanto', 'jynx', '#3dcef3', '#ef4179'));
TINTS.push(zenithShard('kanto', 'tauros', '#9fa19f'));
TINTS.push(zenithShard('kanto', 'lapras', '#2980ef', '#3dcef3'));
TINTS.push(zenithShard('kanto', 'vaporeon', '#2980ef'));
TINTS.push(zenithShard('kanto', 'jolteon', '#fac000'));
TINTS.push(zenithShard('kanto', 'flareon', '#e62829'));
TINTS.push(zenithShard('kanto', 'omastar', '#afa981', '#2980ef'));
TINTS.push(zenithShard('kanto', 'kabutops', '#afa981', '#2980ef'));
TINTS.push(zenithShard('kanto', 'snorlax', '#9fa19f'));
TINTS.push(zenithShard('kanto', 'articuno', '#3dcef3', '#81b9ef'));
TINTS.push(zenithShard('kanto', 'zapdos', '#fac000', '#81b9ef'));
TINTS.push(zenithShard('kanto', 'moltres', '#e62829', '#81b9ef'));
TINTS.push(zenithShard('kanto', 'mew', '#ef4179'));
TINTS.push(zenithShard('johto', 'typhlosion', '#e62829'));
TINTS.push(zenithShard('johto', 'furret', '#9fa19f'));
TINTS.push(zenithShard('johto', 'noctowl', '#ef4179', '#81b9ef'));
TINTS.push(zenithShard('johto', 'ledian', '#91a119', '#ff8000'));
TINTS.push(zenithShard('johto', 'ariados', '#91a119', '#624d4e'));
TINTS.push(zenithShard('johto', 'crobat', '#9141cb', '#624d4e'));
TINTS.push(zenithShard('johto', 'lanturn', '#2980ef', '#fac000'));
TINTS.push(zenithShard('johto', 'xatu', '#ef4179', '#81b9ef'));
TINTS.push(zenithShard('johto', 'bellossom', '#3fa129', '#ef70ef'));
TINTS.push(zenithShard('johto', 'azumarill', '#2980ef', '#ef70ef'));
TINTS.push(zenithShard('johto', 'sudowoodo', '#afa981', '#3fa129'));
TINTS.push(zenithShard('johto', 'politoed', '#2980ef'));
TINTS.push(zenithShard('johto', 'jumpluff', '#3fa129', '#81b9ef'));
TINTS.push(zenithShard('johto', 'sunflora', '#3fa129', '#e62829'));
TINTS.push(zenithShard('johto', 'quagsire', '#2980ef', '#915121'));
TINTS.push(zenithShard('johto', 'espeon', '#ef4179'));
TINTS.push(zenithShard('johto', 'umbreon', '#624d4e'));
TINTS.push(zenithShard('johto', 'slowking', '#2980ef', '#ef4179'));
TINTS.push(zenithShard('johto', 'wobbuffet', '#ef4179'));
TINTS.push(zenithShard('johto', 'forretress', '#91a119', '#60a1b8'));
TINTS.push(zenithShard('johto', 'granbull', '#ef70ef'));
TINTS.push(zenithShard('johto', 'qwilfish', '#2980ef', '#9141cb'));
TINTS.push(zenithShard('johto', 'shuckle', '#91a119', '#afa981'));
TINTS.push(zenithShard('johto', 'magcargo', '#e62829', '#afa981'));
TINTS.push(zenithShard('johto', 'corsola', '#2980ef', '#afa981'));
TINTS.push(zenithShard('johto', 'octillery', '#2980ef'));
TINTS.push(zenithShard('johto', 'delibird', '#3dcef3', '#81b9ef'));
TINTS.push(zenithShard('johto', 'mantine', '#2980ef', '#81b9ef'));
TINTS.push(zenithShard('johto', 'kingdra', '#2980ef', '#5060e1'));
TINTS.push(zenithShard('johto', 'donphan', '#915121'));
TINTS.push(zenithShard('johto', 'smeargle', '#9fa19f'));
TINTS.push(zenithShard('johto', 'hitmontop', '#ff8000'));
TINTS.push(zenithShard('johto', 'miltank', '#9fa19f'));
TINTS.push(zenithShard('johto', 'blissey', '#9fa19f', '#ef70ef'));
TINTS.push(zenithShard('johto', 'raikou', '#fac000'));
TINTS.push(zenithShard('johto', 'entei', '#e62829'));
TINTS.push(zenithShard('johto', 'suicune', '#2980ef'));
TINTS.push(zenithShard('johto', 'lugia', '#ef4179', '#81b9ef'));
TINTS.push(zenithShard('johto', 'hooh', '#e62829', '#81b9ef'));
TINTS.push(zenithShard('johto', 'celebi', '#ef4179', '#3fa129'));
TINTS.push(zenithShard('hoenn', 'mightyena', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'linoone', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'beautifly', '#91a119', '#81b9ef'));
TINTS.push(zenithShard('hoenn', 'dustox', '#91a119', '#9141cb'));
TINTS.push(zenithShard('hoenn', 'ludicolo', '#2980ef', '#3fa129'));
TINTS.push(zenithShard('hoenn', 'shiftry', '#3fa129', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'swellow', '#9fa19f', '#81b9ef'));
TINTS.push(zenithShard('hoenn', 'pelipper', '#2980ef', '#81b9ef'));
TINTS.push(zenithShard('hoenn', 'masquerain', '#91a119', '#2980ef'));
TINTS.push(zenithShard('hoenn', 'breloom', '#3fa129', '#ff8000'));
TINTS.push(zenithShard('hoenn', 'slaking', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'ninjask', '#91a119', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'shedinja', '#91a119', '#704170'));
TINTS.push(zenithShard('hoenn', 'exploud', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'hariyama', '#ff8000'));
TINTS.push(zenithShard('hoenn', 'delcatty', '#9fa19f', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'plusle', '#fac000'));
TINTS.push(zenithShard('hoenn', 'minun', '#fac000'));
TINTS.push(zenithShard('hoenn', 'volbeat', '#91a119', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'illumise', '#91a119', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'swalot', '#9141cb'));
TINTS.push(zenithShard('hoenn', 'wailord', '#2980ef'));
TINTS.push(zenithShard('hoenn', 'torkoal', '#e62829'));
TINTS.push(zenithShard('hoenn', 'grumpig', '#ef4179'));
TINTS.push(zenithShard('hoenn', 'spinda', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'flygon', '#915121', '#5060e1'));
TINTS.push(zenithShard('hoenn', 'cacturne', '#3fa129', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'zangoose', '#9fa19f', '#ff8000'));
TINTS.push(zenithShard('hoenn', 'seviper', '#9141cb', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'lunatone', '#afa981', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'solrock', '#afa981', '#e62829'));
TINTS.push(zenithShard('hoenn', 'whiscash', '#2980ef', '#915121'));
TINTS.push(zenithShard('hoenn', 'crawdaunt', '#2980ef', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'claydol', '#915121', '#ef4179'));
TINTS.push(zenithShard('hoenn', 'cradily', '#afa981', '#3fa129'));
TINTS.push(zenithShard('hoenn', 'armaldo', '#afa981', '#91a119'));
TINTS.push(zenithShard('hoenn', 'milotic', '#2980ef', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'castform', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'kecleon', '#9fa19f'));
TINTS.push(zenithShard('hoenn', 'tropius', '#3fa129', '#5060e1'));
TINTS.push(zenithShard('hoenn', 'walrein', '#3dcef3', '#2980ef'));
TINTS.push(zenithShard('hoenn', 'huntail', '#2980ef', '#624d4e'));
TINTS.push(zenithShard('hoenn', 'gorebyss', '#2980ef', '#ef4179'));
TINTS.push(zenithShard('hoenn', 'relicanth', '#2980ef', '#afa981'));
TINTS.push(zenithShard('hoenn', 'luvdisc', '#2980ef', '#ef70ef'));
TINTS.push(zenithShard('hoenn', 'regirock', '#afa981'));
TINTS.push(zenithShard('hoenn', 'regice', '#3dcef3'));
TINTS.push(zenithShard('hoenn', 'registeel', '#60a1b8'));
TINTS.push(zenithShard('hoenn', 'jirachi', '#60a1b8', '#ef4179'));
TINTS.push(zenithShard('hoenn', 'deoxys', '#ef4179'));
TINTS.push(zenithShard('sinnoh', 'torterra', '#3fa129', '#915121'));
TINTS.push(zenithShard('sinnoh', 'infernape', '#e62829', '#ff8000'));
TINTS.push(zenithShard('sinnoh', 'empoleon', '#2980ef', '#60a1b8'));
TINTS.push(zenithShard('sinnoh', 'bibarel', '#9fa19f', '#2980ef'));
TINTS.push(zenithShard('sinnoh', 'kricketune', '#91a119'));
TINTS.push(zenithShard('sinnoh', 'luxray', '#fac000', '#624d4e'));
TINTS.push(zenithShard('sinnoh', 'roserade', '#3fa129', '#9141cb'));
TINTS.push(zenithShard('sinnoh', 'rampardos', '#afa981'));
TINTS.push(zenithShard('sinnoh', 'bastiodon', '#afa981', '#60a1b8'));
TINTS.push(zenithShard('sinnoh', 'wormadam', '#91a119', '#3fa129'));
TINTS.push(zenithShard('sinnoh', 'mothim', '#91a119', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'vespiquen', '#91a119', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'pachirisu', '#fac000'));
TINTS.push(zenithShard('sinnoh', 'floatzel', '#2980ef'));
TINTS.push(zenithShard('sinnoh', 'cherrim', '#3fa129'));
TINTS.push(zenithShard('sinnoh', 'gastrodon', '#2980ef', '#915121'));
TINTS.push(zenithShard('sinnoh', 'ambipom', '#9fa19f'));
TINTS.push(zenithShard('sinnoh', 'drifblim', '#704170', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'mismagius', '#704170', '#ef70ef'));
TINTS.push(zenithShard('sinnoh', 'honchkrow', '#624d4e', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'purugly', '#9fa19f'));
TINTS.push(zenithShard('sinnoh', 'skuntank', '#9141cb', '#624d4e'));
TINTS.push(zenithShard('sinnoh', 'bronzong', '#60a1b8', '#ef4179'));
TINTS.push(zenithShard('sinnoh', 'chatot', '#9fa19f', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'spiritomb', '#704170', '#624d4e'));
TINTS.push(zenithShard('sinnoh', 'hippowdon', '#915121'));
TINTS.push(zenithShard('sinnoh', 'drapion', '#9141cb', '#624d4e'));
TINTS.push(zenithShard('sinnoh', 'toxicroak', '#9141cb', '#ff8000'));
TINTS.push(zenithShard('sinnoh', 'carnivine', '#3fa129'));
TINTS.push(zenithShard('sinnoh', 'lumineon', '#2980ef', '#ef70ef'));
TINTS.push(zenithShard('sinnoh', 'weavile', '#624d4e', '#3dcef3'));
TINTS.push(zenithShard('sinnoh', 'magnezone', '#fac000', '#60a1b8'));
TINTS.push(zenithShard('sinnoh', 'lickilicky', '#9fa19f'));
TINTS.push(zenithShard('sinnoh', 'rhyperior', '#915121', '#afa981'));
TINTS.push(zenithShard('sinnoh', 'tangrowth', '#3fa129'));
TINTS.push(zenithShard('sinnoh', 'electivire', '#fac000', '#ff8000'));
TINTS.push(zenithShard('sinnoh', 'magmortar', '#e62829'));
TINTS.push(zenithShard('sinnoh', 'togekiss', '#ef70ef', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'yanmega', '#91a119', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'leafeon', '#3fa129'));
TINTS.push(zenithShard('sinnoh', 'glaceon', '#3dcef3'));
TINTS.push(zenithShard('sinnoh', 'gliscor', '#915121', '#81b9ef'));
TINTS.push(zenithShard('sinnoh', 'mamoswine', '#3dcef3', '#915121'));
TINTS.push(zenithShard('sinnoh', 'porygonz', '#9fa19f'));
TINTS.push(zenithShard('sinnoh', 'probopass', '#afa981', '#60a1b8'));
TINTS.push(zenithShard('sinnoh', 'dusknoir', '#704170'));
TINTS.push(zenithShard('sinnoh', 'rotom', '#fac000', '#704170'));
TINTS.push(zenithShard('sinnoh', 'uxie', '#ef4179'));
TINTS.push(zenithShard('sinnoh', 'mesprit', '#ef4179'));
TINTS.push(zenithShard('sinnoh', 'azelf', '#ef4179'));
TINTS.push(zenithShard('sinnoh', 'regigigas', '#9fa19f'));
TINTS.push(zenithShard('sinnoh', 'cresselia', '#ef4179', '#ef70ef'));
TINTS.push(zenithShard('sinnoh', 'phione', '#2980ef'));
TINTS.push(zenithShard('sinnoh', 'manaphy', '#2980ef'));
TINTS.push(zenithShard('unova', 'victini', '#ef4179', '#e62829'));
TINTS.push(zenithShard('unova', 'serperior', '#3fa129', '#5060e1'));
TINTS.push(zenithShard('unova', 'samurott', '#2980ef', '#ff8000'));
TINTS.push(zenithShard('unova', 'watchog', '#9fa19f'));
TINTS.push(zenithShard('unova', 'stoutland', '#9fa19f'));
TINTS.push(zenithShard('unova', 'liepard', '#624d4e'));
TINTS.push(zenithShard('unova', 'simisage', '#3fa129'));
TINTS.push(zenithShard('unova', 'simisear', '#e62829'));
TINTS.push(zenithShard('unova', 'simipour', '#2980ef'));
TINTS.push(zenithShard('unova', 'musharna', '#ef4179', '#ef70ef'));
TINTS.push(zenithShard('unova', 'unfezant', '#9fa19f', '#81b9ef'));
TINTS.push(zenithShard('unova', 'zebstrika', '#fac000'));
TINTS.push(zenithShard('unova', 'gigalith', '#afa981'));
TINTS.push(zenithShard('unova', 'swoobat', '#ef4179', '#81b9ef'));
TINTS.push(zenithShard('unova', 'conkeldurr', '#ff8000'));
TINTS.push(zenithShard('unova', 'seismitoad', '#2980ef', '#915121'));
TINTS.push(zenithShard('unova', 'throh', '#ff8000'));
TINTS.push(zenithShard('unova', 'sawk', '#ff8000'));
TINTS.push(zenithShard('unova', 'leavanny', '#91a119', '#3fa129'));
TINTS.push(zenithShard('unova', 'whimsicott', '#3fa129', '#ef70ef'));
TINTS.push(zenithShard('unova', 'lilligant', '#3fa129'));
TINTS.push(zenithShard('unova', 'basculin', '#2980ef', '#624d4e'));
TINTS.push(zenithShard('unova', 'krookodile', '#915121', '#624d4e'));
TINTS.push(zenithShard('unova', 'darmanitan', '#e62829', '#ff8000'));
TINTS.push(zenithShard('unova', 'maractus', '#3fa129'));
TINTS.push(zenithShard('unova', 'crustle', '#91a119', '#afa981'));
TINTS.push(zenithShard('unova', 'sigilyph', '#ef4179', '#81b9ef'));
TINTS.push(zenithShard('unova', 'cofagrigus', '#704170'));
TINTS.push(zenithShard('unova', 'carracosta', '#2980ef', '#afa981'));
TINTS.push(zenithShard('unova', 'archeops', '#afa981', '#81b9ef'));
TINTS.push(zenithShard('unova', 'garbodor', '#9141cb'));
TINTS.push(zenithShard('unova', 'zoroark', '#624d4e'));
TINTS.push(zenithShard('unova', 'cinccino', '#9fa19f', '#ef70ef'));
TINTS.push(zenithShard('unova', 'gothitelle', '#ef4179', '#624d4e'));
TINTS.push(zenithShard('unova', 'reuniclus', '#ef4179'));
TINTS.push(zenithShard('unova', 'swanna', '#2980ef', '#81b9ef'));
TINTS.push(zenithShard('unova', 'vanilluxe', '#3dcef3'));
TINTS.push(zenithShard('unova', 'sawsbuck', '#9fa19f', '#3fa129'));
TINTS.push(zenithShard('unova', 'emolga', '#fac000', '#81b9ef'));
TINTS.push(zenithShard('unova', 'escavalier', '#91a119', '#60a1b8'));
TINTS.push(zenithShard('unova', 'amoonguss', '#3fa129', '#9141cb'));
TINTS.push(zenithShard('unova', 'jellicent', '#2980ef', '#704170'));
TINTS.push(zenithShard('unova', 'alomomola', '#2980ef'));
TINTS.push(zenithShard('unova', 'galvantula', '#91a119', '#fac000'));
TINTS.push(zenithShard('unova', 'ferrothorn', '#3fa129', '#60a1b8'));
TINTS.push(zenithShard('unova', 'klinklang', '#60a1b8'));
TINTS.push(zenithShard('unova', 'beheeyem', '#ef4179', '#fac000'));
TINTS.push(zenithShard('unova', 'haxorus', '#5060e1', '#60a1b8'));
TINTS.push(zenithShard('unova', 'beartic', '#3dcef3', '#ff8000'));
TINTS.push(zenithShard('unova', 'cryogonal', '#3dcef3'));
TINTS.push(zenithShard('unova', 'accelgor', '#91a119'));
TINTS.push(zenithShard('unova', 'stunfisk', '#915121', '#fac000'));
TINTS.push(zenithShard('unova', 'mienshao', '#ff8000'));
TINTS.push(zenithShard('unova', 'druddigon', '#5060e1'));
TINTS.push(zenithShard('unova', 'bouffalant', '#9fa19f'));
TINTS.push(zenithShard('unova', 'braviary', '#ff8000', '#81b9ef'));
TINTS.push(zenithShard('unova', 'mandibuzz', '#624d4e', '#81b9ef'));
TINTS.push(zenithShard('unova', 'heatmor', '#e62829'));
TINTS.push(zenithShard('unova', 'durant', '#91a119', '#60a1b8'));
TINTS.push(zenithShard('unova', 'hydreigon', '#624d4e', '#5060e1'));
TINTS.push(zenithShard('unova', 'volcarona', '#91a119', '#e62829'));
TINTS.push(zenithShard('unova', 'cobalion', '#60a1b8', '#ff8000'));
TINTS.push(zenithShard('unova', 'terrakion', '#afa981', '#ff8000'));
TINTS.push(zenithShard('unova', 'virizion', '#3fa129', '#ff8000'));
TINTS.push(zenithShard('unova', 'reshiram', '#5060e1', '#e62829'));
TINTS.push(zenithShard('unova', 'zekrom', '#5060e1', '#fac000'));
TINTS.push(zenithShard('unova', 'kyurem', '#5060e1', '#3dcef3'));
TINTS.push(zenithShard('unova', 'keldeo', '#2980ef', '#ff8000'));
TINTS.push(zenithShard('unova', 'meloetta', '#9fa19f', '#ef4179'));

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
  const [fromSheet, fromName] = [sheetOf(tint.from), nameOf(tint.from)];
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

    const swapped = Object.hasOwn(tint.swaps, was) ? tint.swaps[was] : tint.recolour?.(was);

    if (swapped == null) {
      missed.add(was);
      continue;
    }
    const packedColour = Number.parseInt(swapped.slice(1), 16);

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
  if (tint.shade != null) {
    for (let at = 0; at < image.rgba.length; at += 4) {
      if (image.rgba[at + 3] === 0) {
        continue;
      }
      const pixel = at / 4;
      const packedColour = Number.parseInt(
        tint
          .shade(
            hexOf(image, at),
            pixel % image.width,
            Math.floor(pixel / image.width),
            image.width,
            image.height,
          )
          .slice(1),
        16,
      );

      image.rgba[at] = (packedColour >> 16) & 0xff;
      image.rgba[at + 1] = (packedColour >> 8) & 0xff;
      image.rgba[at + 2] = packedColour & 0xff;
    }
  }
  return { name: nameOf(tint.to), image, trim: [source.trim[0], source.trim[1]] };
}

/**
 * The one picture that comes in from outside rather than off another
 * sheet.
 *
 * A clear amulet, a Manaphy egg: no rip has either, and the renders
 * they are drawn from are hundreds of pixels of smooth gradient. So
 * each is shrunk to an item's cell here, and the ramp the shrinking
 * leaves behind is flattened back to a few tones, which is how the
 * rest of the sheet is drawn.
 *
 * The renders live under `art`, and one that is not there is skipped:
 * the finished picture is already packed into its sheet, so a missing
 * render costs the ability to make it again rather than the icon.
 */

/** Where the renders these are made from are kept. */
const ART = 'art';

/**
 * How far apart two colours have to be to be two tones rather than one
 * blurred. Under this a downscale's gradient reads as one flat colour
 */
const TONE_APART = 50;

/** Under this much lightness a tone is the outline, whatever it is. */
const OUTLINE_LIGHT = 0.24;

interface Shrunk {
  /** The file under `art`, without its extension. */
  from: string;
  to: string;
  /** How wide the picture ends up, which the height follows. */
  wide?: number;
  /** How long its longer side ends up, for art taller than it is wide */
  fit?: number;
  /** Kept as the resize left it, with no tones merged and no outline drawn */
  plain?: true;
}

const SHRUNK: Shrunk[] = [
  { from: 'clear-amulet', to: 'held/clear-amulet', wide: 21 },
  { from: 'loaded-dice', to: 'held/loaded-dice', wide: 20 },
  { from: 'manaphy-egg', to: 'key/manaphy-egg', wide: 20 },
  // Gen 9 items, resized from their own art and nothing else. Detailed
  // art keeps 28 pixels on its long side to stay legible, a plain shape 24
  { from: 'auspicious-armor', to: 'evolutions/auspicious-armor', fit: 28, plain: true },
  { from: 'malicious-armor', to: 'evolutions/malicious-armor', fit: 28, plain: true },
  { from: 'syrupy-apple', to: 'evolutions/syrupy-apple', fit: 24, plain: true },
  { from: 'metal-alloy', to: 'evolutions/metal-alloy', fit: 24, plain: true },
  { from: 'unremarkable-teacup', to: 'evolutions/unremarkable-teacup', fit: 28, plain: true },
  { from: 'masterpiece-teacup', to: 'evolutions/masterpiece-teacup', fit: 28, plain: true },
  { from: 'leaders-crest', to: 'evolutions/leaders-crest', fit: 28, plain: true },
  { from: 'booster-energy', to: 'held/booster-energy', fit: 28, plain: true },
  { from: 'tera-orb', to: 'held/tera-orb', fit: 24, plain: true },
  { from: 'stellar-tera-shard', to: 'other/stellar-tera-shard', fit: 28, plain: true },
  { from: 'normal-tera-shard', to: 'other/normal-tera-shard', fit: 28, plain: true },
  { from: 'fighting-tera-shard', to: 'other/fighting-tera-shard', fit: 28, plain: true },
  { from: 'flying-tera-shard', to: 'other/flying-tera-shard', fit: 28, plain: true },
  { from: 'poison-tera-shard', to: 'other/poison-tera-shard', fit: 28, plain: true },
  { from: 'rock-tera-shard', to: 'other/rock-tera-shard', fit: 28, plain: true },
  { from: 'ground-tera-shard', to: 'other/ground-tera-shard', fit: 28, plain: true },
  { from: 'bug-tera-shard', to: 'other/bug-tera-shard', fit: 28, plain: true },
  { from: 'steel-tera-shard', to: 'other/steel-tera-shard', fit: 28, plain: true },
  { from: 'fire-tera-shard', to: 'other/fire-tera-shard', fit: 28, plain: true },
  { from: 'water-tera-shard', to: 'other/water-tera-shard', fit: 28, plain: true },
  { from: 'grass-tera-shard', to: 'other/grass-tera-shard', fit: 28, plain: true },
  { from: 'electric-tera-shard', to: 'other/electric-tera-shard', fit: 28, plain: true },
  { from: 'psychic-tera-shard', to: 'other/psychic-tera-shard', fit: 28, plain: true },
  { from: 'ice-tera-shard', to: 'other/ice-tera-shard', fit: 28, plain: true },
  { from: 'dragon-tera-shard', to: 'other/dragon-tera-shard', fit: 28, plain: true },
  { from: 'dark-tera-shard', to: 'other/dark-tera-shard', fit: 28, plain: true },
  { from: 'fairy-tera-shard', to: 'other/fairy-tera-shard', fit: 28, plain: true },
  { from: 'ghost-tera-shard', to: 'other/ghost-tera-shard', fit: 28, plain: true },
  { from: 'teal-mask', to: 'held/teal-mask', fit: 28, plain: true },
  { from: 'wellspring-mask', to: 'held/wellspring-mask', fit: 28, plain: true },
  { from: 'hearthflame-mask', to: 'held/hearthflame-mask', fit: 28, plain: true },
  { from: 'cornerstone-mask', to: 'held/cornerstone-mask', fit: 28, plain: true },
  { from: 'mythical-pecha-berry', to: 'key/mythical-pecha-berry', fit: 28, plain: true },
  { from: 'health-mochi', to: 'medicine/health-mochi', fit: 24, plain: true },
  { from: 'muscle-mochi', to: 'medicine/muscle-mochi', fit: 24, plain: true },
  { from: 'resist-mochi', to: 'medicine/resist-mochi', fit: 24, plain: true },
  { from: 'genius-mochi', to: 'medicine/genius-mochi', fit: 24, plain: true },
  { from: 'clever-mochi', to: 'medicine/clever-mochi', fit: 24, plain: true },
  { from: 'swift-mochi', to: 'medicine/swift-mochi', fit: 24, plain: true },
  { from: 'fresh-start-mochi', to: 'medicine/fresh-start-mochi', fit: 24, plain: true },
];

function lightnessOf(colour: number[]): number {
  return (Math.max(...colour) + Math.min(...colour)) / 510;
}

function apart(one: number[], two: number[]): number {
  return Math.hypot(one[0] - two[0], one[1] - two[1], one[2] - two[2]);
}

/**
 * A dark line round whatever the shrinking left.
 *
 * Every icon on these sheets is drawn with one, and a render's own
 * outline is thinner than a pixel by the time it is twenty across: it
 * survives as a tone somewhere between the line and the fill. So the
 * rim is repainted in the picture's own darkest tone, which leaves an
 * icon that already had a dark edge exactly as it was
 */
function outlined(image: Image, dark: number[] | undefined): void {
  const rim = dark ?? [32, 32, 32];
  const lit = (x: number, y: number): boolean =>
    x >= 0 &&
    y >= 0 &&
    x < image.width &&
    y < image.height &&
    image.rgba[(y * image.width + x) * 4 + 3] > 0;
  const edge: number[] = [];

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (lit(x, y) && !(lit(x - 1, y) && lit(x + 1, y) && lit(x, y - 1) && lit(x, y + 1))) {
        edge.push((y * image.width + x) * 4);
      }
    }
  }
  for (const at of edge) {
    for (let channel = 0; channel < 3; channel += 1) {
      image.rgba[at + channel] = rim[channel];
    }
  }
}

/**
 * One render, shrunk and flattened.
 *
 * The alpha is cut rather than kept: a soft edge round a twenty pixel
 * icon is a grey halo, and the colours are divided back out of it so an
 * edge pixel keeps its own colour rather than the one it was blended
 * toward. Every dark tone then becomes the same dark tone, which is
 * what makes the outline read as a line
 */
async function shrunk(art: Shrunk): Promise<Picture> {
  const trimmed = await sharp(join(ART, `${art.from}.png`))
    .trim({ threshold: 1 })
    .toBuffer();
  const source = await sharp(trimmed).metadata();
  const longest = Math.max(source.width, source.height);
  const wide = art.wide ?? Math.round(((art.fit ?? CELL) * source.width) / longest);
  const tall = Math.round((source.height / source.width) * wide);
  const { data } = await sharp(trimmed)
    .resize(wide, tall, { kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const image: Image = { width: wide, height: tall, rgba: Buffer.alloc(wide * tall * 4) };
  const counts = new Map<string, number>();

  for (let at = 0; at < image.rgba.length; at += 4) {
    const alpha = data[at + 3];

    if (alpha < 128) {
      continue;
    }
    for (let part = 0; part < 3; part += 1) {
      image.rgba[at + part] = Math.min(255, Math.round((data[at + part] * 255) / alpha));
    }
    image.rgba[at + 3] = 255;

    const key = hexOf(image, at);

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (art.plain === true) {
    return {
      name: art.to.split('/')[1],
      image,
      trim: [Math.floor((CELL - image.width) / 2), Math.floor((CELL - image.height) / 2)],
    };
  }

  const tones: { colour: number[]; pixels: number }[] = [];

  for (const [key, pixels] of [...counts].sort((one, two) => two[1] - one[1])) {
    const colour = [1, 3, 5].map((cut) => Number.parseInt(key.slice(cut, cut + 2), 16));
    const near = tones.find((tone) => apart(tone.colour, colour) < TONE_APART);

    if (near == null) {
      tones.push({ colour, pixels });
    } else {
      near.pixels += pixels;
    }
  }
  const dark = tones
    .filter((tone) => lightnessOf(tone.colour) < OUTLINE_LIGHT)
    .sort((one, two) => two.pixels - one.pixels);

  for (let at = 0; at < image.rgba.length; at += 4) {
    if (image.rgba[at + 3] === 0) {
      continue;
    }
    const colour = [image.rgba[at], image.rgba[at + 1], image.rgba[at + 2]];
    const nearest = tones.reduce((best, tone) =>
      apart(tone.colour, colour) < apart(best.colour, colour) ? tone : best,
    );
    const into = dark.length > 0 && lightnessOf(nearest.colour) < OUTLINE_LIGHT ? dark[0] : nearest;

    image.rgba[at] = into.colour[0];
    image.rgba[at + 1] = into.colour[1];
    image.rgba[at + 2] = into.colour[2];
  }
  outlined(image, dark[0]?.colour);

  return {
    name: nameOf(art.to),
    image,
    trim: [Math.floor((CELL - image.width) / 2), Math.floor((CELL - image.height) / 2)],
  };
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
  { to: 'evolutions/linking-cord', rows: cord(), colours: CORD_COLOURS },
];

const sheets = new Map<string, Sheet>();
const reading = new Set(
  [
    ...TINTS.flatMap((one) => [one.from, one.to]),
    ...DRAWN.map((one) => one.to),
    ...SHRUNK.map((one) => one.to),
  ].map((spec) => sheetOf(spec)),
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
  put(sheetOf(tint.to), tinted(tint, sheets));
}
for (const one of DRAWN) {
  put(sheetOf(one.to), drawn(nameOf(one.to), one.rows, one.colours));
}
for (const one of SHRUNK) {
  if (!existsSync(join(ART, `${one.from}.png`))) {
    console.log(`  ${one.to} kept as it is: no ${ART}/${one.from}.png to shrink`);
    continue;
  }
  put(sheetOf(one.to), await shrunk(one));
}
for (const name of touched) {
  const sheet = sheets.get(name);

  if (sheet != null) {
    writeSheet(name, sheet);
  }
}
