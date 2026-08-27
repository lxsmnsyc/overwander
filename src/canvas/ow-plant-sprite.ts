/**
 * A plant standing on an overworld cell.
 *
 * The sheet is the other kind of grid [`OWCharSprite`](./ow-char-sprite.ts)
 * reads: its rows are **growth stages**, top to bottom, and each row's
 * columns are a loop the plant idles through. A berry plant is two
 * frames across and three stages down, and there is nothing else it
 * can do.
 *
 * It holds no playhead, which is the difference that matters. A
 * charset belongs to one walker, so a walker owns a clone of it; a
 * chunk's berry patches are a dozen bushes drawn off one sheet, and
 * every one of them wants a different point in the sway. So the frame
 * is a function of the clock the caller passes, and one sheet serves
 * the whole board with no clone and no per-cell state.
 */

import { type BasicSpriteData, asBasicSpriteData } from './basic-sprite';
import { type FrameRect, gridOf } from './ow-char-sprite';
import { SPRITE_TICK } from './sprite-sheet';

/**
 * How long one frame is held, in milliseconds. Twelve ticks is a
 * two-frame sway over a second, which reads as a plant in a breeze
 * rather than one being shaken
 */
const PLANT_HOLD = SPRITE_TICK * 12;

export interface OWPlantLayout {
  /** Loop frames across. */
  columns?: number;
  /** Growth stages down, youngest first. */
  rows?: number;
  /** Milliseconds one frame is held. */
  hold?: number;
  /**
   * The sub-image the grid was packed as. Left out, the largest
   * sub-image is taken to be the grid, which is what a sheet packed as
   * one picture always has
   */
  grid?: string;
  /**
   * The cell the frames were cut from, before the crop took the margin
   * off. It is what a caller scales by when several plants have to come
   * out the same height: the crop is each sheet's own business and the
   * cell they were drawn in is the one thing they share
   */
  sourceFrameWidth?: number;
  sourceFrameHeight?: number;
}

export interface OWPlantDrawOptions {
  /** Which stage to draw, counting from the youngest. */
  stage?: number;
  /** The clock the loop is read off, in milliseconds. */
  at?: number;
  /**
   * Where in the loop this plant sits, in frames. Two bushes given
   * different offsets sway out of step, which is the difference between
   * a patch of berries and a row of copies
   */
  phase?: number;
  /** How much bigger to draw it than the sheet has it. */
  scale?: number;
  /** The box to fit a cell in, in pixels, answered as the scale that fits. */
  size?: number;
  /**
   * Where the point given to `draw` sits on the cell. `foot` is the
   * bottom middle, which is the soil a plant is growing out of
   */
  anchor?: 'foot' | 'center' | 'top-left';
  alpha?: number;
}

export default class OWPlantSprite {
  /** Where the sheet is, so a failed load can say what failed. */
  readonly source: string;

  readonly data: BasicSpriteData;

  /** Loop frames across. */
  readonly frames: number;

  /** Growth stages down. */
  readonly stages: number;

  /** Cell size in sheet pixels, before any scaling. */
  readonly frameWidth: number;

  readonly frameHeight: number;

  readonly sourceFrameWidth: number;

  readonly sourceFrameHeight: number;

  /**
   * Every cell of the grid, row-major. A stage and a frame index into
   * this directly, so drawing allocates nothing
   */
  private readonly rects: FrameRect[];

  private readonly hold: number;

  private image: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  constructor(source: string, data: BasicSpriteData, layout: OWPlantLayout = {}) {
    this.source = source;
    this.data = data;
    this.frames = Math.max(1, layout.columns ?? 2);
    this.stages = Math.max(1, layout.rows ?? 3);
    this.hold = Math.max(1, layout.hold ?? PLANT_HOLD);

    const grid = gridOf(data, layout.grid);
    // A sheet with no grid on it draws nothing rather than slicing
    // whatever happens to sit at those coordinates
    const width = grid == null ? 0 : Math.floor(grid.width / this.frames);
    const height = grid == null ? 0 : Math.floor(grid.height / this.stages);

    this.frameWidth = width;
    this.frameHeight = height;
    this.sourceFrameWidth = layout.sourceFrameWidth ?? width;
    this.sourceFrameHeight = layout.sourceFrameHeight ?? height;
    this.rects = [];

    for (let stage = 0; stage < this.stages; stage += 1) {
      for (let frame = 0; frame < this.frames; frame += 1) {
        this.rects.push({
          x: (grid?.x ?? 0) + frame * width,
          y: (grid?.y ?? 0) + stage * height,
          width,
          height,
        });
      }
    }
  }

  /**
   * The sheet and its description together: `data.json` and `image.png`
   * under one folder, the layout the plant script writes
   */
  static async fetch(basePath: string, layout: OWPlantLayout = {}): Promise<OWPlantSprite> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }

    const described: unknown = await response.json();
    const carried = plantLayoutOf(described);

    return new OWPlantSprite(`${basePath}/image.png`, asBasicSpriteData(described), {
      ...layout,
      columns: layout.columns ?? carried.columns,
      rows: layout.rows ?? carried.rows,
      sourceFrameWidth: layout.sourceFrameWidth ?? carried.sourceFrameWidth,
      sourceFrameHeight: layout.sourceFrameHeight ?? carried.sourceFrameHeight,
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

  /** Whether there is a sheet to draw from yet. */
  get ready(): boolean {
    return this.image != null && this.frameWidth > 0 && this.frameHeight > 0;
  }

  /** The last stage the sheet has, which is the grown plant. */
  get ripe(): number {
    return this.stages - 1;
  }

  /** Which frame of the loop a clock is showing. */
  frameAt(at: number, phase = 0): number {
    const step = Math.floor(at / this.hold + phase);

    return ((step % this.frames) + this.frames) % this.frames;
  }

  /**
   * The cell showing, as its rectangle on the sheet. For DOM callers,
   * which draw the sheet as a CSS background rather than through `draw`
   */
  rectOf(stage: number, frame: number): FrameRect | null {
    const row = Math.min(Math.max(0, Math.trunc(stage)), this.stages - 1);

    return this.rects[row * this.frames + (frame % this.frames)] ?? null;
  }

  /**
   * Draw the plant with `x`, `y` as the anchor point.
   *
   * Nothing is drawn before the sheet has arrived, so a canvas
   * redrawing on its own schedule gets a gap for a frame rather than an
   * exception
   */
  draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: OWPlantDrawOptions = {},
  ): void {
    const sheet = this.image;

    if (sheet == null || this.frameWidth <= 0 || this.frameHeight <= 0) {
      return;
    }

    const rect = this.rectOf(
      options.stage ?? this.ripe,
      this.frameAt(options.at ?? 0, options.phase ?? 0),
    );

    if (rect == null) {
      return;
    }

    const scale =
      options.size != null && options.size > 0
        ? options.size / Math.max(this.frameWidth, this.frameHeight)
        : (options.scale ?? 1);
    const width = this.frameWidth * scale;
    const height = this.frameHeight * scale;
    const anchor = options.anchor ?? 'foot';
    const left = anchor === 'top-left' ? x : x - width / 2;
    // `foot` hangs the cell above the point: the point is the soil the
    // plant is growing out of
    const above = anchor === 'foot' ? height : height / 2;
    const top = anchor === 'top-left' ? y : y - above;
    const alpha = options.alpha ?? 1;
    const was = context.globalAlpha;

    if (alpha !== 1) {
      context.globalAlpha = was * alpha;
    }
    context.drawImage(
      sheet,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      Math.round(left),
      Math.round(top),
      Math.round(width),
      Math.round(height),
    );
    if (alpha !== 1) {
      context.globalAlpha = was;
    }
  }
}

/**
 * The layout a plant sheet carries about itself, out of the `grid`
 * block the plant script writes beside the pictures
 */
export function plantLayoutOf(value: unknown): OWPlantLayout {
  if (typeof value !== 'object' || value == null) {
    return {};
  }

  const grid: unknown = (value as { grid?: unknown }).grid;

  if (typeof grid !== 'object' || grid == null) {
    return {};
  }

  const { columns, rows, sourceFrameWidth, sourceFrameHeight } = grid as {
    columns?: unknown;
    rows?: unknown;
    sourceFrameWidth?: unknown;
    sourceFrameHeight?: unknown;
  };
  const layout: OWPlantLayout = {};
  // Only the numbers really there are carried: a key with nothing under
  // it would overrule what the caller said
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
  return layout;
}
