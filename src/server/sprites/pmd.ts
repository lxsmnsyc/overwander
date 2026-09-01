import 'server-only';
import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';
import type { AnimData } from './anim-data';
import readAnimData from './anim-data';
import type { SpriteAnim } from '../../data/ids/sprite-anims';
import { spriteAnimName, spriteAnimOf } from '../../data/ids/sprite-anims';
import writeCoats from './coats';
import type { FrameCell, SourceGrid } from './dedupe';
import deduper, { drawPictures } from './dedupe';
import type { Drawing } from './files';
import { pokemonDestination, writeSheet } from './files';
import type { FrameMarkers, Point } from './markers';
import markersFor from './markers';
import { packSmallest } from './packing';
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
  /** Which picture each frame is, once every coat has been read. */
  frames?: FrameCell[];
}

/** The four marks of the `-Offsets` image, in the order they are written. */
export type MarkData = [
  center: Point | null,
  head: Point | null,
  left: Point | null,
  right: Point | null,
];

/**
 * One frame as the description writes it: where its shadow is, which
 * picture it draws and where. The marks come last and only where this
 * frame disagrees with its picture about them
 */
type FrameData =
  | [shadow: Point | null, cell: number, flip: 0 | 1, at: Point]
  | [shadow: Point | null, cell: number, flip: 0 | 1, at: Point, marks: MarkData];

/** One frame before it is written, with its marks still its own. */
export interface Frame {
  shadow: Point | null;
  marks: MarkData;
  cell: number;
  flip: boolean;
  at: Point;
}

/** What the description says about one animation's frames. */
export interface SpriteTarget {
  frameWidth: number;
  frameHeight: number;
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  /** Row-major: the frame for a direction and index is `row * columns + frame`. */
  frames: Frame[];
}

/** The same, once the marks it shares have been lifted off it. */
type WrittenTarget = Omit<SpriteTarget, 'frames'> & { frames: FrameData[] };

/**
 * Where one picture landed on the sheet, and where the parts of it are.
 * A picture nothing marks is written as the rectangle alone
 */
export type PictureData =
  | [x: number, y: number, width: number, height: number]
  | [x: number, y: number, width: number, height: number, marks: MarkData];

/** Which shape the description is written in: see `sprite-sheet.ts`. */
const VERSION = 2;

interface SheetData {
  version: number;
  sheet: { width: number; height: number; pictures: PictureData[] };
  anims: WrittenAnimData;
  sprites: Partial<Record<SpriteAnim, WrittenTarget>>;
}

/**
 * The archive's own animation list, less what the sheet already says.
 *
 * The frame sizes are dropped: they are the cell each animation was
 * drawn in, which `sprites` carries as `sourceFrameWidth`, and a fact
 * written twice is a fact that can disagree with itself
 */
interface WrittenAnim {
  name: SpriteAnim;
  index: number;
  durations: number[];
  /** Left out where it is the animation itself. */
  target?: SpriteAnim;
}

interface WrittenAnimData {
  shadowSize: number;
  anims: WrittenAnim[];
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
    });
  }
  return entries;
}

/**
 * The same drawing on the plain coat's canvas.
 *
 * Cells are copied one at a time and centred in their new box, which
 * is the whole of what these archives differ by: the artist exported a
 * coat with a few rows less padding round the same pokemon, and its
 * frames sit that many pixels higher as a result
 */
function recanvas(
  raster: Raster,
  columns: number,
  rows: number,
  width: number,
  height: number,
): Raster {
  const was = { width: raster.width / columns, height: raster.height / rows };
  const out = blank(columns * width, rows * height);
  const shiftX = Math.round((width - was.width) / 2);
  const shiftY = Math.round((height - was.height) / 2);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      blit(
        out,
        raster,
        { x: column * was.width, y: row * was.height, width: was.width, height: was.height },
        { x: column * width + shiftX, y: row * height + shiftY },
      );
    }
  }
  return out;
}

/**
 * Puts every coat on one canvas.
 *
 * A coat is its own archive on the collab site and is exported on its
 * own, so its frames may be cut with a few rows or columns more padding
 * than the plain coat's: Meganium's female Attack is 8 shorter,
 * Heracross's is 8 wider. One description ships for all four coats, so
 * every coat is re-canvassed onto the largest frame any of them uses,
 * growing the plain coat and its two mark images along with it.
 *
 * The largest rather than the plain coat's own: a wider coat is wider
 * because it draws past what the plain frame holds, and cropping it to
 * fit would clip that. Anchors survive because the marks move with the
 * drawing, and the trim in `entriesFor` crops the padding back off.
 *
 * Only the padding may differ. A coat whose grid is a different shape
 * is a different animation, and nothing here can reconcile that
 */
export function alignCoats(
  images: Map<SpriteAnim, SpriteImages>,
  others: Map<SpriteAnim, SpriteImages>[],
  data: AnimData,
  extra: { key: keyof Coats }[],
): void {
  const sizes = new Map<SpriteAnim, { width: number; height: number }>();

  for (const anim of data.anims) {
    if (!sizes.has(anim.target)) {
      sizes.set(anim.target, { width: anim.frameWidth, height: anim.frameHeight });
    }
  }

  for (const [name, held] of images) {
    const plain = held.animation;
    const size = sizes.get(name);

    if (plain == null || size == null) {
      continue;
    }
    const columns = Math.max(Math.floor(plain.width / size.width), 1);
    const rows = Math.max(Math.floor(plain.height / size.height), 1);
    const coats = others.map((coat) => coat.get(name));
    let width = size.width;
    let height = size.height;

    for (let coat = 0; coat < coats.length; coat += 1) {
      const drawing = coats[coat]?.animation;

      if (drawing == null) {
        continue;
      }
      if (drawing.width % columns !== 0 || drawing.height % rows !== 0) {
        throw new Error(
          `The ${extra[coat].key} coat's ${spriteAnimName(name)} is ` +
            `${drawing.width}x${drawing.height}, which is not ${columns} by ${rows} frames ` +
            `the way the ordinary coat's ${plain.width}x${plain.height} is.`,
        );
      }
      width = Math.max(width, drawing.width / columns);
      height = Math.max(height, drawing.height / rows);
    }

    if (width !== size.width || height !== size.height) {
      for (const kind of KINDS) {
        const raster = held[kind.key];

        if (raster != null) {
          held[kind.key] = recanvas(raster, columns, rows, width, height);
        }
      }
      // The grid the description names has to be the one the pixels are
      // now on: every read of it downstream goes through here
      for (const anim of data.anims) {
        if (anim.target === name) {
          anim.frameWidth = width;
          anim.frameHeight = height;
        }
      }
    }

    for (const coated of coats) {
      const drawing = coated?.animation;

      if (coated == null || drawing == null) {
        continue;
      }
      if (drawing.width === columns * width && drawing.height === rows * height) {
        continue;
      }
      coated.animation = recanvas(drawing, columns, rows, width, height);
    }
  }
}

/** The rectangle that holds every one of them. */ /** The rectangle that holds every one of them. */
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

  return {
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight,
    sourceFrameWidth: entry.sourceFrameWidth,
    sourceFrameHeight: entry.sourceFrameHeight,
    trim: entry.trim,
    columns: entry.columns,
    rows: entry.rows,
    frames: frames.map((markers, at): Frame => {
      const held = entry.frames?.[at];

      return {
        shadow: markers.shadow,
        marks: [markers.center, markers.head, markers.left, markers.right],
        cell: held?.cell ?? at,
        flip: held?.flip === true,
        at: held?.at ?? [0, 0],
      };
    }),
  };
}

/**
 * A frame's marks, moved into the pixels of the picture it draws.
 *
 * The marks are read against the frame's box, but they describe the
 * drawing: the same pose packed once and played by nine frames has its
 * head in the same place in all nine, and only in the picture's own
 * pixels does that show
 */
function marksOnPicture(frame: Frame, width: number): MarkData {
  const moved = (point: Point | null): Point | null => {
    if (point == null) {
      return null;
    }
    const x = point[0] - frame.at[0];

    return [frame.flip ? width - 1 - x : x, point[1] - frame.at[1]];
  };

  return [
    moved(frame.marks[0]),
    moved(frame.marks[1]),
    moved(frame.marks[2]),
    moved(frame.marks[3]),
  ];
}

/** Whether two frames put the same parts in the same places. */
function sameMarks(one: MarkData, two: MarkData): boolean {
  return one.every((point, at) => {
    const other = two[at];

    return point == null || other == null
      ? point === other
      : point[0] === other[0] && point[1] === other[1];
  });
}

/**
 * The description, with every mark written once.
 *
 * A picture takes the marks of the first frame that draws it, and a
 * frame that disagrees carries its own: two poses can pack to one
 * picture without agreeing on where the hands are, which happens to
 * about one frame in a hundred and fifty and is worth a line each
 * rather than a copy for all of them
 */
export function hoistMarks(
  targets: { name: SpriteAnim; target: SpriteTarget }[],
  pictures: PictureData[],
): { pictures: PictureData[]; sprites: Partial<Record<SpriteAnim, WrittenTarget>> } {
  const widthOf = (cell: number): number => pictures[cell]?.[2] ?? 0;
  const shared = new Map<number, MarkData>();
  const sprites: Partial<Record<SpriteAnim, WrittenTarget>> = {};

  for (const { target } of targets) {
    for (const frame of target.frames) {
      if (!shared.has(frame.cell)) {
        shared.set(frame.cell, marksOnPicture(frame, widthOf(frame.cell)));
      }
    }
  }

  for (const { name, target } of targets) {
    sprites[name] = {
      ...target,
      frames: target.frames.map((frame): FrameData => {
        const marks = marksOnPicture(frame, widthOf(frame.cell));
        const held: FrameData = [frame.shadow, frame.cell, frame.flip ? 1 : 0, frame.at];
        const common = shared.get(frame.cell);

        return common != null && sameMarks(common, marks) ? held : [...held, marks];
      }),
    };
  }

  return {
    pictures: pictures.map((picture, at): PictureData => {
      const marks = shared.get(at);

      return marks == null ? picture : [picture[0], picture[1], picture[2], picture[3], marks];
    }),
    sprites,
  };
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
  alignCoats(images, others, data, extra);

  const entries = entriesFor(images, others, data, options.compact);

  if (entries.length === 0) {
    throw new Error('The archive holds none of the animations asked for');
  }
  /** Every drawing of one animation: the plain coat's, then the rest. */
  const drawingsOf = (entry: Entry): (Raster | null)[] => [
    entry.images.animation ?? null,
    ...others.map((coat) => coat.get(entry.name)?.animation ?? null),
  ];

  // Which frames are the same picture, decided across every coat and
  // every clip at once. Across coats because they share one description,
  // so a pair is only a pair when it is a pair in all of them; across
  // clips because a pokemon standing still is drawn the same in its
  // Idle, its Charge and the first frame of its Attack
  const shared = deduper(options.compact);

  for (let at = 0; at < entries.length; at += 1) {
    const entry = entries[at];
    const coated = drawingsOf(entry).flatMap((raster, coat) =>
      raster == null ? [] : [{ raster, coat }],
    );

    entry.frames = shared.add(
      coated.map((held) => ({ raster: held.raster, grid: gridOf(entry) })),
      at,
      coated.map((held) => held.coat).join(','),
    );
  }
  const layout = packSmallest(
    shared.pictures.map((picture, at) => ({ at, w: picture.width, h: picture.height })),
  );
  const spots: ({ x: number; y: number } | undefined)[] = [];

  for (const { box, x, y } of layout.placed) {
    spots[box.at] = { x, y };
  }
  const targets = entries.map((entry) => ({ name: entry.name, target: targetFor(entry) }));

  /** One coat drawn onto the layout every coat shares. */
  const paint = (coat: number): Raster => {
    const raster = blank(layout.width, layout.height);

    drawPictures(raster, shared.pictures, spots, (source) => drawingsOf(entries[source])[coat]);
    return raster;
  };

  const described = hoistMarks(
    targets,
    shared.pictures.map((picture, at): PictureData => [
      spots[at]?.x ?? 0,
      spots[at]?.y ?? 0,
      picture.width,
      picture.height,
    ]),
  );
  const output: SheetData = {
    version: VERSION,
    sheet: { width: layout.width, height: layout.height, pictures: described.pictures },
    anims: {
      shadowSize: data.shadowSize,
      anims: data.anims.map((anim): WrittenAnim => ({
        name: anim.name,
        index: anim.index,
        durations: anim.durations,
        ...(anim.target === anim.name ? {} : { target: anim.target }),
      })),
    },
    sprites: described.sprites,
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
  // sheet drawn again from their own pictures. Written without spacing:
  // the description is read by the game and by nothing else, and
  // indenting it is three times the bytes
  await put(paint(0), { female: false, shiny: false }, JSON.stringify(output));
  for (let at = 0; at < extra.length; at += 1) {
    await put(paint(at + 1), extra[at], null);
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
