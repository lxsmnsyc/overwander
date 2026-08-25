/**
 * A person walking around the overworld.
 *
 * [`SpeciesSpriteAnimation`](./species-sprite-animation.ts) plays a PMD
 * sheet: eight facings, a dozen named clips, per-frame durations, and
 * an anchor for every part of every frame. A character sheet is none of
 * that. It is one grid — four walk frames across, four facings down,
 * every cell the same size — and there is exactly one thing it can do,
 * which is walk. Played through the species class, almost all of that
 * machinery is dead weight: a clip map with one clip in it, a duration
 * table of four identical numbers, an anchor lookup that finds nothing
 * because a charset has no anchors to find, and a facing lookup that
 * quietly draws every diagonal as `Down` because the grid has four rows
 * and `indexOf` misses the other four.
 *
 * So this is the other class. It carries the same
 * [`BasicSpriteData`](./basic-sprite.ts) an item sheet does — a
 * `data.json` naming sub-images and an `image.png` holding them, which
 * is what the packing tool emits — and reads a grid out of it. Frame
 * rectangles are worked out once at construction and indexed with
 * arithmetic, so drawing is a `drawImage` and nothing else: no map
 * lookup, no clip resolution, no allocation per frame.
 *
 * Two things it does that the species class cannot:
 *
 * - **Diagonals snap to a cardinal.** A four-row grid genuinely has no
 *   picture of somebody walking north-east, and the honest answer is
 *   the nearer of north and east rather than the first row in the file.
 * - **The playhead can be driven by distance.** A walk cycle advanced
 *   on a clock slides its feet whenever the walker's speed is not the
 *   speed the artist drew for; advanced by how far the walker actually
 *   moved, a foot lands every stride however fast it is going.
 */

import { type BasicSpriteData, asBasicSpriteData } from './basic-sprite';
import { SPRITE_TICK, type SpriteDirection } from './sprite-sheet';

/** The four a character sheet has, in the order sheets lay them out. */
const CARDINALS: SpriteDirection[] = ['Down', 'Left', 'Right', 'Up'];

/**
 * The cardinal each of the eight facings is drawn as.
 *
 * A diagonal has no row of its own, so it borrows one. Which one it
 * borrows is a choice: the sideways poses read as movement far better
 * than the front and back ones do — a walk seen from the side has legs
 * in it — so a diagonal shows its east or west half rather than its
 * north or south half
 */
const SNAP: Record<SpriteDirection, SpriteDirection> = {
  Down: 'Down',
  DownRight: 'Right',
  Right: 'Right',
  UpRight: 'Right',
  Up: 'Up',
  UpLeft: 'Left',
  Left: 'Left',
  DownLeft: 'Left',
};

/**
 * How long one walk frame is held, in milliseconds, when the playhead
 * runs on a clock. Three ticks a frame is a four-frame cycle in half a
 * second, which is a walk rather than a scurry
 */
const WALK_HOLD = SPRITE_TICK * 3;

/**
 * How far the walker moves, in world pixels, between one frame and the
 * next when the playhead runs on distance. One cell of a 32px sheet is
 * four strides, so a character crossing a tile takes a full cycle
 */
const STRIDE = 8;

/** A cell of the grid, in sheet pixels. */
interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OWCharLayout {
  /** Walk frames across. */
  columns?: number;
  /** Facings down, and how many of `directions` are really there. */
  rows?: number;
  /** Row order, top to bottom. */
  directions?: SpriteDirection[];
  /**
   * Which frame is the standing pose. It is the one shown whenever the
   * character is still, and on most sheets it is the first column
   */
  standFrame?: number;
  /**
   * The order the walk frames play in. Left out, they play across the
   * row — which is the cycle on a sheet whose middle column is a second
   * standing pose, and the whole cycle on one whose columns are four
   * distinct steps
   */
  cycle?: number[];
  /** Milliseconds one frame is held when advancing on a clock. */
  hold?: number;
  /** World pixels between frames when advancing on distance. */
  stride?: number;
  /**
   * The sub-image the grid was packed as, when the sheet is one
   * picture rather than sixteen. Left out, the largest sub-image is
   * taken to be the grid, which is what a sheet with one entry in it
   * always has
   */
  grid?: string;
  /**
   * The cell the frames were cut from, before the crop took the margin
   * off. It is what a caller scales by when several charsets have to
   * come out the same height: the crop is each sheet's own business and
   * the cell it was drawn in is the one thing they share
   */
  sourceFrameWidth?: number;
  sourceFrameHeight?: number;
}

export interface OWCharDrawOptions {
  /** How much bigger to draw it than the sheet has it. */
  scale?: number;
  /**
   * The box to fit a cell in, in pixels. Answered as the scale that
   * fits, so a caller with a tile to fill does not have to know how big
   * the sheet's cells are
   */
  size?: number;
  /**
   * Where the point given to `draw` sits on the cell. `foot` is the
   * bottom middle, which is where a character standing on a tile has
   * their feet, and is what an overworld caller almost always means
   */
  anchor?: 'foot' | 'center' | 'top-left';
  alpha?: number;
  /** Drawn flat under the character before the character is. */
  shadow?: boolean;
}

const SHADOW_WIDTH = 0.44;

const SHADOW_FLATNESS = 0.4;

const SHADOW_COLOR = 'rgba(0, 0, 0, 0.28)';

function bareName(name: string): string {
  return name.endsWith('.png') ? name.slice(0, -'.png'.length) : name;
}

/**
 * The grid the frames are cut from.
 *
 * A tool that packs one charset gives one sub-image and a tool that
 * packs a folder of them gives several, so the grid is asked for by
 * name when the caller knows it and taken as the biggest sub-image when
 * it does not. The biggest is the right guess: a charset packed whole
 * is sixteen cells and anything else on the sheet beside it is one
 */
function gridOf(data: BasicSpriteData, name: string | undefined): FrameRect | null {
  let best: FrameRect | null = null;

  for (const image of data.images) {
    if (image.width <= 0 || image.height <= 0) {
      continue;
    }
    if (name != null) {
      if (bareName(image.name) === bareName(name)) {
        return image;
      }
      continue;
    }
    if (best == null || image.width * image.height > best.width * best.height) {
      best = image;
    }
  }
  return best;
}

/**
 * The layout a sheet carries about itself.
 *
 * The processor writes a `grid` block beside the pictures saying how
 * many frames it packed and how many facings, so a sheet that is not
 * four by four does not have to be described again at every call site.
 * A caller that passes its own layout still wins: the file says how the
 * pictures are arranged, the caller says how to play them
 */
export function gridLayoutOf(value: unknown): OWCharLayout {
  if (typeof value !== 'object' || value == null) {
    return {};
  }

  const grid: unknown = (value as { grid?: unknown }).grid;

  if (typeof grid !== 'object' || grid == null) {
    return {};
  }

  const { columns, rows, sourceFrameWidth, sourceFrameHeight, standFrame, cycle } = grid as {
    columns?: unknown;
    rows?: unknown;
    sourceFrameWidth?: unknown;
    sourceFrameHeight?: unknown;
    standFrame?: unknown;
    cycle?: unknown;
  };
  const layout: OWCharLayout = {};
  // Only the numbers that are really there are carried: a key with
  // nothing under it would overrule what the caller said, which is the
  // opposite of what a fallback is for
  const counted = (found: unknown): number | undefined =>
    typeof found === 'number' && Number.isFinite(found) && found > 0
      ? Math.trunc(found)
      : undefined;
  const across = counted(columns);
  const down = counted(rows);
  const cellWidth = counted(sourceFrameWidth);
  const cellHeight = counted(sourceFrameHeight);

  if (across != null) {
    layout.columns = across;
  }
  if (down != null) {
    layout.rows = down;
  }
  if (cellWidth != null) {
    layout.sourceFrameWidth = cellWidth;
  }
  if (cellHeight != null) {
    layout.sourceFrameHeight = cellHeight;
  }
  // A three-frame charset carries how it plays as well as how it is
  // cut: which column is the standing pose, and the step-stand-step
  // order the walk runs in
  if (typeof standFrame === 'number' && Number.isFinite(standFrame) && standFrame >= 0) {
    layout.standFrame = Math.trunc(standFrame);
  }
  if (Array.isArray(cycle)) {
    const frames = cycle.filter(
      (frame): frame is number => typeof frame === 'number' && Number.isFinite(frame) && frame >= 0,
    );

    if (frames.length > 0) {
      layout.cycle = frames.map(Math.trunc);
    }
  }
  return layout;
}

export default class OWCharSprite {
  /** Where the sheet is, so a failed load can say what failed. */
  readonly source: string;

  readonly data: BasicSpriteData;

  readonly columns: number;

  readonly rows: number;

  readonly directions: SpriteDirection[];

  /** Cell size in sheet pixels, before any scaling. */
  readonly frameWidth: number;

  readonly frameHeight: number;

  /**
   * The cell those were cut from. The same for every charset cut from
   * one collection, where the cropped cell is not, so it is what to
   * scale by when several of them stand on the same board
   */
  readonly sourceFrameWidth: number;

  readonly sourceFrameHeight: number;

  /**
   * Every cell of the grid, row-major. A row and a column index into
   * this directly, so nothing is looked up or built while drawing
   */
  private readonly rects: FrameRect[];

  private readonly rowOf = new Map<SpriteDirection, number>();

  private readonly cycle: number[];

  private readonly standFrame: number;

  private readonly hold: number;

  private readonly stride: number;

  /**
   * How far through the cycle the playhead is, in frames. Kept
   * fractional so a clock and a distance can both push it and neither
   * has to round
   */
  private position = 0;

  private direction: SpriteDirection = 'Down';

  private row = 0;

  private image: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  /**
   * Whether the character is on the move. Set it and the walk plays;
   * clear it and the standing pose comes back
   */
  moving = false;

  constructor(source: string, data: BasicSpriteData, layout: OWCharLayout = {}) {
    this.source = source;
    this.data = data;
    this.columns = Math.max(1, layout.columns ?? 4);
    this.rows = Math.max(1, layout.rows ?? 4);
    this.directions = (layout.directions ?? CARDINALS).slice(0, this.rows);
    this.standFrame = Math.min(Math.max(0, layout.standFrame ?? 0), this.columns - 1);
    this.hold = Math.max(1, layout.hold ?? WALK_HOLD);
    this.stride = Math.max(0.001, layout.stride ?? STRIDE);

    const cycle = layout.cycle?.filter((frame) => frame >= 0 && frame < this.columns);

    this.cycle =
      cycle != null && cycle.length > 0
        ? cycle
        : Array.from({ length: this.columns }, (_, frame) => frame);

    for (let at = 0; at < this.directions.length; at += 1) {
      this.rowOf.set(this.directions[at], at);
    }

    const grid = gridOf(data, layout.grid);
    // A sheet with no grid on it draws nothing rather than slicing
    // whatever happens to sit at those coordinates — the same bargain
    // the other sprite classes make with a description that arrived
    // over the wire incomplete
    const width = grid == null ? 0 : Math.floor(grid.width / this.columns);
    const height = grid == null ? 0 : Math.floor(grid.height / this.rows);

    this.frameWidth = width;
    this.frameHeight = height;
    this.sourceFrameWidth = layout.sourceFrameWidth ?? width;
    this.sourceFrameHeight = layout.sourceFrameHeight ?? height;
    this.rects = [];

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        this.rects.push({
          x: (grid?.x ?? 0) + column * width,
          y: (grid?.y ?? 0) + row * height,
          width,
          height,
        });
      }
    }
  }

  /**
   * The sheet and its description, fetched together — `data.json` and
   * `image.png` under one folder, the layout the packing tool writes
   */
  static async fetch(basePath: string, layout: OWCharLayout = {}): Promise<OWCharSprite> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }

    const described: unknown = await response.json();
    const carried = gridLayoutOf(described);

    return new OWCharSprite(`${basePath}/image.png`, asBasicSpriteData(described), {
      ...layout,
      // Named one by one rather than spread over: a caller that built
      // its layout from props it does not have passes `undefined`, and
      // that is a question rather than an answer
      columns: layout.columns ?? carried.columns,
      rows: layout.rows ?? carried.rows,
      standFrame: layout.standFrame ?? carried.standFrame,
      cycle: layout.cycle ?? carried.cycle,
    });
  }

  /**
   * Bring the sheet in. Asking twice waits on the first load rather
   * than starting a second
   */
  async load(): Promise<this> {
    if (this.loading != null) {
      return this.loading;
    }

    this.loading = new Promise<this>((resolve, reject) => {
      const image = new Image();

      image.addEventListener('load', () => {
        this.image = image;
        resolve(this);
      });
      image.addEventListener('error', () => {
        reject(new Error(`Could not load sprite sheet ${this.source}`));
      });
      image.src = this.source;
    });
    return this.loading;
  }

  /**
   * Another walker off the same sheet.
   *
   * A description and a downloaded picture are shareable; a playhead is
   * not. Thirty villagers drawn from one charset are one image and one
   * grid, and the clone starts already loaded if the original is
   */
  clone(): OWCharSprite {
    const copy = new OWCharSprite(this.source, this.data, {
      columns: this.columns,
      rows: this.rows,
      directions: this.directions,
      standFrame: this.standFrame,
      cycle: this.cycle,
      hold: this.hold,
      stride: this.stride,
      sourceFrameWidth: this.sourceFrameWidth,
      sourceFrameHeight: this.sourceFrameHeight,
    });

    copy.image = this.image;
    copy.loading = this.loading;
    return copy;
  }

  /** Whether there is a sheet to draw from yet. */
  get ready(): boolean {
    return this.image != null && this.frameWidth > 0 && this.frameHeight > 0;
  }

  get facing(): SpriteDirection {
    return this.direction;
  }

  /**
   * Turn. A facing the grid has no row for is drawn as the cardinal
   * nearest it, and turning to a new row starts that row's cycle from
   * the beginning so a character that turns on the spot plants a foot
   * rather than continuing mid-stride
   */
  set facing(direction: SpriteDirection) {
    const snapped = this.rowOf.has(direction) ? direction : SNAP[direction];
    const row = this.rowOf.get(snapped) ?? 0;

    if (row !== this.row) {
      this.position = 0;
    }
    this.direction = direction;
    this.row = row;
  }

  /**
   * Advance the walk on a clock, in milliseconds.
   *
   * For a character whose animation is not tied to movement — somebody
   * jogging in place, or a walk played at the speed it was drawn at
   */
  advance(elapsed: number): void {
    if (this.moving) {
      this.position += elapsed / this.hold;
    }
  }

  /**
   * Advance the walk by how far the character moved, in world pixels.
   *
   * This is the one to use for anything actually walking somewhere: the
   * cycle is a function of distance, so the feet land at the same
   * points on the ground however fast the walker is going and there is
   * nothing to tune when the speed changes
   */
  advanceBy(distance: number): void {
    if (distance > 0) {
      this.moving = true;
      this.position += distance / this.stride;
    } else {
      this.moving = false;
    }
  }

  /**
   * Back to standing, with the cycle rewound.
   *
   * The rewind is the point: stopping mid-stride and starting again
   * from there is what makes a character look like they are shuffling,
   * and a charset's standing pose is a pose rather than a frame of the
   * walk
   */
  stop(): void {
    this.moving = false;
    this.position = 0;
  }

  /**
   * The cell showing, as its rectangle on the sheet. For DOM callers,
   * which draw the sheet as a CSS background rather than through
   * `draw`
   */
  get frameRect(): FrameRect | null {
    return this.rects[this.row * this.columns + this.frame] ?? null;
  }

  /** Which cell is showing, as an index into the row. */
  get frame(): number {
    if (!this.moving) {
      return this.standFrame;
    }

    const length = this.cycle.length;
    const at = Math.floor(this.position) % length;

    return this.cycle[at < 0 ? at + length : at];
  }

  /**
   * Draw the character with `x`, `y` as the anchor point.
   *
   * Nothing is drawn before the sheet has arrived, which is deliberate:
   * a canvas redrawing on its own schedule should get a gap for a frame
   * rather than an exception
   */
  draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: OWCharDrawOptions = {},
  ): void {
    const sheet = this.image;

    if (sheet == null || this.frameWidth <= 0 || this.frameHeight <= 0) {
      return;
    }

    // The row is a real row and the frame is a real column of it —
    // both are clamped where they are set — so the cell always exists
    const rect = this.rects[this.row * this.columns + this.frame];
    const scale =
      options.size != null && options.size > 0
        ? options.size / Math.max(this.frameWidth, this.frameHeight)
        : (options.scale ?? 1);
    const width = this.frameWidth * scale;
    const height = this.frameHeight * scale;
    const anchor = options.anchor ?? 'foot';
    const left = anchor === 'top-left' ? x : x - width / 2;
    // `foot` hangs the cell above the point rather than around it: the
    // point is the ground the character is standing on
    const above = anchor === 'foot' ? height : height / 2;
    const top = anchor === 'top-left' ? y : y - above;
    const alpha = context.globalAlpha;
    const smoothing = context.imageSmoothingEnabled;

    // Pixel art blown up: smoothing would turn a walker into a smear
    context.imageSmoothingEnabled = false;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }

    // A charset carries no anchors, so the shadow is where the feet are
    // by construction rather than by measurement: the bottom middle of
    // the cell, which is the point the `foot` anchor is already about
    if (options.shadow === true) {
      const radius = (width * SHADOW_WIDTH) / 2;

      context.save();
      context.fillStyle = SHADOW_COLOR;
      context.beginPath();
      context.ellipse(
        left + width / 2,
        top + height,
        radius,
        radius * SHADOW_FLATNESS,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }
    context.drawImage(sheet, rect.x, rect.y, rect.width, rect.height, left, top, width, height);
    context.globalAlpha = alpha;
    context.imageSmoothingEnabled = smoothing;
  }
}
