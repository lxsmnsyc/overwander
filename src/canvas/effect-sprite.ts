/**
 * A hit spark, a puff of smoke, a shockwave — something that plays once
 * and is gone.
 *
 * The sheets under `public/sprites/effects/{id}` and
 * `public/sprites/particles/{id}` are the item atlas shape with two
 * extra facts per sub-image, and both of them matter here:
 *
 * ```json
 * { "compact": true, "loops": false, "width": 166, "height": 185,
 *   "images": [{ "name": "000.png", "x": 129, "y": 172,
 *                "width": 8, "height": 8,
 *                "sourceWidth": 64, "sourceHeight": 56,
 *                "trim": [28, 19] }] }
 * ```
 *
 * **The frames are trimmed, so they are not the same size.** An
 * explosion drawn in a 64x56 cell is eight pixels across on its first
 * frame and fifty on its tenth, and the packer keeps only the lit
 * pixels of each. Drawn as they come off the sheet, all centred on one
 * point, the effect writhes: every frame is a different size, so every
 * frame's idea of its own middle is somewhere else. `sourceWidth`,
 * `sourceHeight` and `trim` are what put each frame back where the
 * artist drew it, and this class works in **cell** coordinates
 * throughout — the anchor is a point on the 64x56 cell, and the
 * trimmed picture is placed inside it. That is the whole reason this
 * is not four lines of `BasicSprite`.
 *
 * **The frame numbers are a timeline, not a count.** A frame's number
 * is when it starts, and it holds until the number of the next one —
 * `000` followed by `002` is one picture shown for two beats. So they
 * arrive zero-padded and in order but with holes in them, and effect 1
 * going `000`, `002`, `004`, then `010`, `011`, `012` is an effect
 * that opens slowly and then speeds up. A hole is a duration, never a
 * missing picture. Reading the names as a list instead would play the
 * slow parts of every effect at double speed.
 *
 * The last frame is the one the rule cannot answer for: nothing
 * follows it to say when it ends, so it gets a single beat.
 *
 * The timeline is flattened at construction into one frame per tick,
 * so playback is an array index and drawing is a `drawImage`.
 */

/** How long one slot of the timeline lasts — the clock the sheets count in. */
export const EFFECT_TICK = 1000 / 60;

/**
 * How near the end counts as the end, in milliseconds.
 *
 * A tick is a sixtieth of a second and does not divide into a
 * millisecond, so a caller stepping an effect one exact tick at a time
 * lands a hair short of the end after forty of them and the effect
 * never finishes. The slack is far below anything a frame of animation
 * can see and far above the error that accumulates
 */
const CLOSE_ENOUGH = 1e-6;

/** One trimmed picture, and the cell it was trimmed out of. */
export interface EffectFrame {
  /** Position on the packed sheet. */
  x: number;
  y: number;
  /** Size on the packed sheet, after trimming. */
  width: number;
  height: number;
  /** The cell the artist drew in, which every frame of a sheet shares. */
  sourceWidth: number;
  sourceHeight: number;
  /** Where the trimmed picture sits inside that cell. */
  trim: [x: number, y: number];
  /** Which tick of the timeline this frame starts on. */
  index: number;
}

export interface EffectSpriteData {
  /** Whether the frames were trimmed before packing. */
  compact: boolean;
  /**
   * Whether the last frame flows back into the first, so the effect can
   * be held on screen by running it round and round rather than by
   * stretching one pass over the wait.
   *
   * It is measured off the pictures by `pnpm sprite-loops` rather than
   * decided by hand: an effect whose seam is a bigger jump than its own
   * motion, or that ends on a different palette than it starts on,
   * flickers once a pass when looped. Absent from a description means
   * no: a sheet nobody has looked at is one to play once
   */
  loops: boolean;
  width: number;
  height: number;
  frames: EffectFrame[];
}

export interface EffectPlayOptions {
  /** Whether it starts again at the end instead of stopping. */
  loop?: boolean;
  /**
   * How long one pass should take, in milliseconds, instead of the
   * time the sheet says. The clip is stretched rather than cut, so an
   * effect can be made to fill a window somebody else decided
   */
  duration?: number;
}

export interface EffectDrawOptions {
  /** How much bigger to draw it than the sheet has it. */
  scale?: number;
  /**
   * The box to fit the **cell** in, in pixels. It is the cell rather
   * than the frame on purpose: fitting each frame to the box would
   * make a growing explosion the same size all the way through
   */
  size?: number;
  /** Where the point given to `draw` sits on the cell. */
  anchor?: 'center' | 'foot' | 'top-left';
  alpha?: number;
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
 * The tick a frame starts on, read out of its name.
 *
 * The names are the files the frames were cut from — `000.png`,
 * `001.png` — and the number in them is the position on the timeline.
 * A name with no number in it has no position, and the sheet's own
 * order is used for it instead
 */
function indexOf(name: string, fallback: number): number {
  const digits = /^(\d+)/.exec(name);

  return digits == null ? fallback : Number.parseInt(digits[1], 10);
}

/**
 * A fetched `data.json`, read into the shape this class expects.
 *
 * A description with a missing field should draw nothing rather than
 * throw inside a draw call, which is the same bargain the other sprite
 * classes make. An untrimmed sheet is read as a trim of nothing over a
 * cell the size of the frame, so nothing downstream has to ask which
 * kind it has
 */
export function asEffectSpriteData(value: unknown): EffectSpriteData {
  const root = asRecord(value);
  const frames: EffectFrame[] = [];

  asArray(root.images).forEach((entry, at) => {
    const image = asRecord(entry);
    const width = asNumber(image.width);
    const height = asNumber(image.height);

    // A sub-image with no size is one the sheet does not really have
    if (width <= 0 || height <= 0) {
      return;
    }

    const trim = asArray(image.trim);

    frames.push({
      x: asNumber(image.x),
      y: asNumber(image.y),
      width,
      height,
      sourceWidth: asNumber(image.sourceWidth) || width,
      sourceHeight: asNumber(image.sourceHeight) || height,
      trim: [asNumber(trim[0]), asNumber(trim[1])],
      index: indexOf(asString(image.name), at),
    });
  });
  frames.sort((a, b) => a.index - b.index);

  return {
    compact: root.compact === true,
    loops: root.loops === true,
    width: asNumber(root.width),
    height: asNumber(root.height),
    frames,
  };
}

export default class EffectSprite {
  /** Where the sheet is, so a failed load can say what failed. */
  readonly source: string;

  readonly data: EffectSpriteData;

  /**
   * The cell every frame is drawn in. Effects are authored one cell per
   * sheet, so this is a fact about the effect rather than about any one
   * frame of it, and a caller sizing a canvas around one asks this
   */
  readonly cellWidth: number;

  readonly cellHeight: number;

  /**
   * One frame per tick, holes filled in with the frame that came
   * before. Playback indexes this and does nothing else; a leading hole
   * is a genuinely empty tick and stays `null`
   */
  private readonly timeline: (EffectFrame | null)[];

  /**
   * The sheet itself. Reachable by a subclass because a subclass draws
   * from it — [`DirectionalEffectSprite`](./directional-effect-sprite.ts)
   * puts the same frames down under a rotation
   */
  protected image: HTMLImageElement | null = null;

  protected loading: Promise<this> | null = null;

  private elapsed = 0;

  private playing = false;

  private looping = false;

  /** How long one pass takes, in milliseconds. */
  private span: number;

  private readonly naturalSpan: number;

  constructor(source: string, data: EffectSpriteData) {
    this.source = source;
    this.data = data;
    this.cellWidth = data.frames[0]?.sourceWidth ?? 0;
    this.cellHeight = data.frames[0]?.sourceHeight ?? 0;

    // The last frame starts the last tick, so the timeline is one
    // longer than its index — a sheet with no frames on it is no ticks
    const ticks = (data.frames.at(-1)?.index ?? -1) + 1;

    this.timeline = Array.from({ length: ticks }, () => null);

    let held: EffectFrame | null = null;
    let next = 0;

    // The frames are sorted, so the timeline is filled by walking the
    // two in step rather than searching the list once per tick
    for (let tick = 0; tick < ticks; tick += 1) {
      while (next < data.frames.length && data.frames[next].index <= tick) {
        held = data.frames[next];
        next += 1;
      }
      this.timeline[tick] = held;
    }
    this.naturalSpan = ticks * EFFECT_TICK;
    this.span = this.naturalSpan;
  }

  /**
   * The sheet and its description, fetched together — `data.json` and
   * `image.png` under one folder
   */
  static async fetch(basePath: string): Promise<EffectSprite> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }
    return new EffectSprite(`${basePath}/image.png`, asEffectSpriteData(await response.json()));
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
   * Another copy of the effect off the same sheet.
   *
   * A description and a downloaded picture are shareable; a playhead is
   * not, and an effect is the kind of thing twenty of go off at once.
   * The clone starts already loaded if the original is, and stopped
   * whatever the original is doing
   */
  clone(): EffectSprite {
    const copy = new EffectSprite(this.source, this.data);

    copy.image = this.image;
    copy.loading = this.loading;
    return copy;
  }

  /** Whether there is a sheet to draw from yet. */
  get ready(): boolean {
    return this.image != null && this.timeline.length > 0;
  }

  /** How many ticks long the effect is. */
  get length(): number {
    return this.timeline.length;
  }

  /**
   * Whether this effect can be played on a loop without flickering — a
   * flame can, an explosion cannot. A caller holding an effect for a
   * window somebody else decided asks this to know which way to fill
   * it: `play({ loop: true })` for a flame, `play({ duration })` for
   * anything else
   */
  get loops(): boolean {
    return this.data.loops;
  }

  /** How long one pass takes at the speed it is currently set to play. */
  get duration(): number {
    return this.span;
  }

  /**
   * Whether it has run its course. A looping effect never has, and one
   * that was never started has not either
   */
  get finished(): boolean {
    return !this.playing && this.span > 0 && this.elapsed >= this.span - CLOSE_ENOUGH;
  }

  /** How far through the pass it is, from 0 to 1. */
  get progress(): number {
    return this.span > 0 ? Math.min(1, this.elapsed / this.span) : 0;
  }

  /** Start it from the beginning. */
  play(options: EffectPlayOptions = {}): void {
    const duration = options.duration;

    this.span = duration != null && duration > 0 ? duration : this.naturalSpan;
    this.looping = options.loop === true;
    this.elapsed = 0;
    this.playing = this.timeline.length > 0;
  }

  /**
   * Stop where it is. The frame showing stays showing, which is what a
   * caller freezing an effect means; `play` is what rewinds
   */
  stop(): void {
    this.playing = false;
  }

  /**
   * Move the playhead on, in milliseconds.
   *
   * A one-shot holds its last frame at the end rather than vanishing,
   * so a caller can let it sit for a beat before dropping it — ask
   * `finished` for whether it is over
   */
  advance(elapsed: number): void {
    if (!this.playing || this.span <= 0) {
      return;
    }
    this.elapsed += elapsed;

    if (this.elapsed < this.span - CLOSE_ENOUGH) {
      return;
    }
    if (this.looping) {
      this.elapsed %= this.span;
    } else {
      this.elapsed = this.span;
      this.playing = false;
    }
  }

  /**
   * The frame showing, or nothing on a tick the effect is empty for
   */
  get frame(): EffectFrame | null {
    const ticks = this.timeline.length;

    if (ticks === 0) {
      return null;
    }

    // Nudged for the same reason the end is: a playhead stepped in
    // exact ticks drifts a hair below each boundary, and without the
    // slack it lands on the previous tick and skips a frame
    const at = Math.floor(((this.elapsed + CLOSE_ENOUGH) / this.span) * ticks);

    return this.timeline[Math.min(Math.max(0, at), ticks - 1)];
  }

  /**
   * Draw the effect with `x`, `y` as a point on its **cell**.
   *
   * The trimmed frame is placed inside the cell rather than at the
   * point itself, so a frame that is eight pixels across and one that
   * is fifty both sit where they were drawn and the effect stays still
   * while it plays
   */
  draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: EffectDrawOptions = {},
  ): void {
    const sheet = this.image;
    const frame = this.frame;

    if (sheet == null || frame == null) {
      return;
    }

    const cellWidth = frame.sourceWidth;
    const cellHeight = frame.sourceHeight;
    const scale =
      options.size != null && options.size > 0
        ? options.size / Math.max(cellWidth, cellHeight)
        : (options.scale ?? 1);
    const anchor = options.anchor ?? 'center';
    const left = anchor === 'top-left' ? x : x - (cellWidth * scale) / 2;
    const above = anchor === 'foot' ? cellHeight * scale : (cellHeight * scale) / 2;
    const top = anchor === 'top-left' ? y : y - above;
    const alpha = context.globalAlpha;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }
    context.drawImage(
      sheet,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      left + frame.trim[0] * scale,
      top + frame.trim[1] * scale,
      frame.width * scale,
      frame.height * scale,
    );
    context.globalAlpha = alpha;
  }
}
