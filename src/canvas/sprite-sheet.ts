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
 * is packed, so `sheet.images` says where each animation's grid landed
 * on it, `anims.anims` says how long each frame is held and which grid
 * it plays from, and `sprites` carries the part no other layout has —
 * **anchor points**, per frame, for where the parts of the pokemon are.
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
 * The anchors come from the collection's `offset.png`, which paints one
 * pixel per part on a copy of the sheet. They are what a canvas needs
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

/** A position, as `[x, y]`. */
export type Point = [x: number, y: number];

/** Placement of one animation image inside the packed sheet. */
export interface SheetImageData {
  /**
   * Animation image name, e.g. `"Attack"`. Matches a key of
   * `SpriteSheetJSON['sprites']`
   */
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SheetData {
  width: number;
  height: number;
  images: SheetImageData[];
}

export interface AnimData {
  /** Animation name, e.g. `"Strike"`. */
  name: string;
  frameWidth: number;
  frameHeight: number;
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
  target: string;
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

/** Anchors of a single frame, relative to that frame's top-left corner. */
export interface SpriteFrameData {
  /** Shadow center. */
  shadow: Point | null;
  /** Body center. */
  center: Point | null;
  head: Point | null;
  left: Point | null;
  right: Point | null;
  /**
   * Which packed picture this frame is drawn from, as an index into
   * the clip's `cells` grid.
   *
   * Half of a sheet is the same picture twice — a pose held for ten
   * frames, a left-facing row that is the right-facing one mirrored —
   * so the pictures are packed once and the frames point at them. A
   * sheet packed before that says nothing here, and its frames are its
   * pictures: see `cells`
   */
  cell: number | null;
  /** Whether that picture is drawn mirrored to make this frame. */
  flip: boolean;
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
  /** Orientations, in `directions` order. */
  rows: number;
  directions: SpriteDirection[];
  /**
   * Row-major, `rows * columns` entries. The frame for a given
   * orientation and frame index sits at `direction * columns + frame`
   */
  frames: SpriteFrameData[];
  /**
   * How the distinct pictures are laid out in the sheet, for a clip
   * whose repeats were packed once.
   *
   * Nothing here means the old arrangement, where the region is the
   * grid itself: `rows` orientations down and `columns` frames across,
   * every frame drawn even where it repeats one beside it
   */
  cells: { columns: number; rows: number } | null;
}

export interface SpriteSheetJSON {
  /** Whether frames were trimmed to their content before packing. */
  compact: boolean;
  sheet: SheetData;
  /**
   * Faithful to `AnimData.xml` — frame sizes here are always untrimmed
   */
  anims: SanitizedAnimData;
  /**
   * Keyed by animation image name — reach an entry through
   * `anims.anims[].target`
   */
  sprites: Record<string, SpriteTargetData>;
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

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
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

/** The grid of distinct pictures, or nothing where a clip has none. */
function asCells(value: unknown): { columns: number; rows: number } | null {
  if (typeof value !== 'object' || value == null) {
    return null;
  }
  const held = asRecord(value);
  const columns = asNumber(held.columns);
  const rows = asNumber(held.rows);

  return columns > 0 && rows > 0 ? { columns, rows } : null;
}

function asDirections(value: unknown): SpriteDirection[] {
  const known = new Set<string>(SPRITE_DIRECTIONS);

  return asArray(value)
    .map(asString)
    .filter((name): name is SpriteDirection => known.has(name));
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

  for (const [name, entry] of Object.entries(asRecord(root.sprites))) {
    const target = asRecord(entry);
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
      directions: asDirections(target.directions),
      frames: asArray(target.frames).map((frame) => {
        const anchors = asRecord(frame);
        const cell = anchors.cell;

        return {
          shadow: asPoint(anchors.shadow),
          center: asPoint(anchors.center),
          head: asPoint(anchors.head),
          left: asPoint(anchors.left),
          right: asPoint(anchors.right),
          cell: typeof cell === 'number' ? cell : null,
          flip: anchors.flip === true,
        };
      }),
      cells: asCells(target.cells),
    };
  }

  return {
    compact: root.compact === true,
    sheet: {
      width: asNumber(sheet.width),
      height: asNumber(sheet.height),
      images: asArray(sheet.images).map((entry) => {
        const image = asRecord(entry);

        return {
          name: asString(image.name),
          x: asNumber(image.x),
          y: asNumber(image.y),
          width: asNumber(image.width),
          height: asNumber(image.height),
        };
      }),
    },
    anims: {
      shadowSize: asNumber(anims.shadowSize),
      anims: asArray(anims.anims).map((entry) => {
        const anim = asRecord(entry);
        const name = asString(anim.name);
        const target = asString(anim.target);

        return {
          name,
          frameWidth: asNumber(anim.frameWidth),
          frameHeight: asNumber(anim.frameHeight),
          index: asNumber(anim.index),
          durations: asArray(anim.durations).map(asNumber),
          // An anim with no target of its own plays from the grid
          // named after it
          target: target === '' ? name : target,
        };
      }),
    },
    sprites,
  };
}
