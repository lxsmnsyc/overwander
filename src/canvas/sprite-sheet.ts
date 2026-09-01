import type { Coat } from './sprite-coats';
import type { SpriteAnim } from '../data/ids/sprite-anims';
import { asSpriteAnim } from '../data/ids/sprite-anims';

/**
 * What a pokemon's sprite sheet says, and how to read it safely.
 *
 * A pokemon is a folder: one `sheet.json` describing the layout, one
 * `frames.bin` holding the numbers, and a PNG per coat. Every coat is
 * packed to the same layout, so `regular.png` and `shiny.png` are two
 * drawings over one description and swapping one for the other changes
 * nothing else.
 *
 * The folders are built by the SpriteCollab checkout beside this
 * repository and copied in whole, so this module reads that format
 * rather than one of its own: `compact/README.md` there is the
 * authority on it.
 *
 * `sheet.pictures` says where every distinct drawing landed, `anims`
 * says how long each frame is held and which grid it plays from, and
 * `sprites` says which frames belong to a clip. The frames themselves
 * are in `frames.bin`, deduplicated: a pose held for ten frames is one
 * record that ten frames point at.
 *
 * The part no other layout has is the **anchor points**, for where the
 * parts of the pokemon are: the shadow, the body, the head and both
 * hands, in the frame box's own pixels. They come from the
 * collection's `-Offsets` images, and they are what a canvas needs to
 * place a pokemon rather than guess at it. The shadow marker is the
 * point that sits on the ground, so a sprite whose shadow lands on a
 * cell is standing on that cell however much empty frame there is
 * under its feet.
 *
 * An anchor can fall **outside** the frame, and a few hundred do:
 * frames are cropped to what is drawn, and a flying pokemon's shadow
 * is on the ground below everything drawn. Nothing clamps them.
 *
 * The two halves disagree about how big a frame is, on purpose.
 * `anims` is faithful to the `AnimData.xml` it came from and names the
 * cell the artist drew in; `sprites` names what is on the sheet, which
 * has been trimmed to the pixels that are lit. `sprites` is the half
 * to draw from, and `trim` says where that frame sat in the authored
 * cell for anything that needs the original box back.
 *
 * This module is the contract and nothing else: no canvas, no
 * playhead, no drawing. [`SpeciesSpriteAnimation`](./species-sprite-animation.ts)
 * is what plays it.
 */

/**
 * How many frames of a drawn animation go by in a second.
 *
 * **Every sheet in the game is 24fps** — pokemon, effects, overworld
 * characters alike — so a duration counted in ticks means the same
 * thing wherever it is read. They are hand-drawn clips of a few
 * frames: run at the sixty a second the battle ticks at, they flicker
 * rather than move.
 *
 * It is the speed a clip plays at when nobody has asked for a length.
 * Anything fitted to a window, a thrown move ending as its hit lands,
 * is stretched from here rather than counted in it
 */
export const SPRITE_FPS = 24;

/** How long one tick of a frame's duration lasts, in milliseconds. */
export const SPRITE_TICK = 1000 / SPRITE_FPS;

export type SpriteDirection =
  | 'Down'
  | 'DownRight'
  | 'Right'
  | 'UpRight'
  | 'Up'
  | 'UpLeft'
  | 'Left'
  | 'DownLeft';

/**
 * The eight, in the order the sheets lay them out — which is also the
 * order they turn in, an eighth of a turn at a time. A caller working
 * out which way something faces after the camera has moved counts in
 * these
 */
export const SPRITE_DIRECTIONS: SpriteDirection[] = [
  'Down',
  'DownRight',
  'Right',
  'UpRight',
  'Up',
  'UpLeft',
  'Left',
  'DownLeft',
];

/**
 * Which of the eight a screen direction points at.
 *
 * The list runs clockwise from `Down`, and the screen counts down the
 * page, so an eighth of a turn along the list is an eighth of a turn
 * anticlockwise in the ordinary sense
 */
export function directionOf(dx: number, dy: number): SpriteDirection {
  if (dx === 0 && dy === 0) {
    return 'Down';
  }
  const eighths = Math.round((Math.PI / 2 - Math.atan2(dy, dx)) / (Math.PI / 4));

  return SPRITE_DIRECTIONS[((eighths % 8) + 8) % 8];
}

/**
 * Which frame shows this thing as the light sees it.
 *
 * A shadow is the silhouette from where the light stands, so which
 * pose is laid down is not the shadow's own bearing: it is the angle
 * between the way the thing faces and the way the light is. A sheet's
 * frames are that angle already — the one named `Down` is the thing
 * looking at the camera — so the frame wanted is the facing turned by
 * however far the light is off the camera.
 *
 * `thrown` is the way the shadow falls, which is away from the light.
 * Something looking straight at the light lays its front down; the
 * same thing with the light off its left lays its right down
 */
export function litFrame(facing: SpriteDirection, thrown: SpriteDirection): SpriteDirection {
  const faced = SPRITE_DIRECTIONS.indexOf(facing);
  const away = SPRITE_DIRECTIONS.indexOf(thrown);

  if (faced < 0 || away < 0) {
    return facing;
  }
  // Half a turn from where the shadow falls is where the light is
  const half = SPRITE_DIRECTIONS.length / 2;

  return SPRITE_DIRECTIONS[
    (((faced - away - half) % SPRITE_DIRECTIONS.length) + SPRITE_DIRECTIONS.length) %
      SPRITE_DIRECTIONS.length
  ];
}

/** A position, as `[x, y]`. */
export type Point = [x: number, y: number];

/** A rectangle of the sheet, measured from wherever it is placed. */
export interface SheetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SheetData {
  width: number;
  height: number;
  /**
   * Every distinct picture on the sheet, for the whole pokemon rather
   * than for one clip. A frame names one of these by its position here
   */
  pictures: SheetRect[];
}

export interface AnimData {
  /** Which animation this is. */
  name: SpriteAnim;
  /** Animation id from `AnimData.xml`. */
  index: number;
  /**
   * Per-frame duration, in game ticks. Length equals the target's
   * `columns`
   */
  durations: number[];
  /**
   * Animation image the frames come from. Equals `name` unless the
   * anim is a copy of another — a Strike is drawn from the Attack grid
   */
  target: SpriteAnim;
}

/**
 * Which part of a pokemon an anchor marks.
 *
 * `left` and `right` are the archive's own names for its red and its
 * blue mark. Red is the one on the left of a frame that faces the
 * camera, which is the pokemon's own right hand: the names are the
 * screen's
 */
export type SpriteAnchor = 'shadow' | 'center' | 'head' | 'left' | 'right';

/**
 * One frame: which picture it draws, where in its box, and where the
 * parts of the pokemon are while it is showing.
 *
 * Every anchor is in the frame box's own pixels and may be missing:
 * two markers landing on one pixel leaves whichever was painted last,
 * and not every pokemon has hands to mark. `null` is a real answer
 * here rather than a broken file, and the caller decides what to do
 * about it
 */
export interface SpriteFrameData {
  shadow: Point | null;
  center: Point | null;
  head: Point | null;
  left: Point | null;
  right: Point | null;
  /**
   * Which packed picture this frame draws, as an index into
   * `sheet.pictures`.
   *
   * Half of a sheet is the same picture twice, a pose held for ten
   * frames or a left-facing row that is the right-facing one mirrored,
   * so the pictures are packed once and the frames point at them
   */
  cell: number;
  /** Whether that picture is drawn mirrored about its own axis. */
  flip: boolean;
  /** Where that picture's corner sits inside the frame's box. */
  at: Point;
}

export interface SpriteTargetData {
  /** Frame size in the packed sheet, after trimming. */
  frameWidth: number;
  frameHeight: number;
  /** Frame size before trimming, as authored in `AnimData.xml`. */
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  /** Where the trimmed frame sits inside the source cell. */
  trim: Point;
  /** Frames per orientation. */
  columns: number;
  /**
   * Orientations, which are the first `rows` of `SPRITE_DIRECTIONS`.
   * A sleeping pokemon faces nowhere and has one
   */
  rows: number;
  /**
   * Row-major, `rows * columns` entries. The frame for a given
   * orientation and frame index sits at `direction * columns + frame`
   */
  frames: SpriteFrameData[];
}

export interface SpriteSheetJSON {
  /** Which shape the file was written in. */
  version: number;
  /** Which drawings of this pokemon the folder holds. */
  coats: Coat[];
  /** Small, ordinary or large, as the archive graded it. */
  shadowSize: number;
  sheet: SheetData;
  /** Faithful to `AnimData.xml`: frame sizes here are untrimmed. */
  anims: AnimData[];
  /** Reach an entry through `anims[].target`. */
  sprites: Partial<Record<SpriteAnim, SpriteTargetData>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asPoint(value: unknown): Point | null {
  const pair = asArray(value);

  return pair.length >= 2 ? [asNumber(pair[0]), asNumber(pair[1])] : null;
}

const COAT_NAMES = new Set<string>(['regular', 'shiny', 'female', 'shinyFemale']);

function asCoats(value: unknown): Coat[] {
  return asArray(value).filter(
    (coat): coat is Coat => typeof coat === 'string' && COAT_NAMES.has(coat),
  );
}

/**
 * `frames.bin`: a header, then one deflated block holding the frame
 * records and the stream of indices pointing at them.
 *
 * The table is **column-major**, so column `c` of record `r` sits at
 * `table[c * records + r]`. Fourteen columns, in this order
 */
const COLUMN_SHADOW = 0;
const COLUMN_CENTER = 2;
const COLUMN_HEAD = 4;
const COLUMN_LEFT = 6;
const COLUMN_RIGHT = 8;
const COLUMN_CELL = 10;
const COLUMN_FLIP = 11;
const COLUMN_AT = 12;
const COLUMNS = 14;

/** An anchor that was never painted, in both of its slots. */
const ABSENT = -32768;

/** Bytes of header before the deflated block. */
const HEADER = 12;

/** What this reader knows how to read. */
const FRAMES_VERSION = 2;

/** The frames of one pokemon, and the stream that points at them. */
export interface FrameTable {
  records: SpriteFrameData[];
  indices: Uint16Array;
}

const NO_FRAMES: FrameTable = { records: [], indices: new Uint16Array(0) };

/**
 * Inflates the deflated half of `frames.bin`.
 *
 * `DecompressionStream` is the platform's own inflate and costs
 * nothing to ship, but it is recent: Safari before 16.4 and Firefox
 * before 113 have no inflate at all. Those load `fflate` instead, and
 * they load it **only then** — the import is dynamic, so a browser
 * with the built-in never fetches the chunk
 */
async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  // Copied into a buffer of its own: what arrives is usually a view
  // over a larger one, which is neither a Blob part nor safe for
  // `fflate` to hold on to
  const held = new Uint8Array(bytes);

  if (typeof DecompressionStream === 'undefined') {
    const { unzlibSync } = await import('fflate');

    return unzlibSync(held);
  }
  const stream = new Blob([held]).stream().pipeThrough(new DecompressionStream('deflate'));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function pointAt(table: Int16Array, records: number, record: number, column: number): Point | null {
  const x = table[column * records + record];
  const y = table[(column + 1) * records + record];

  return x === ABSENT || y === ABSENT ? null : [x, y];
}

/**
 * Reads `frames.bin`.
 *
 * The records are read into objects once and shared: a clip's frames
 * are references into this array, so ten frames holding one pose are
 * ten pointers rather than ten copies. Anything that does not parse
 * reads as no frames at all, which draws nothing rather than drawing a
 * slice of whatever happens to sit at those coordinates
 */
export async function readFrameTable(bytes: Uint8Array): Promise<FrameTable> {
  if (bytes.length < HEADER) {
    return NO_FRAMES;
  }
  const head = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);

  if (magic !== 'PMDF' || head.getUint16(4, true) !== FRAMES_VERSION) {
    return NO_FRAMES;
  }
  const records = head.getUint16(6, true);
  const count = head.getUint32(8, true);
  let body: Uint8Array;

  try {
    body = await inflate(bytes.subarray(HEADER));
  } catch {
    return NO_FRAMES;
  }
  const tableBytes = records * COLUMNS * 2;

  if (body.length < tableBytes + count * 2) {
    return NO_FRAMES;
  }
  // Copied rather than viewed in place: what comes out of the
  // decompressor is not promised to be two-byte aligned
  const table = new Int16Array(body.buffer.slice(body.byteOffset, body.byteOffset + tableBytes));
  const indices = new Uint16Array(
    body.buffer.slice(body.byteOffset + tableBytes, body.byteOffset + tableBytes + count * 2),
  );
  const frames: SpriteFrameData[] = [];

  for (let record = 0; record < records; record += 1) {
    frames.push({
      shadow: pointAt(table, records, record, COLUMN_SHADOW),
      center: pointAt(table, records, record, COLUMN_CENTER),
      head: pointAt(table, records, record, COLUMN_HEAD),
      left: pointAt(table, records, record, COLUMN_LEFT),
      right: pointAt(table, records, record, COLUMN_RIGHT),
      cell: table[COLUMN_CELL * records + record],
      flip: table[COLUMN_FLIP * records + record] === 1,
      at: [table[COLUMN_AT * records + record], table[(COLUMN_AT + 1) * records + record]],
    });
  }
  return { records: frames, indices };
}

/**
 * A fetched `sheet.json` and its `frames.bin`, read into the shape
 * this game draws from.
 *
 * The files are assets rather than input, but they are still arriving
 * over the wire: a description with a missing field should draw
 * nothing rather than throw somewhere inside a draw call sixty times a
 * second
 */
export default function asSpriteSheetJSON(value: unknown, table: FrameTable): SpriteSheetJSON {
  const root = asRecord(value);
  const sheet = asRecord(root.sheet);
  const sprites: Partial<Record<SpriteAnim, SpriteTargetData>> = {};

  for (const entry of asArray(root.sprites)) {
    const target = asRecord(entry);
    const name = asSpriteAnim(asNumber(target.anim));

    // An animation this game has no number for is one it could not ask
    // to play, so there is nothing to keep
    if (name == null) {
      continue;
    }
    const frameWidth = asNumber(target.frameWidth);
    const frameHeight = asNumber(target.frameHeight);
    const span = asArray(target.frames);
    const from = asNumber(span[0]);
    const count = asNumber(span[1]);
    const frames: SpriteFrameData[] = [];

    for (let at = from; at < from + count; at += 1) {
      // A span that runs off the end of the stream describes frames
      // that are not there, which is a file this reader will not
      // invent pixels for
      const frame = at < table.indices.length ? table.records[table.indices[at]] : undefined;

      if (frame != null) {
        frames.push(frame);
      }
    }

    sprites[name] = {
      frameWidth,
      frameHeight,
      sourceFrameWidth: asNumber(target.sourceFrameWidth) || frameWidth,
      sourceFrameHeight: asNumber(target.sourceFrameHeight) || frameHeight,
      trim: asPoint(target.trim) ?? [0, 0],
      columns: asNumber(target.columns),
      rows: asNumber(target.rows),
      frames,
    };
  }

  return {
    version: asNumber(root.version),
    coats: asCoats(root.coats),
    shadowSize: asNumber(root.shadowSize),
    sheet: {
      width: asNumber(sheet.width),
      height: asNumber(sheet.height),
      pictures: asArray(sheet.pictures).map((entry) => {
        const rect = asArray(entry);

        return {
          x: asNumber(rect[0]),
          y: asNumber(rect[1]),
          width: asNumber(rect[2]),
          height: asNumber(rect[3]),
        };
      }),
    },
    anims: asArray(root.anims)
      .map((entry) => {
        const anim = asRecord(entry);
        const name = asSpriteAnim(asNumber(anim.anim));

        return {
          name,
          index: asNumber(anim.index),
          durations: asArray(anim.durations).map(asNumber),
          // An anim with no target of its own plays from the grid
          // named after it, which is how a file leaves the two out
          // where they agree
          target: anim.target == null ? name : asSpriteAnim(asNumber(anim.target)),
        };
      })
      .filter((anim): anim is AnimData => anim.name != null && anim.target != null),
    sprites,
  };
}
