import asSpriteSheetJSON, {
  type AnimData,
  type Point,
  type SheetImageData,
  type SpriteAnchor,
  type SpriteDirection,
  type SpriteFrameData,
  type SpriteSheetJSON,
  type SpriteTargetData,
} from './sprite-sheet';

/**
 * A pokemon on a canvas, moving.
 *
 * The description of a sheet lives in
 * [`sprite-sheet`](./sprite-sheet.ts): a packed image with one grid per
 * animation, a column per frame and a row per orientation, plus the
 * anchor points saying where the parts of the pokemon are on every one
 * of those frames.
 *
 * This class is the whole of reading that. It knows nothing about
 * pokemon, chunks or battles: it is handed a sheet and a description,
 * told which animation to play, ticked with however much time has
 * passed, and asked to draw itself at a point. That is what lets the
 * chunk canvas use it for a spawn standing in a field and the battle
 * canvas use it for a unit throwing a move, without either of them
 * knowing how a sprite sheet is laid out.
 *
 * Where a sprite goes is an **anchor** rather than a corner. A caller
 * says which part of the pokemon it is placing — the shadow for
 * something standing on a cell, the body centre for something a
 * projectile is flying at — and the frame is positioned so that part
 * lands on the point given. It replaces measuring the empty band under
 * a frame's feet in the browser, which needed a scratch canvas that
 * Safari and Firefox will not always let anybody read back, and which
 * could only ever guess at where a pokemon stands in its own box.
 *
 * Anchors are also what make a **trimmed** sheet no harder to draw than
 * an untrimmed one. A compact sheet holds each frame cropped to the
 * pixels that are lit, so the frame is no longer a fixed box with the
 * pokemon somewhere in the middle of it; every size and every anchor in
 * `sprites` is in that cropped frame's own coordinates, and drawing is
 * the same arithmetic either way. Only two things still ask about the
 * cell the artist drew in — how big a shadow to cast, and
 * `sourceFrameSize` for a caller that wants the authored box — because
 * those are facts about the pokemon rather than about the packing.
 */

/**
 * How long one unit of a frame's duration lasts. The durations are
 * counted in frames of a sixtieth of a second, which is the same
 * clock the battle runs on — a two-tick frame is a thirtieth of a
 * second whoever is asking
 */
export const SPRITE_TICK = 1000 / 60;

/**
 * How wide a shadow is for each `shadowSize` the collection uses, as a
 * fraction of the width of the cell the frame was drawn in.
 *
 * The sheets carry a size rather than a shape — nought, one or two,
 * for a small, an ordinary and a large pokemon — and the cells grow
 * with what is drawn in them, so a fraction of the cell is a
 * reasonable reading of both at once
 */
const SHADOW_WIDTHS = [0.16, 0.22, 0.28];

/**
 * How flat a shadow lies: it is on the ground and the ground is being
 * looked along, so it is an ellipse rather than a circle
 */
const SHADOW_FLATNESS = 0.42;

const SHADOW_COLOR = 'rgba(0, 0, 0, 0.28)';

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
   * Which part of the pokemon the given point places. `center` is its
   * body, which is what a picture of it is centred on; `shadow` is the
   * point that sits on the ground, which is what stands it on a cell
   */
  anchor?: SpriteAnchor;
  /**
   * Mirrored horizontally. A sheet has eight facings of its own, so
   * this is for the caller that wants a pokemon turned around without
   * changing which way it is animating — the battle's two sides
   */
  flip?: boolean;
  alpha?: number;
}

export interface ShadowOptions extends DrawOptions {
  color?: string;
  /**
   * How flat the ellipse lies, as a fraction of its width, instead of
   * the flatness a sprite standing on level ground gets. It is for a
   * caller whose ground is laid back under a camera: the board knows
   * how much it foreshortens things lying on it, and a sprite does not
   */
  squash?: number;
}

/**
 * One animation, ready to draw: which grid of the sheet it plays from,
 * how long each frame is held, and the anchors of every frame in it
 */
interface Clip {
  anim: AnimData;
  image: SheetImageData;
  target: SpriteTargetData;
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

/**
 * Where a frame lands on a canvas, worked out once and used by
 * everything that has to agree about it: the drawing, the shadow under
 * it, and anybody asking where a pokemon's head is
 */
interface Placement {
  /** The frame's rectangle on the sheet */
  left: number;
  top: number;
  frameWidth: number;
  frameHeight: number;
  /** Where the frame's top left corner lands, before any mirroring */
  originX: number;
  originY: number;
  width: number;
  height: number;
  scale: number;
  flip: boolean;
}

/**
 * The middle of however many points there are, or nothing if there are
 * none
 */
function middleOf(points: Point[]): Point | null {
  if (points.length === 0) {
    return null;
  }
  return [
    points.reduce((total, point) => total + point[0], 0) / points.length,
    points.reduce((total, point) => total + point[1], 0) / points.length,
  ];
}

export default class SpeciesSpriteAnimation {
  /**
   * Where the sheet is, so a caller can tell two sprites apart and a
   * failed load can say what failed
   */
  readonly source: string;

  readonly data: SpriteSheetJSON;

  private readonly clips = new Map<string, Clip>();

  private image: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  private clip: Clip | null = null;

  private facing: SpriteDirection = 'Down';

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

  constructor(source: string, data: SpriteSheetJSON) {
    this.source = source;
    this.data = data;

    const images = new Map(data.sheet.images.map((image) => [image.name, image]));
    // Looked up rather than indexed: a record hands back an entry
    // whether or not there is one, and a description that came over the
    // wire is exactly the kind that names a grid it does not carry
    const targets = new Map(Object.entries(data.sprites));

    for (const anim of data.anims.anims) {
      const image = images.get(anim.target);
      const target = targets.get(anim.target);

      // An animation whose grid is missing is one this sheet does not
      // actually have; it is left out rather than drawn as a slice of
      // whatever happens to sit at those coordinates
      if (image == null || target == null || target.frameWidth <= 0 || target.frameHeight <= 0) {
        continue;
      }

      const ends: number[] = [];
      let total = 0;

      for (const held of anim.durations) {
        total += Math.max(1, held) * SPRITE_TICK;
        ends.push(total);
      }

      this.clips.set(anim.name, {
        anim,
        image,
        target,
        frames: Math.min(anim.durations.length, Math.max(1, target.columns)),
        rows: Math.max(1, target.rows),
        ends,
        duration: total,
      });
    }
  }

  /**
   * The description and the drawing, fetched together.
   *
   * They come from different places on purpose: the description is one
   * file per pokemon and the drawing is one per coat, so a shiny and an
   * ordinary Bulbasaur are two images over one description
   */
  static async fetch(metaPath: string, imagePath: string): Promise<SpeciesSpriteAnimation> {
    const response = await fetch(metaPath);

    if (!response.ok) {
      throw new Error(`No sprite metadata at ${metaPath}`);
    }
    return new SpeciesSpriteAnimation(imagePath, asSpriteSheetJSON(await response.json()));
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
    return this.clip?.anim.name ?? null;
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
   * any scaling.
   *
   * This is what is actually painted, which on a trimmed sheet is
   * smaller than the cell it was drawn in — a caller sizing a box
   * around the sprite wants the picture rather than the padding. The
   * cell is `sourceFrameSize`
   */
  get frameSize(): { width: number; height: number } {
    return {
      width: this.clip?.target.frameWidth ?? 0,
      height: this.clip?.target.frameHeight ?? 0,
    };
  }

  /**
   * How big the frame was before it was trimmed — the cell the artist
   * drew in, as `AnimData.xml` gives it.
   *
   * It is the stable measure of how big a pokemon is: trimming depends
   * on which pixels happen to be lit in a particular animation, so a
   * Swing and an Idle of one pokemon trim to different sizes while
   * their cells agree
   */
  get sourceFrameSize(): { width: number; height: number } {
    return {
      width: this.clip?.target.sourceFrameWidth ?? 0,
      height: this.clip?.target.sourceFrameHeight ?? 0,
    };
  }

  /**
   * Where the trimmed frame sat inside the cell it was drawn in, for a
   * caller that wants the authored box back. Nothing has to apply it to
   * place a sprite: the anchors are already in the trimmed frame's own
   * coordinates
   */
  get frameTrim(): Point {
    return this.clip?.target.trim ?? [0, 0];
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
   * Which row of the grid is being drawn.
   *
   * The grid says which orientations it holds and in what order — a
   * sleeping pokemon faces nowhere in particular and has one row — so
   * a facing the clip does not have falls back to its first
   */
  private get row(): number {
    const clip = this.clip;

    if (clip == null) {
      return 0;
    }

    const at = clip.target.directions.indexOf(this.facing);

    return at >= 0 && at < clip.rows ? at : 0;
  }

  /**
   * The anchors of the frame showing, as the description gives them
   */
  private get anchors(): SpriteFrameData | null {
    const clip = this.clip;

    if (clip == null) {
      return null;
    }
    return clip.target.frames[this.row * clip.target.columns + this.frame] ?? null;
  }

  /**
   * Where one part of the pokemon is on the frame showing, in frame
   * pixels from its top left corner.
   *
   * Markers go missing, and every kind has somewhere to fall back to
   * so that a caller placing a sprite always has a point to place it
   * by. The shadow is the one the rest lean on: it is marked on every
   * frame of every sheet that ships, and a frame without one falls back
   * to the bottom middle of its box, which is where a pokemon standing
   * in it has its feet.
   *
   * The body centre is the one worth explaining. **No sheet marks it
   * yet** — the collection's own files carry `center: null` on every
   * frame — so it is the middle of the parts that *are* marked: the
   * head and the two hands, averaged.
   *
   * Averaging all three is what makes it hold up. They sit around the
   * body rather than on it, so their middle is the body however they
   * are arranged, and the two that come in pairs cancel each other out
   * horizontally — which also means it does not matter if a sheet has
   * the three of them labelled in some other order. Measured against
   * the drawn pixels it lands within a few pixels of the middle of the
   * pokemon on every sheet that ships, including the birds, whose
   * shadow is a long way below anything drawn
   */
  anchor(kind: SpriteAnchor): Point | null {
    const clip = this.clip;
    const anchors = this.anchors;

    if (clip == null || anchors == null) {
      return null;
    }

    const { frameWidth, frameHeight } = clip.target;
    const shadow: Point = anchors.shadow ?? [(frameWidth - 1) / 2, frameHeight - 1];
    const marked = [anchors.head, anchors.left, anchors.right].filter(
      (point): point is Point => point != null,
    );
    const center = anchors.center ??
      middleOf(marked) ?? [(frameWidth - 1) / 2, (frameHeight - 1) / 2];
    const points: Record<SpriteAnchor, Point> = {
      shadow,
      center,
      head: anchors.head ?? center,
      left: anchors.left ?? center,
      right: anchors.right ?? center,
    };

    return points[kind];
  }

  /**
   * How big this pokemon's shadow is, at the scale it is drawn at. The
   * sheets carry a size for it, which is the one thing about a shadow
   * that belongs to the pokemon rather than to whatever it is standing
   * on
   */
  shadowRadius(scale = 1, squash = SHADOW_FLATNESS): { x: number; y: number } {
    // The cell rather than the trimmed frame: a pokemon's shadow is a
    // fact about the pokemon, and trimming would shrink it on the
    // animations where it happens to tuck its wings in
    const width = this.clip?.target.sourceFrameWidth ?? 0;
    const size = SHADOW_WIDTHS[this.data.anims.shadowSize] ?? SHADOW_WIDTHS[1];
    const across = width * size * scale;

    return { x: across, y: across * squash };
  }

  /**
   * Where the frame goes, for a point and the options it was given.
   *
   * Everything that has to agree about a sprite's position goes
   * through this: the anchor the caller named is put on the point it
   * gave, and the frame hangs off wherever that leaves it
   */
  private place(x: number, y: number, options: DrawOptions): Placement | null {
    const clip = this.clip;

    if (clip == null) {
      return null;
    }

    const { frameWidth, frameHeight } = clip.target;
    const scale = options.scale ?? 1;
    const flip = options.flip === true;
    const anchor = this.anchor(options.anchor ?? 'center') ?? [
      (frameWidth - 1) / 2,
      (frameHeight - 1) / 2,
    ];
    // Mirrored, the anchor is as far from the right edge of the frame
    // as it was from the left
    const acrossFrame = flip ? frameWidth - 1 - anchor[0] : anchor[0];

    return {
      left: clip.image.x + this.frame * frameWidth,
      top: clip.image.y + this.row * frameHeight,
      frameWidth,
      frameHeight,
      // The middle of the marked pixel rather than its corner: a
      // marker is a pixel, and half of one matters once a sprite is
      // drawn at four times its size
      originX: x - (acrossFrame + 0.5) * scale,
      originY: y - (anchor[1] + 0.5) * scale,
      width: frameWidth * scale,
      height: frameHeight * scale,
      scale,
      flip,
    };
  }

  /**
   * Where a part of the pokemon lands on the canvas, if it were drawn
   * at this point with these options.
   *
   * It is how anything else lines up with the sprite: a projectile
   * flies at a unit's body, a caption sits over its head, and neither
   * has to know how the frame is laid out
   */
  locate(kind: SpriteAnchor, x: number, y: number, options: DrawOptions = {}): Point | null {
    const placed = this.place(x, y, options);
    const point = this.anchor(kind);

    if (placed == null || point == null) {
      return null;
    }

    const across = (point[0] + 0.5) * placed.scale;

    return [
      placed.flip ? placed.originX + placed.width - across : placed.originX + across,
      placed.originY + (point[1] + 0.5) * placed.scale,
    ];
  }

  /**
   * The patch of ground the pokemon is standing on.
   *
   * Drawn by the caller rather than by `draw`, because whoever owns
   * the ground owns its shadows: a battle draws one under a unit on a
   * flat field, and the overworld board is tilted and squashes it
   * further
   */
  drawShadow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: ShadowOptions = {},
  ): void {
    const spot = this.locate('shadow', x, y, options);

    if (spot == null) {
      return;
    }

    const radius = this.shadowRadius(options.scale ?? 1, options.squash);

    context.save();
    context.beginPath();
    context.ellipse(spot[0], spot[1], radius.x, radius.y, 0, 0, Math.PI * 2);
    context.fillStyle = options.color ?? SHADOW_COLOR;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }
    context.fill();
    context.restore();
  }

  /**
   * Draw the current frame with `x`, `y` as the anchor point.
   *
   * Nothing is drawn before the sheet has arrived or before anything
   * has been played, which is deliberate: a canvas redrawing sixty
   * times a second should not have to check first
   */
  draw(context: CanvasRenderingContext2D, x: number, y: number, options: DrawOptions = {}): void {
    const image = this.image;
    const placed = this.place(x, y, options);

    if (image == null || placed == null) {
      return;
    }

    context.save();
    // Pixel art blown up: smoothing would turn a sprite into a smear
    context.imageSmoothingEnabled = false;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }

    if (placed.flip) {
      context.translate(placed.originX + placed.width, placed.originY);
      context.scale(-1, 1);
      context.drawImage(
        image,
        placed.left,
        placed.top,
        placed.frameWidth,
        placed.frameHeight,
        0,
        0,
        placed.width,
        placed.height,
      );
    } else {
      context.drawImage(
        image,
        placed.left,
        placed.top,
        placed.frameWidth,
        placed.frameHeight,
        placed.originX,
        placed.originY,
        placed.width,
        placed.height,
      );
    }
    context.restore();
  }
}
