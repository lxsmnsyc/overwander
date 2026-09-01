import type { SpriteAnim } from '../data/ids/sprite-anims';
import { asSpriteAnim } from '../data/ids/sprite-anims';

/**
 * What a pokemon's sprite metadata says, and how to read it safely.
 *
 * A pokemon ships as three files: a drawing per coat —
 * `regular/{species}.png` and `shiny/{species}.png` — and one
 * description of the animation they share, `meta/{species}.json`. The
 * description used to sit beside each drawing, which meant two
 * byte-identical copies of it per pokemon and two things to keep in
 * step; a shiny is the same animation in different colours, so there
 * is one copy of it now and the coat folders hold nothing but pictures.
 *
 * The description is the sprite collection's own, sanitised: the sheet
 * is packed, so `sheet.pictures` says where every distinct drawing
 * landed on it, `anims.anims` says how long each frame is held and
 * which clip it plays from, and `sprites` says which picture each frame
 * draws and where it hangs.
 *
 * The part no other layout has is the **anchor points**, for where the
 * parts of the pokemon are. All but the shadow live on the picture: a
 * pose packed once and played by nine frames has its head in the same
 * place in all nine, and writing them per frame wrote them nine times.
 * `marksOf` is what puts them back on a frame. The shadow stays on the
 * frame, because a pokemon at the top of a hop is drawn the same as one
 * on the ground and its shadow is not in the same place.
 *
 * The two halves disagree about how big a frame is, on purpose.
 * `anims.anims` is faithful to the `AnimData.xml` it came from and
 * names the cell the artist drew in; `sprites` names what is actually
 * on the sheet, which on a `compact` sheet has been **trimmed** to the
 * pixels that are lit and packed at that size. `sprites` is the half to
 * draw from: its `frameWidth`, `frameHeight` and anchors are all in the
 * trimmed frame's own coordinates, and `trim` says where that frame sat
 * in the authored cell for anything that needs the original box back.
 * An untrimmed sheet is the same shape with a trim of nothing, so
 * nothing downstream has to ask which kind it has.
 *
 * An anchor can fall **outside** the trimmed frame, and a few hundred
 * of them do: trimming crops to what is drawn, and a flying pokemon's
 * shadow is on the ground below everything drawn. They are still inside
 * the authored cell, and a point below a frame is a perfectly good
 * point to hang a sprite from — so nothing clamps them.
 *
 * The anchors come from the collection's `-Offsets` image, which paints
 * one pixel per part on a copy of the sheet: black the head, green the
 * body, red and blue the hands. They are what a canvas needs
 * to place a pokemon rather than guess at it: the shadow marker is the
 * point that sits on the ground, so a sprite whose shadow lands on a
 * cell is standing on that cell however much empty frame there is
 * under its feet. That empty band used to be measured in the browser
 * by drawing a frame into a scratch canvas and reading the pixels
 * back, which Safari and Firefox both refuse when their fingerprinting
 * protections are on — and which was a guess even when it worked,
 * since a whisker hanging below the body is not what a pokemon stands
 * on.
 *
 * This module is the contract and nothing else: no canvas, no
 * playhead, no drawing. [`SpeciesSpriteAnimation`](./species-sprite-animation.ts)
 * is what plays it.
 */

/**
 * Row order of PMD sprite sheets: one row per orientation, `Down`
 * first, rotating counter-clockwise
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
 * Anything fitted to a window — a thrown move ending as its hit lands
 * — is stretched from here rather than counted in it
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

/**
 * The four marks an `-Offsets` image paints, wherever they are being
 * measured from.
 *
 * `left` and `right` are the archive's own names for its red and its
 * blue mark. Red is the one on the left of a frame that faces the
 * camera, which is the pokemon's own right hand: the names are the
 * screen's
 */
export interface SpriteMarks {
  /** Body centre. */
  center: Point | null;
  head: Point | null;
  left: Point | null;
  right: Point | null;
}

/** A picture on the sheet, and where the parts of it are. */
export interface SheetPicture extends SheetRect {
  /**
   * The marks, in the picture's own pixels.
   *
   * They belong to the picture rather than to the frame that draws it:
   * a pose packed once and drawn by nine frames has its head in the
   * same place in all nine
   */
  marks: SpriteMarks;
}

export interface SheetData {
  width: number;
  height: number;
  /**
   * Every distinct picture on the sheet, for the whole pokemon rather
   * than for one clip. A frame names one of these by its position here
   */
  pictures: SheetPicture[];
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
   * anim is a `CopyOf` — a Strike is drawn from the Attack grid
   */
  target: SpriteAnim;
}

export interface SanitizedAnimData {
  shadowSize: number;
  anims: AnimData[];
}

/**
 * Which part of a pokemon an anchor marks.
 *
 * `left` and `right` are the **pokemon's**, so on a frame facing the
 * camera the left hand is the one on the right of the picture
 */
export type SpriteAnchor = 'shadow' | 'center' | 'head' | 'left' | 'right';

/** One frame: which picture it draws, where, and where its shadow is. */
export interface SpriteFrameData {
  /**
   * Shadow centre, in the frame's own pixels.
   *
   * The one mark that is the frame's rather than the picture's: a
   * pokemon at the top of a hop is drawn the same as one on the ground
   * and its shadow is not in the same place
   */
  shadow: Point | null;
  /**
   * Which packed picture this frame is drawn from, as an index into
   * `sheet.pictures`.
   *
   * Half of a sheet is the same picture twice, a pose held for ten
   * frames or a left-facing row that is the right-facing one mirrored,
   * so the pictures are packed once and the frames point at them
   */
  cell: number | null;
  /** Whether that picture is drawn mirrored to make this frame. */
  flip: boolean;
  /**
   * Where that picture's corner sits inside the frame's box, as
   * `[x, y]`.
   *
   * Pictures are cropped to what is drawn in them and a clip's box is
   * as wide as its widest reach, so a frame is a small picture hung
   * somewhere in a large box. Nothing here means the picture fills the
   * box, which is what an untrimmed sheet has
   */
  at: Point | null;
  /**
   * Marks for this frame alone, in the picture's pixels, where they
   * differ from the picture's own. Roughly one frame in a hundred and
   * fifty: two poses can pack to one picture without agreeing on where
   * the hands are
   */
  marks: SpriteMarks | null;
}

export interface SpriteTargetData {
  /** Frame size in the packed sheet, after trimming. */
  frameWidth: number;
  frameHeight: number;
  /** Frame size before trimming, as authored in `AnimData.xml`. */
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  /**
   * Where the trimmed frame sits inside the source cell. `[0, 0]` with a
   * frame size equal to the source size means this image was left
   * untrimmed
   */
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
  /**
   * Which shape the file was written in. 1 wrote every mark on every
   * frame; 2 writes them on the picture. Anything a reader does not
   * know is read as the newest it does
   */
  version: number;
  sheet: SheetData;
  /**
   * Faithful to `AnimData.xml` — frame sizes here are always untrimmed
   */
  anims: SanitizedAnimData;
  /** Reach an entry through `anims.anims[].target` */
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

/**
 * An anchor, or nothing. A marker can be missing: two of them landing
 * on one pixel leaves whichever was painted last, and not every
 * pokemon has hands to mark — so `null` is a real answer here rather
 * than a broken file, and the caller decides what to do about it
 */
function asPoint(value: unknown): Point | null {
  const pair = asArray(value);

  return pair.length >= 2 ? [asNumber(pair[0]), asNumber(pair[1])] : null;
}

/**
 * Where each part of a picture sits in the array a description writes
 * it as: the rectangle first, then the marks. The names are worth
 * nothing in a file that repeats them thousands of times, so the order
 * **is** the contract, and a new part may only ever be appended
 */
const PICTURE_X = 0;
const PICTURE_Y = 1;
const PICTURE_WIDTH = 2;
const PICTURE_HEIGHT = 3;
const PICTURE_MARKS = 4;

/** The same for a frame. */
const FRAME_SHADOW = 0;
const FRAME_CELL = 1;
const FRAME_FLIP = 2;
const FRAME_AT = 3;
const FRAME_MARKS = 4;

/** And for a frame of a version 1 file, which wrote its own marks. */
const OLD_SHADOW = 0;
const OLD_CENTER = 1;
const OLD_HEAD = 2;
const OLD_LEFT = 3;
const OLD_RIGHT = 4;
const OLD_CELL = 5;
const OLD_FLIP = 6;
const OLD_AT = 7;

/** Marks in the order they are written, or nothing where none are. */
function asMarks(value: unknown): SpriteMarks | null {
  const held = asArray(value);

  if (held.length === 0) {
    return null;
  }
  return {
    center: asPoint(held[0]),
    head: asPoint(held[1]),
    left: asPoint(held[2]),
    right: asPoint(held[3]),
  };
}

const NO_MARKS: SpriteMarks = { center: null, head: null, left: null, right: null };

/** A picture, and the marks written beside it. */
function asPictures(value: unknown): SheetPicture[] {
  return asArray(value).map((entry) => {
    const rect = asArray(entry);

    return {
      x: asNumber(rect[PICTURE_X]),
      y: asNumber(rect[PICTURE_Y]),
      width: asNumber(rect[PICTURE_WIDTH]),
      height: asNumber(rect[PICTURE_HEIGHT]),
      marks: asMarks(rect[PICTURE_MARKS]) ?? NO_MARKS,
    };
  });
}

function asCell(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function asFrame(value: unknown): SpriteFrameData {
  const held = asArray(value);

  return {
    shadow: asPoint(held[FRAME_SHADOW]),
    cell: asCell(held[FRAME_CELL]),
    flip: held[FRAME_FLIP] === 1,
    at: asPoint(held[FRAME_AT]),
    marks: asMarks(held[FRAME_MARKS]),
  };
}

/**
 * A version 1 frame, which wrote its own marks in its own box.
 *
 * They are moved into the picture's pixels on the way in, so that one
 * meaning of a mark reaches the game however old the file is: a reader
 * that kept both meanings would push the difference into every caller
 */
function asOldFrame(value: unknown, pictures: SheetPicture[]): SpriteFrameData {
  const held = asArray(value);
  const cell = asCell(held[OLD_CELL]);
  const flip = held[OLD_FLIP] === 1;
  const at = asPoint(held[OLD_AT]);
  const width = cell == null ? 0 : (pictures[cell]?.width ?? 0);
  const back = (point: Point | null): Point | null => {
    if (point == null) {
      return null;
    }
    const x = point[0] - (at?.[0] ?? 0);

    return [flip ? width - 1 - x : x, point[1] - (at?.[1] ?? 0)];
  };

  return {
    shadow: asPoint(held[OLD_SHADOW]),
    cell,
    flip,
    at,
    marks: {
      center: back(asPoint(held[OLD_CENTER])),
      head: back(asPoint(held[OLD_HEAD])),
      left: back(asPoint(held[OLD_LEFT])),
      right: back(asPoint(held[OLD_RIGHT])),
    },
  };
}

/**
 * Where the parts of one frame are, in that frame's own pixels.
 *
 * The marks are kept on the picture, so this is where they are put
 * back: mirrored when the frame draws that picture reflected, then
 * moved to wherever the picture hangs in the frame's box
 */
export function marksOf(sheet: SheetData, frame: SpriteFrameData): SpriteMarks {
  const picture = frame.cell == null ? undefined : sheet.pictures[frame.cell];
  const marks = frame.marks ?? picture?.marks ?? NO_MARKS;
  const width = picture?.width ?? 0;
  const across = frame.at?.[0] ?? 0;
  const down = frame.at?.[1] ?? 0;
  const place = (point: Point | null): Point | null =>
    point == null
      ? null
      : [(frame.flip ? width - 1 - point[0] : point[0]) + across, point[1] + down];

  return {
    center: place(marks.center),
    head: place(marks.head),
    left: place(marks.left),
    right: place(marks.right),
  };
}

/**
 * A fetched `meta/{species}.json`, read into the shape this game
 * expects.
 *
 * The files are assets rather than input, but they are still JSON
 * arriving over the wire: a description with a missing field should
 * draw nothing rather than throw somewhere inside a draw call sixty
 * times a second
 */
export default function asSpriteSheetJSON(value: unknown): SpriteSheetJSON {
  const root = asRecord(value);
  const sheet = asRecord(root.sheet);
  const anims = asRecord(root.anims);
  const sprites: Record<string, SpriteTargetData> = {};
  // A file with no version at all is the shape that shipped before
  // there were versions
  const version = asNumber(root.version) || 1;
  const pictures = asPictures(sheet.pictures);

  for (const [key, entry] of Object.entries(asRecord(root.sprites))) {
    const name = asSpriteAnim(Number.parseInt(key, 10));
    const target = asRecord(entry);

    // An animation this game has no number for is one it could not ask
    // to play, so there is nothing to keep
    if (name == null) {
      continue;
    }
    const frameWidth = asNumber(target.frameWidth);
    const frameHeight = asNumber(target.frameHeight);

    sprites[name] = {
      frameWidth,
      frameHeight,
      // A description written before the packer learned to trim says
      // nothing about a source cell, and its frames *are* the source
      // cells — so an untrimmed sheet reads as a trim of nothing, and
      // everything downstream has one case to handle instead of two
      sourceFrameWidth: asNumber(target.sourceFrameWidth) || frameWidth,
      sourceFrameHeight: asNumber(target.sourceFrameHeight) || frameHeight,
      trim: asPoint(target.trim) ?? [0, 0],
      columns: asNumber(target.columns),
      rows: asNumber(target.rows),
      frames: asArray(target.frames).map((frame) =>
        version >= 2 ? asFrame(frame) : asOldFrame(frame, pictures),
      ),
    };
  }

  return {
    version,
    sheet: {
      width: asNumber(sheet.width),
      height: asNumber(sheet.height),
      pictures,
    },
    anims: {
      shadowSize: asNumber(anims.shadowSize),
      anims: asArray(anims.anims)
        .map((entry) => {
          const anim = asRecord(entry);
          const name = asSpriteAnim(asNumber(anim.name));

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
    },
    sprites,
  };
}
