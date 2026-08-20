import 'server-only';
import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';
import type { AnimData } from './anim-data';
import readAnimData from './anim-data';
import type { SpriteAnim } from '../../data/ids/sprite-anims';
import { spriteAnimName, spriteAnimOf } from '../../data/ids/sprite-anims';
import writeCoats from './coats';
import type { Deduped, Rect, SourceGrid } from './dedupe';
import dedupe, { drawPictures } from './dedupe';
import type { Drawing } from './files';
import { pokemonDestination, writeSheet } from './files';
import type { FrameMarkers, Point, SpriteDirection } from './markers';
import markersFor, { SPRITE_DIRECTIONS } from './markers';
import pack from './packing';
import type { Raster } from './raster';
import { blank, decode, encode } from './raster';
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
  name: SpriteAnim;
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
  /** Which frames are the same picture, once every coat has been read. */
  kept?: Deduped;
  /** Where each kept picture landed inside this clip's own region. */
  spots?: ({ x: number; y: number } | undefined)[];
}

/** One frame as the description writes it: anchors, then placement. */
type FrameData = [
  shadow: Point | null,
  center: Point | null,
  head: Point | null,
  left: Point | null,
  right: Point | null,
  cell: number,
  flip: 0 | 1,
  at: Point,
];

/** What the description says about one animation's frames. */
interface SpriteTarget {
  /** The distinct pictures, placed in this clip's region. */
  pictures: Rect[];
  frameWidth: number;
  frameHeight: number;
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  directions: SpriteDirection[];
  /** Row-major: the frame for a direction and index is `row * columns + frame`. */
  frames: FrameData[];
}

interface SheetImage {
  name: SpriteAnim;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetData {
  compact: boolean;
  sheet: { width: number; height: number; images: SheetImage[] };
  anims: AnimData;
  sprites: Partial<Record<SpriteAnim, SpriteTarget>>;
}

export interface PmdResult {
  written: string[];
  width: number;
  height: number;
  anims: string[];
  /** One a coat, in the order they were written. */
  coats: Drawing[];
}

/** Which of the three images a file is, read off the end of its name. */
const KINDS: { prefix: string; key: keyof SpriteImages }[] = [
  { prefix: 'Anim', key: 'animation' },
  { prefix: 'Offsets', key: 'offsets' },
  { prefix: 'Shadow', key: 'shadow' },
];

/**
 * Matches an animation name from its start, the way the tool did.
 *
 * A name this game has no number for is refused here rather than
 * dropped later: a sheet is described in numbers, so an animation
 * outside [`SpriteAnim`](../../data/ids/sprite-anims.ts) cannot be
 * written at all
 */
export function animFilter(names: string[]): RegExp {
  const wanted = names.map((name) => name.trim()).filter((name) => name.length > 0);

  if (wanted.length === 0) {
    throw new Error('No animations named');
  }
  const unknown = wanted.filter((name) => spriteAnimOf(name) == null);

  if (unknown.length > 0) {
    throw new Error(`This game has no number for ${unknown.join(', ')}`);
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
): Promise<{ animData: string; images: Map<SpriteAnim, SpriteImages> }> {
  const reader = new ZipReader(new Uint8ArrayReader(bytes));
  const images = new Map<SpriteAnim, SpriteImages>();
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
      const prefix = spriteAnimOf(name.slice(0, cut));
      const suffix = name.slice(cut + 1);
      const kind = KINDS.find((known) => suffix.startsWith(known.prefix));

      if (kind == null || prefix == null) {
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
  images: Map<SpriteAnim, SpriteImages>,
  others: Map<SpriteAnim, SpriteImages>[],
  data: AnimData,
  compact: boolean,
): Entry[] {
  const sizes = new Map<SpriteAnim, { width: number; height: number }>();

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

/** Where one animation's frames sit in the archive it came from. */
function gridOf(entry: Entry): SourceGrid {
  return {
    x: 0,
    y: 0,
    pitchX: entry.sourceFrameWidth,
    pitchY: entry.sourceFrameHeight,
    offsetX: entry.trim[0],
    offsetY: entry.trim[1],
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight,
    columns: entry.columns,
    rows: entry.rows,
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

  const kept = entry.kept;

  return {
    pictures: (kept?.pictures ?? []).map((picture, at) => ({
      x: entry.spots?.[at]?.x ?? 0,
      y: entry.spots?.[at]?.y ?? 0,
      width: picture.width,
      height: picture.height,
    })),
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight,
    sourceFrameWidth: entry.sourceFrameWidth,
    sourceFrameHeight: entry.sourceFrameHeight,
    trim: entry.trim,
    columns: entry.columns,
    rows: entry.rows,
    directions: [...SPRITE_DIRECTIONS].slice(0, entry.rows),
    // Written as an array rather than as named fields: the names are
    // worth nothing in a file that repeats them a hundred thousand
    // times. The order is the one `sprite-sheet.ts` reads
    frames: frames.map((markers, at): FrameData => {
      const held = kept?.frames[at];

      return [
        markers.shadow,
        markers.center,
        markers.head,
        markers.left,
        markers.right,
        held?.cell ?? at,
        held?.flip === true ? 1 : 0,
        held?.at ?? [0, 0],
      ];
    }),
  };
}

/** Draws one animation into the sheet: one copy of each picture. */
function draw(sheet: Raster, entry: Entry, at: { x: number; y: number }): void {
  const drawing = entry.images.animation;

  if (drawing == null || entry.kept == null || entry.spots == null) {
    return;
  }
  // One copy of each picture, wherever it came from in the archive.
  // There is no shortcut for an untrimmed grid any more: the frames
  // are not laid out the way they arrived, so every one is placed
  drawPictures(sheet, drawing, entry.kept.pictures, entry.spots, at);
}

/** One coat's archive, read for its pictures alone. */
async function coatImages(bytes: Uint8Array, keep: RegExp): Promise<Map<SpriteAnim, SpriteImages>> {
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
  // Which frames are the same picture, decided across every coat at
  // once: they share one description, so a pair is only a pair when it
  // is a pair in all of them. The box a clip needs is what is left
  for (const entry of entries) {
    const drawings = [
      entry.images.animation,
      ...others.map((coat) => coat.get(entry.name)?.animation),
    ];

    entry.kept = dedupe(
      drawings
        .filter((raster): raster is Raster => raster != null)
        .map((raster) => ({ raster, grid: gridOf(entry) })),
      options.compact,
    );
    // The pictures are all different sizes now, so where they go inside
    // the clip is the same question the sheet asks of the clips
    const inside = pack(
      entry.kept.pictures.map((picture, at) => ({ at, w: picture.width, h: picture.height })),
    );
    const spots: ({ x: number; y: number } | undefined)[] = [];

    for (const { box, x, y } of inside.placed) {
      spots[box.at] = { x, y };
    }
    entry.spots = spots;
    entry.w = inside.width;
    entry.h = inside.height;
  }
  const layout = pack(entries);
  const placed: SheetImage[] = [];
  const sprites: Partial<Record<SpriteAnim, SpriteTarget>> = {};
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
  const drawn: Drawing[] = [];

  /** One coat onto the layout every coat shares. */
  const put = async (
    raster: Raster,
    name: { female: boolean; shiny: boolean },
    meta: string | null,
  ): Promise<void> => {
    const encoded = encode(raster);
    const files = await writeSheet(
      pokemonDestination({ species: options.species, ...name }),
      encoded.bytes,
      meta,
    );

    written.push(...files.map((file) => file.path));
    drawn.push({
      ...files[0],
      as: encoded.as,
      bytes: encoded.bytes.length,
      plain: encoded.plain,
    });
  };

  // The plain coat carries the description, and the rest are the same
  // sheet drawn again from their own pictures
  // Written without spacing: the description is read by the game and
  // by nothing else, and indenting it is three times the bytes
  await put(sheet, { female: false, shiny: false }, JSON.stringify(output));
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

  // Last, so the list describes the sheets that are now there rather
  // than the ones that were
  written.push(await writeCoats());

  return {
    written,
    width: layout.width,
    height: layout.height,
    anims: data.anims.map((anim) => spriteAnimName(anim.name)),
    coats: drawn,
  };
}
