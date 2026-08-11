/**
 * A pokemon on a canvas, moving.
 *
 * The sprites under `public/sprites` come as one sheet per pokemon
 * plus a `data.json` describing it, in the layout the sprite
 * collections use: the sheet holds a named sub-image per animation,
 * and each sub-image is a grid — one column per frame, one row per
 * direction. `data.json` says where each sub-image sits, how big one
 * frame is, and how long each frame is held.
 *
 * This class is the whole of reading that. It knows nothing about
 * pokemon, chunks or battles: it is handed a sheet and a description,
 * told which animation to play, ticked with however much time has
 * passed, and asked to draw itself at a point. That is what lets the
 * chunk canvas use it for a spawn standing in a field and the battle
 * canvas use it for a unit throwing a move, without either of them
 * knowing how a sprite sheet is laid out.
 */

export interface SpriteSheetImage {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAnimationData {
  name: string;
  frameWidth: number;
  frameHeight: number;
  index: number;
  /**
   * How long each frame is held, in sprite ticks. There is one entry
   * per frame, which is also how many columns the grid has
   */
  durations: number[];
  /**
   * Which sub-image of the sheet holds it. Several animations share
   * one — a Strike is drawn from the Attack sheet — so this is the
   * name to look up rather than the animation's own
   */
  target?: string;
}

export interface SpriteSheetData {
  sheet: {
    width: number;
    height: number;
    images: SpriteSheetImage[];
  };
  anims: {
    shadowSize: number;
    anims: SpriteAnimationData[];
  };
}

/**
 * How long one unit of a frame's duration lasts. The durations are
 * counted in frames of a sixtieth of a second, which is the same
 * clock the battle runs on — a two-tick frame is a thirtieth of a
 * second whoever is asking
 */
export const SPRITE_TICK = 1000 / 60;

/**
 * The eight ways a sprite can face, in the order the rows of a grid
 * are laid out. An animation with only one row — a sleeping pokemon
 * faces nowhere in particular — ignores it
 */
export type SpriteDirection =
  | 'down'
  | 'down-right'
  | 'right'
  | 'up-right'
  | 'up'
  | 'up-left'
  | 'left'
  | 'down-left';

const DIRECTION_ROWS: Record<SpriteDirection, number> = {
  down: 0,
  'down-right': 1,
  right: 2,
  'up-right': 3,
  up: 4,
  'up-left': 5,
  left: 6,
  'down-left': 7,
};

export interface PlayOptions {
  direction?: SpriteDirection;
  /**
   * Whether it runs again at the end. An Idle loops; a Hurt does not,
   * and holds its last frame until something else is played
   */
  loop?: boolean;
  /**
   * Whether asking for the animation already playing starts it over.
   * Off by default, so a caller that plays `Walk` every tick while
   * somebody is walking gets one continuous walk rather than the
   * first frame forever
   */
  restart?: boolean;
  /**
   * How long one pass should take, in milliseconds, instead of the
   * time the sheet says.
   *
   * The clip is **stretched** rather than cut: every frame is held
   * proportionally longer or shorter so the whole thing still plays,
   * start to end, in exactly this long. It is for an animation that
   * has to fill a window somebody else decided — a battle cast, whose
   * length comes from the move's priority — where looping would run
   * the clip two and a half times and cutting would drop the end of
   * it.
   *
   * Left out, the clip plays at the speed it was drawn at
   */
  duration?: number;
}

export interface DrawOptions {
  /**
   * How much bigger to draw it than the sheet has it. The sprites are
   * small — a frame is a few dozen pixels — so a canvas drawing them
   * at any size worth looking at is scaling them
   */
  scale?: number;
  /**
   * Where the point given to `draw` sits on the sprite. `center` is
   * the middle of the frame; `bottom` is the middle of its base,
   * which is what puts a pokemon's feet on a cell rather than its
   * middle
   */
  anchor?: 'center' | 'bottom';
  /**
   * Mirrored horizontally. A sheet has eight facings of its own, so
   * this is for the caller that wants a pokemon turned around without
   * changing which way it is animating — the battle's two sides
   */
  flip?: boolean;
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
 * A fetched `data.json`, read into the shape this class expects.
 *
 * The files are assets rather than input, but they are still JSON
 * arriving over the wire: a sheet with a missing field should draw
 * nothing rather than throw somewhere inside a draw call sixty times
 * a second
 */
export function asSpriteSheetData(value: unknown): SpriteSheetData {
  const root = asRecord(value);
  const sheet = asRecord(root.sheet);
  const anims = asRecord(root.anims);

  return {
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
        const target = asString(anim.target);

        return {
          name: asString(anim.name),
          frameWidth: asNumber(anim.frameWidth),
          frameHeight: asNumber(anim.frameHeight),
          index: asNumber(anim.index),
          durations: asArray(anim.durations).map(asNumber),
          target: target === '' ? undefined : target,
        };
      }),
    },
  };
}

/**
 * One animation, ready to draw: where its grid sits on the sheet, how
 * big a frame is, and how long each is held in milliseconds
 */
interface Clip {
  data: SpriteAnimationData;
  image: SpriteSheetImage;
  frames: number;
  rows: number;
  /**
   * When each frame ends, in milliseconds from the start of the clip.
   * Advancing is then a walk along this rather than a loop that
   * subtracts durations one at a time
   */
  ends: number[];
  duration: number;
}

export default class SpeciesSpriteAnimation {
  /**
   * Where the sheet is, so a caller can tell two sprites apart and a
   * failed load can say what failed
   */
  readonly source: string;

  readonly data: SpriteSheetData;

  private readonly clips = new Map<string, Clip>();

  private image: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  private clip: Clip | null = null;

  private facing: SpriteDirection = 'down';

  private looping = true;

  private running = false;

  /**
   * How fast the playhead moves against the wall clock. One is the
   * speed the sheet was drawn at; a half runs it twice as slow. It is
   * how `duration` is honoured — the frames keep their proportions and
   * only the scale of the whole changes
   */
  private rate = 1;

  /**
   * How far into the current clip it is, in milliseconds
   */
  private elapsed = 0;

  constructor(source: string, data: SpriteSheetData) {
    this.source = source;
    this.data = data;

    const images = new Map(data.sheet.images.map((image) => [image.name, image]));

    for (const anim of data.anims.anims) {
      const image = images.get(anim.target ?? anim.name);

      // An animation whose sub-image is missing is one this sheet
      // does not actually have; it is left out rather than drawn as a
      // slice of whatever happens to sit at those coordinates
      if (image == null || anim.frameWidth <= 0 || anim.frameHeight <= 0) {
        continue;
      }

      const ends: number[] = [];
      let total = 0;

      for (const held of anim.durations) {
        total += Math.max(1, held) * SPRITE_TICK;
        ends.push(total);
      }

      this.clips.set(anim.name, {
        data: anim,
        image,
        frames: Math.min(anim.durations.length, Math.floor(image.width / anim.frameWidth)),
        rows: Math.max(1, Math.floor(image.height / anim.frameHeight)),
        ends,
        duration: total,
      });
    }
  }

  /**
   * The sheet and its description, fetched together. The description
   * is what says how to read the sheet, so neither is any use without
   * the other
   */
  static async fetch(basePath: string): Promise<SpeciesSpriteAnimation> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }
    return new SpeciesSpriteAnimation(
      `${basePath}/image.png`,
      asSpriteSheetData(await response.json()),
    );
  }

  /**
   * Another animation off the same sheet.
   *
   * A sheet is one download and one description; a playhead is not.
   * Six pokemon on a field are six clones of one loaded sheet, each
   * part-way through its own animation, rather than six copies of a
   * quarter-megabyte image
   */
  clone(): SpeciesSpriteAnimation {
    const copy = new SpeciesSpriteAnimation(this.source, this.data);

    copy.image = this.image;
    copy.loading = this.loading;
    return copy;
  }

  /**
   * Bring the sheet in. It resolves once there is something to draw,
   * and asking twice waits on the first load rather than starting a
   * second
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
   * Whether there is a sheet to draw from yet. A canvas drawing every
   * frame asks this rather than awaiting: a sprite that has not
   * arrived should leave a gap for one frame, not stall the drawing
   */
  get ready(): boolean {
    return this.image != null;
  }

  /**
   * What this sheet can play
   */
  get animations(): string[] {
    return [...this.clips.keys()];
  }

  has(name: string): boolean {
    return this.clips.has(name);
  }

  /**
   * What is playing, or null before anything has been asked for
   */
  get playing(): string | null {
    return this.clip?.data.name ?? null;
  }

  get direction(): SpriteDirection {
    return this.facing;
  }

  /**
   * Whether a one-shot animation has reached its end and is holding
   * its last frame. A looping one is never finished
   */
  get finished(): boolean {
    return this.clip != null && !this.looping && this.elapsed >= this.clip.duration;
  }

  get paused(): boolean {
    return !this.running;
  }

  /**
   * How many pixels one frame of the current animation covers, before
   * any scaling. A caller that wants to size something around the
   * sprite — a health bar over a unit — asks this
   */
  get frameSize(): { width: number; height: number } {
    return {
      width: this.clip?.data.frameWidth ?? 0,
      height: this.clip?.data.frameHeight ?? 0,
    };
  }

  /**
   * Play an animation from the start, or carry on the one already
   * playing. Answers whether this sheet has it at all, so a caller can
   * fall back — not every pokemon has a Dance
   */
  play(name: string, options: PlayOptions = {}): boolean {
    const clip = this.clips.get(name);

    if (clip == null) {
      return false;
    }
    if (options.direction != null) {
      this.facing = options.direction;
    }
    this.looping = options.loop ?? true;
    this.running = true;
    // Set before the carry-on below, so a caller that asks every tick
    // can change how long the window is without restarting the clip
    this.rate =
      options.duration != null && options.duration > 0 && clip.duration > 0
        ? clip.duration / options.duration
        : 1;

    // Asking again for what is already playing carries on, unless the
    // caller says otherwise: a canvas that plays `Walk` on every tick
    // of a walk should not redraw the first frame every tick
    if (this.clip === clip && options.restart !== true) {
      return true;
    }
    this.clip = clip;
    this.elapsed = 0;
    return true;
  }

  /**
   * Hold where it is. The frame stays on screen; nothing advances
   */
  pause(): void {
    this.running = false;
  }

  /**
   * Carry on from wherever it was paused
   */
  resume(): void {
    if (this.clip != null) {
      this.running = true;
    }
  }

  /**
   * Back to the first frame, and held there
   */
  stop(): void {
    this.running = false;
    this.elapsed = 0;
  }

  setDirection(direction: SpriteDirection): void {
    this.facing = direction;
  }

  /**
   * Move the animation on by however long has passed, in
   * milliseconds. Nothing here reads a clock of its own: the chunk
   * canvas draws on its own schedule and the battle canvas draws on
   * the battle's, and a sprite that kept its own time would drift from
   * whichever one is driving it
   */
  update(elapsed: number): void {
    const clip = this.clip;

    if (clip == null || !this.running || elapsed <= 0 || clip.duration <= 0) {
      return;
    }

    this.elapsed += elapsed * this.rate;

    if (this.elapsed < clip.duration) {
      return;
    }
    if (this.looping) {
      this.elapsed %= clip.duration;
      return;
    }
    // A one-shot holds its last frame rather than vanishing, and stops
    // asking to be advanced
    this.elapsed = clip.duration;
    this.running = false;
  }

  /**
   * Which frame is showing. It is the first frame whose end has not
   * been reached yet — a caller lining something up with a particular
   * moment of an animation, like the frame a move is thrown on, reads
   * it here
   */
  get frame(): number {
    const clip = this.clip;

    if (clip == null) {
      return 0;
    }

    for (let at = 0; at < clip.frames; at++) {
      if (this.elapsed < clip.ends[at]) {
        return at;
      }
    }
    return Math.max(0, clip.frames - 1);
  }

  /**
   * Draw the current frame with `x`, `y` as the anchor point.
   *
   * Nothing is drawn before the sheet has arrived or before anything
   * has been played, which is deliberate: a canvas redrawing sixty
   * times a second should not have to check first
   */
  draw(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions = {}): void {
    const clip = this.clip;
    const image = this.image;

    if (clip == null || image == null) {
      return;
    }

    const { frameWidth, frameHeight } = clip.data;
    const scale = options.scale ?? 1;
    const width = frameWidth * scale;
    const height = frameHeight * scale;
    const row = Math.min(clip.rows - 1, DIRECTION_ROWS[this.facing]);
    const left = clip.image.x + this.frame * frameWidth;
    const top = clip.image.y + row * frameHeight;
    const originY = options.anchor === 'bottom' ? y - height : y - height / 2;

    context.save();
    // Pixel art blown up: smoothing would turn a sprite into a smear
    context.imageSmoothingEnabled = false;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }

    if (options.flip === true) {
      context.translate(x, originY);
      context.scale(-1, 1);
      context.drawImage(image, left, top, frameWidth, frameHeight, -width / 2, 0, width, height);
    } else {
      context.drawImage(
        image,
        left,
        top,
        frameWidth,
        frameHeight,
        x - width / 2,
        originY,
        width,
        height,
      );
    }
    context.restore();
  }
}
