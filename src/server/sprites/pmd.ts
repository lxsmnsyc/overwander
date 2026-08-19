import 'server-only';
import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';
import type { AnimData } from './anim-data';
import readAnimData from './anim-data';
import { pokemonDestination, writeSheet } from './files';
import type { FrameMarkers, Point, SpriteDirection } from './markers';
import markersFor, { SPRITE_DIRECTIONS } from './markers';
import pack from './packing';
import type { Raster } from './raster';
import { blank, blit, decode, encode } from './raster';
import type { Trim } from './trim';
import computeTrim from './trim';

/**
 * A PMD sprite archive into one sheet the game can draw.
 *
 * The archive is what the sprite collab site hands out: an
 * `AnimData.xml` and, for every animation, three images — the drawing,
 * the shadow marks and the anchor marks. This packs the drawings into
 * one sheet, reads the marks off the other two, and writes the sheet
 * beside the description that says how to read it.
 */

/**
 * The four drawings of one pokemon. A coat is an archive of its own on
 * the collab site, and only the plain one has to be there: a species
 * with no female form has two, and one still half-drawn may have one
 */
export interface Coats {
  regular?: Uint8Array;
  shiny?: Uint8Array;
  female?: Uint8Array;
  shinyFemale?: Uint8Array;
}

/** Which drawing a coat is, for the path it is written to. */
const COATS: { key: keyof Coats; female: boolean; shiny: boolean }[] = [
  { key: 'regular', female: false, shiny: false },
  { key: 'shiny', female: false, shiny: true },
  { key: 'female', female: true, shiny: false },
  { key: 'shinyFemale', female: true, shiny: true },
];

export interface PmdOptions {
  species: number;
  /** Whether every frame is cropped to the grid's content. */
  compact: boolean;
  /** Animation names to keep, matched at the start of the name. */
  anims: string[];
}

/** The three images one animation ships as. */
interface SpriteImages {
  animation?: Raster;
  shadow?: Raster;
  offsets?: Raster;
}

interface Entry {
  name: string;
  images: SpriteImages;
  /** The grid as authored, straight out of `AnimData.xml`. */
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  /** The grid once trimmed, which is the same when not compacting. */
  frameWidth: number;
  frameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  w: number;
  h: number;
}

/** What the description says about one animation's frames. */
interface SpriteTarget {
  frameWidth: number;
  frameHeight: number;
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  directions: SpriteDirection[];
  /** Row-major: the frame for a direction and index is `row * columns + frame`. */
  frames: FrameMarkers[];
}

interface SheetImage {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetData {
  compact: boolean;
  sheet: { width: number; height: number; images: SheetImage[] };
  anims: AnimData;
  sprites: Record<string, SpriteTarget>;
}

/** One drawing, as it came out. */
export interface CoatResult {
  path: string;
  /** What it was stored as, and how big that came out. */
  as: string;
  bytes: number;
}

export interface PmdResult {
  written: string[];
  width: number;
  height: number;
  anims: string[];
  coats: CoatResult[];
}

/** Which of the three images a file is, read off the end of its name. */
const KINDS: { prefix: string; key: keyof SpriteImages }[] = [
  { prefix: 'Anim', key: 'animation' },
  { prefix: 'Offsets', key: 'offsets' },
  { prefix: 'Shadow', key: 'shadow' },
];

/** Matches an animation name from its start, the way the tool did. */
export function animFilter(names: string[]): RegExp {
  const wanted = names.map((name) => name.trim()).filter((name) => name.length > 0);

  if (wanted.length === 0) {
    throw new Error('No animations named');
  }
  return new RegExp(`^(${wanted.join('|')})`, 'i');
}

/**
 * What the archive holds: the description, and the three images of
 * each animation whose name the filter keeps
 */
async function readArchive(
  bytes: Uint8Array,
  keep: RegExp,
): Promise<{ animData: string; images: Map<string, SpriteImages> }> {
  const reader = new ZipReader(new Uint8ArrayReader(bytes));
  const images = new Map<string, SpriteImages>();
  let animData: string | undefined;

  try {
    for (const entry of await reader.getEntries()) {
      if (entry.directory) {
        continue;
      }
      // Named without its directory, since an archive may hold the
      // sprite in a folder of its own
      const name = entry.filename.slice(entry.filename.lastIndexOf('/') + 1);

      if (name === 'AnimData.xml') {
        animData = await entry.getData(new TextWriter());
        continue;
      }
      const cut = name.lastIndexOf('-');

      if (cut < 0 || !keep.test(name)) {
        continue;
      }
      const prefix = name.slice(0, cut);
      const suffix = name.slice(cut + 1);
      const kind = KINDS.find((known) => suffix.startsWith(known.prefix));

      if (kind == null) {
        continue;
      }
      const held = images.get(prefix) ?? {};

      held[kind.key] = await decode(await entry.getData(new Uint8ArrayWriter()));
      images.set(prefix, held);
    }
  } finally {
    await reader.close();
  }

  if (animData == null) {
    throw new Error('The archive has no AnimData.xml');
  }
  return { animData, images };
}

/**
 * Every animation image, sized against the grid its animation names.
 *
 * An image with no animation of its own can only be read as a single
 * frame, which is what the sizes fall back to
 */
function entriesFor(
  images: Map<string, SpriteImages>,
  others: Map<string, SpriteImages>[],
  data: AnimData,
  compact: boolean,
): Entry[] {
  const sizes = new Map<string, { width: number; height: number }>();

  for (const anim of data.anims) {
    if (!sizes.has(anim.target)) {
      sizes.set(anim.target, { width: anim.frameWidth, height: anim.frameHeight });
    }
  }
  const entries: Entry[] = [];

  for (const [name, held] of images) {
    const drawing = held.animation;

    if (drawing == null) {
      continue;
    }
    const size = sizes.get(name) ?? { width: drawing.width, height: drawing.height };
    const columns = Math.max(Math.floor(drawing.width / size.width), 1);
    const rows = Math.max(Math.floor(drawing.height / size.height), 1);
    // Every coat is cropped to the same rectangle. They share one
    // description, so a shiny trimmed a pixel tighter than the plain
    // one would be read against the plain one's grid and drawn askew:
    // the rectangle is the one that holds all of them
    const trim = compact
      ? widest(
          [drawing, ...others.map((coat) => coat.get(name)?.animation)]
            .filter((raster): raster is Raster => raster != null)
            .map((raster) => computeTrim(raster, size.width, size.height, columns, rows)),
        )
      : { x: 0, y: 0, width: size.width, height: size.height };
    const trimmed = trim.width !== size.width || trim.height !== size.height;

    entries.push({
      name,
      images: held,
      sourceFrameWidth: size.width,
      sourceFrameHeight: size.height,
      frameWidth: trim.width,
      frameHeight: trim.height,
      trim: [trim.x, trim.y],
      columns,
      rows,
      // Only a trimmed grid resizes the box. Left alone the image keeps
      // its own size, so a frame size that does not tile it exactly can
      // never crop it
      w: trimmed ? columns * trim.width : drawing.width,
      h: trimmed ? rows * trim.height : drawing.height,
    });
  }
  return entries;
}

/** The rectangle that holds every one of them. */
function widest(trims: Trim[]): Trim {
  const x = Math.min(...trims.map((trim) => trim.x));
  const y = Math.min(...trims.map((trim) => trim.y));

  return {
    x,
    y,
    width: Math.max(...trims.map((trim) => trim.x + trim.width)) - x,
    height: Math.max(...trims.map((trim) => trim.y + trim.height)) - y,
  };
}

/** Where every anchor of every frame of one animation ended up. */
function targetFor(entry: Entry): SpriteTarget {
  const frames: FrameMarkers[] = [];

  for (let row = 0; row < entry.rows; row += 1) {
    for (let column = 0; column < entry.columns; column += 1) {
      frames.push(
        markersFor(
          entry.images.shadow ?? null,
          entry.images.offsets ?? null,
          {
            x: column * entry.sourceFrameWidth,
            y: row * entry.sourceFrameHeight,
            width: entry.sourceFrameWidth,
            height: entry.sourceFrameHeight,
          },
          entry.trim,
        ),
      );
    }
  }

  return {
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight,
    sourceFrameWidth: entry.sourceFrameWidth,
    sourceFrameHeight: entry.sourceFrameHeight,
    trim: entry.trim,
    columns: entry.columns,
    rows: entry.rows,
    directions: [...SPRITE_DIRECTIONS].slice(0, entry.rows),
    frames,
  };
}

/** Draws one animation into the sheet, frame by frame when compacted. */
function draw(sheet: Raster, entry: Entry, at: { x: number; y: number }): void {
  const drawing = entry.images.animation;

  if (drawing == null) {
    return;
  }
  if (entry.trim[0] === 0 && entry.trim[1] === 0 && entry.frameWidth === entry.sourceFrameWidth) {
    blit(sheet, drawing, { x: 0, y: 0, width: entry.w, height: entry.h }, at);
    return;
  }
  for (let row = 0; row < entry.rows; row += 1) {
    for (let column = 0; column < entry.columns; column += 1) {
      blit(
        sheet,
        drawing,
        {
          x: column * entry.sourceFrameWidth + entry.trim[0],
          y: row * entry.sourceFrameHeight + entry.trim[1],
          width: entry.frameWidth,
          height: entry.frameHeight,
        },
        { x: at.x + column * entry.frameWidth, y: at.y + row * entry.frameHeight },
      );
    }
  }
}

/** One coat's archive, read for its pictures alone. */
async function coatImages(bytes: Uint8Array, keep: RegExp): Promise<Map<string, SpriteImages>> {
  return (await readArchive(bytes, keep)).images;
}

export default async function processPmd(coats: Coats, options: PmdOptions): Promise<PmdResult> {
  const keep = animFilter(options.anims);
  const plain = coats.regular;

  if (plain == null) {
    throw new Error('The ordinary coat is the one every sheet is built from');
  }
  // The description is the plain coat's. Every coat is the same
  // pokemon drawn again — the same frames, held for the same time —
  // and the game keeps one description for all of them
  const { animData, images } = await readArchive(plain, keep);
  const data = readAnimData(animData, keep);
  const extra = COATS.slice(1).filter((coat) => coats[coat.key] != null);
  const others = await Promise.all(
    // oxlint-disable-next-line typescript/no-non-null-assertion
    extra.map(async (coat) => coatImages(coats[coat.key]!, keep)),
  );
  const entries = entriesFor(images, others, data, options.compact);

  if (entries.length === 0) {
    throw new Error('The archive holds none of the animations asked for');
  }
  const layout = pack(entries);
  const placed: SheetImage[] = [];
  const sprites: Record<string, SpriteTarget> = {};
  const sheet = blank(layout.width, layout.height);

  for (const { box, x, y } of layout.placed) {
    draw(sheet, box, { x, y });
    placed.push({ name: box.name, x, y, width: box.w, height: box.h });
    sprites[box.name] = targetFor(box);
  }

  const output: SheetData = {
    // `anims` mirrors the archive, so its frame sizes stay untrimmed:
    // `sprites` is the one that follows compaction
    compact: options.compact,
    sheet: { width: layout.width, height: layout.height, images: placed },
    anims: data,
    sprites,
  };
  const written: string[] = [];
  const drawn: CoatResult[] = [];

  /** One coat onto the layout every coat shares. */
  const put = async (
    raster: Raster,
    name: { female: boolean; shiny: boolean },
    meta: string | null,
  ): Promise<void> => {
    const encoded = encode(raster);
    const paths = await writeSheet(
      pokemonDestination({ species: options.species, ...name }),
      encoded.bytes,
      meta,
    );

    written.push(...paths);
    drawn.push({ path: paths[0], as: encoded.as, bytes: encoded.bytes.length });
  };

  // The plain coat carries the description, and the rest are the same
  // sheet drawn again from their own pictures
  await put(sheet, { female: false, shiny: false }, JSON.stringify(output, null, 2));
  for (let at = 0; at < extra.length; at += 1) {
    const coat = blank(layout.width, layout.height);

    for (const { box, x, y } of layout.placed) {
      const held = others[at].get(box.name);

      if (held?.animation != null) {
        draw(coat, { ...box, images: held }, { x, y });
      }
    }
    await put(coat, extra[at], null);
  }

  return {
    written,
    width: layout.width,
    height: layout.height,
    anims: data.anims.map((anim) => anim.name),
    coats: drawn,
  };
}
