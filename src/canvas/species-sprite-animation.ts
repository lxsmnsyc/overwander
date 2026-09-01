import type { ShadowPatch, SpriteQuad } from './placement';
import {
  type AnimData,
  type Point,
  SPRITE_DIRECTIONS,
  SPRITE_TICK,
  type SpriteAnchor,
  type SpriteDirection,
  type SpriteFrameData,
  type SpriteSheetJSON,
  type SpriteTargetData,
} from './sprite-sheet';
import type { Cast } from './daylight';
import type { SpriteAnim } from '../data/ids/sprite-anims';

/**
 * A pokemon on a canvas, moving.
 *
 * It knows nothing about pokemon, chunks or battles: handed a sheet,
 * told what to play, ticked with elapsed time and asked to draw at a
 * point, which is what lets both canvases share it.
 *
 * Placement is by **anchor** rather than corner: the caller names the
 * part it is placing (the shadow for something standing on a cell, the
 * body centre for a projectile's aim) and the frame lands so that part
 * sits on the point. Anchors are in the cropped frame's own
 * coordinates, so a trimmed sheet draws the same way
 */

/**
 * Re-exported so a caller reading a pokemon's clip does not have to
 * know which module the sheet vocabulary lives in. Every sheet in the
 * game counts in the same tick — see `SPRITE_FPS`
 */
export { SPRITE_TICK } from './sprite-sheet';

/**
 * How wide a shadow is for each `shadowSize` — small, ordinary, large —
 * as a fraction of the cell the frame was drawn in. Cells grow with
 * what is drawn in them, so a fraction reads both at once
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
   * Where the light is coming from, so the patch is thrown away from
   * it rather than sitting under the feet. Left out for a light with
   * no direction — an overcast field, a lit room, the small hours
   */
  cast?: Cast;
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
  /** The picture's rectangle on the sheet */
  left: number;
  top: number;
  frameWidth: number;
  frameHeight: number;
  /**
   * Where the picture hangs inside the frame's box, in sheet pixels
   * and already turned round for a mirrored draw
   */
  insetX: number;
  insetY: number;
  /** Where the frame's box lands, before any mirroring */
  originX: number;
  originY: number;
  width: number;
  height: number;
  scale: number;
  /**
   * Whether the pokemon is being drawn facing the other way. It is the
   * caller's flip alone, so a point on the frame lands where the eye
   * sees it
   */
  flip: boolean;
  /**
   * Whether the **picture** is drawn mirrored, which is the caller's
   * flip and the frame's own together: a deduped sheet keeps one of a
   * mirrored pair and marks the other as its reflection, and mirroring
   * that reflection twice is the pokemon facing the way it was drawn
   */
  mirror: boolean;
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

/**
 * One frame's marked points, in frame pixels from its top left. Every
 * kind falls back to something, so a caller always has a point to place
 * by: a missing shadow becomes the bottom middle of the box, where feet
 * are.
 *
 * The body centre falls back to the middle of the head and both hands,
 * for the sheets packed while the reader was missing the mark: those
 * three sit around the body rather than on it, so their middle is the
 * body however they are arranged, and the paired hands cancel out
 * horizontally
 */
function pointsOf(
  frame: SpriteFrameData,
  frameWidth: number,
  frameHeight: number,
): Record<SpriteAnchor, Point> {
  const shadow: Point = frame.shadow ?? [(frameWidth - 1) / 2, frameHeight - 1];
  const marked = [frame.head, frame.left, frame.right].filter(
    (point): point is Point => point != null,
  );
  const center = frame.center ?? middleOf(marked) ?? [(frameWidth - 1) / 2, (frameHeight - 1) / 2];

  return {
    shadow,
    center,
    head: frame.head ?? center,
    left: frame.left ?? center,
    right: frame.right ?? center,
  };
}

/**
 * A point of a frame, in canvas pixels, once the frame has been placed.
 * Half a pixel over, because a marker is a pixel and half of one shows
 * at four times the size
 */
function spotOf(point: Point, placed: Placement): Point {
  const across = (point[0] + 0.5) * placed.scale;

  return [
    placed.flip ? placed.originX + placed.width - across : placed.originX + across,
    placed.originY + (point[1] + 0.5) * placed.scale,
  ];
}

export default class SpeciesSpriteAnimation {
  /**
   * Where the sheet is, so a caller can tell two sprites apart and a
   * failed load can say what failed
   */
  readonly source: string;

  readonly data: SpriteSheetJSON;

  private readonly clips = new Map<SpriteAnim, Clip>();

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

    for (const anim of data.anims) {
      // A description that came over the wire is exactly the kind that
      // names a clip it does not carry
      const target = data.sprites[anim.target];

      // An animation whose anchors are missing is one this sheet does
      // not actually have; it is left out rather than drawn as a slice
      // of whatever happens to sit at those coordinates
      if (target == null || target.frameWidth <= 0 || target.frameHeight <= 0) {
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
        target,
        frames: Math.min(anim.durations.length, Math.max(1, target.columns)),
        rows: Math.max(1, target.rows),
        ends,
        duration: total,
      });
    }
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
  get animations(): SpriteAnim[] {
    return [...this.clips.keys()];
  }

  has(name: SpriteAnim): boolean {
    return this.clips.has(name);
  }

  /**
   * What is playing, or null before anything has been asked for
   */
  /**
   * How long one clip runs at the speed it was drawn at, in
   * milliseconds, or nothing for a clip this sheet does not carry
   */
  lengthOf(name: SpriteAnim): number {
    return this.clips.get(name)?.duration ?? 0;
  }

  get playing(): SpriteAnim | null {
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
   * How many pixels one frame covers before scaling — what is actually
   * painted, which on a trimmed sheet is smaller than the cell it was
   * drawn in. The cell is `sourceFrameSize`
   */
  get frameSize(): { width: number; height: number } {
    return {
      width: this.clip?.target.frameWidth ?? 0,
      height: this.clip?.target.frameHeight ?? 0,
    };
  }

  /**
   * The cell the artist drew in, as `AnimData.xml` gives it. It is the
   * stable measure of a pokemon's size: trimming follows whichever
   * pixels a particular animation lights, so a Swing and an Idle trim
   * differently while their cells agree
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
   * Which picture on the sheet the frame showing is drawn from, and
   * whether it is that picture reflected.
   *
   * A sheet keeps one copy of every repeated drawing, so the frame's
   * rectangle is the one it points at rather than its own square in a
   * grid — and a frame the packer kept the other way round is that
   * picture mirrored
   */
  private get picture(): {
    x: number;
    y: number;
    width: number;
    height: number;
    at: Point;
    mirrored: boolean;
  } | null {
    const clip = this.clip;

    if (clip == null) {
      return null;
    }
    const frame = this.anchorsAt(this.frame);
    const held = frame == null ? null : this.data.sheet.pictures[frame.cell];

    // A frame is a picture hung somewhere in its box. Without one there
    // is nothing to draw: a description that names no picture describes
    // no drawing
    if (held == null) {
      return null;
    }
    return {
      x: held.x,
      y: held.y,
      width: held.width,
      height: held.height,
      at: frame?.at ?? [0, 0],
      mirrored: frame?.flip === true,
    };
  }

  /**
   * Where the frame showing sits on the packed sheet, and whether the
   * picture there is the frame reflected.
   *
   * It is what a caller drawing the sheet as a CSS background needs:
   * `draw` works this out for itself, and a background has to be
   * scrolled to the same rectangle — and mirrored the same way — by
   * hand
   */
  get frameBox(): {
    x: number;
    y: number;
    width: number;
    height: number;
    mirrored: boolean;
  } | null {
    const clip = this.clip;
    const picture = this.picture;

    if (clip == null || picture == null) {
      return null;
    }

    return {
      x: picture.x,
      y: picture.y,
      width: picture.width,
      height: picture.height,
      mirrored: picture.mirrored,
    };
  }

  /**
   * Where the frame showing hangs inside its box. A caller placing the
   * picture itself needs it; anything drawing through `draw` does not
   */
  get frameInset(): Point {
    return this.picture?.at ?? [0, 0];
  }

  /**
   * Play an animation from the start, or carry on the one already
   * playing. Answers whether this sheet has it at all, so a caller can
   * fall back — not every pokemon has a Dance
   */
  play(name: SpriteAnim, options: PlayOptions = {}): boolean {
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

    const at = SPRITE_DIRECTIONS.indexOf(this.facing);

    return at >= 0 && at < clip.rows ? at : 0;
  }

  /**
   * The anchors of the frame showing, as the description gives them
   */
  private get anchors(): SpriteFrameData | null {
    return this.anchorsAt(this.frame);
  }

  /**
   * The anchors of one frame of the row being drawn
   */
  private anchorsAt(column: number): SpriteFrameData | null {
    const clip = this.clip;

    if (clip == null) {
      return null;
    }
    return clip.target.frames[this.row * clip.target.columns + column] ?? null;
  }

  /**
   * Where one part of the pokemon is on the current frame, in frame
   * pixels from its top left. Every kind falls back to something, so a
   * caller always has a point to place by: a missing shadow becomes the
   * bottom middle of the box, where feet are.
   *
   * The body centre falls back to the middle of the head and both
   * hands, for the sheets packed while the reader was missing the
   * mark: those three sit around the body rather than on it, so their
   * middle is the body however they are arranged
   */
  anchor(kind: SpriteAnchor): Point | null {
    const clip = this.clip;
    const anchors = this.anchors;

    if (clip == null || anchors == null) {
      return null;
    }
    return pointsOf(anchors, clip.target.frameWidth, clip.target.frameHeight)[kind];
  }

  /**
   * The same point on the **first** frame of the row.
   *
   * Placement registers on this rather than on the frame showing,
   * because the anchors travel with the body: pinning each frame's own
   * mark to one spot subtracts exactly the motion the artist drew. A
   * Charge bobs a pixel and its shadow mark bobs with it, so anchoring
   * frame by frame leaves the pokemon standing perfectly still.
   *
   * Public for the DOM sprite, whose box and shadow have to hold one
   * size for the whole clip for the same reason
   */
  resting(kind: SpriteAnchor): Point | null {
    const clip = this.clip;
    const anchors = this.anchorsAt(0);

    if (clip == null || anchors == null) {
      return null;
    }
    return pointsOf(anchors, clip.target.frameWidth, clip.target.frameHeight)[kind];
  }

  /**
   * How big this pokemon's shadow is, at the scale it is drawn at. The
   * sheets carry a size for it, which is the one thing about a shadow
   * that belongs to the pokemon rather than to whatever it is standing
   * on
   */
  /**
   * Which of the three sizes the game itself calls this pokemon:
   * small, ordinary, large. It is the only judgment of how big a
   * pokemon *is* that a sheet carries, since what is drawn measures
   * the pose and a Zubat with its wings out fills more of a frame
   * than a Bulbasaur does
   */
  get shadowSize(): number {
    return this.data.shadowSize;
  }

  shadowRadius(scale = 1, squash = SHADOW_FLATNESS): { x: number; y: number } {
    // The cell rather than the trimmed frame: a pokemon's shadow is a
    // fact about the pokemon, and trimming would shrink it on the
    // animations where it happens to tuck its wings in
    const width = this.clip?.target.sourceFrameWidth ?? 0;
    const size = SHADOW_WIDTHS[this.data.shadowSize] ?? SHADOW_WIDTHS[1];
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
    // Where the picture for this frame actually sits, which is its own
    // square on an old sheet and a shared one on a deduped sheet
    const picture = this.picture;
    const flip = options.flip === true;
    const anchor = this.resting(options.anchor ?? 'center') ?? [
      (frameWidth - 1) / 2,
      (frameHeight - 1) / 2,
    ];
    // Mirrored, the anchor is as far from the right edge of the frame
    // as it was from the left
    const acrossFrame = flip ? frameWidth - 1 - anchor[0] : anchor[0];

    const inset = picture?.at ?? [0, 0];
    const pictureWidth = picture?.width ?? frameWidth;
    const pictureHeight = picture?.height ?? frameHeight;

    return {
      left: picture?.x ?? 0,
      top: picture?.y ?? 0,
      frameWidth: pictureWidth,
      frameHeight: pictureHeight,
      // Turned round with the frame: mirrored, a picture sits as far
      // from the right edge of the box as it sat from the left
      insetX: flip ? frameWidth - inset[0] - pictureWidth : inset[0],
      insetY: inset[1],
      // The middle of the marked pixel rather than its corner: a
      // marker is a pixel, and half of one matters once a sprite is
      // drawn at four times its size
      originX: x - (acrossFrame + 0.5) * scale,
      originY: y - (anchor[1] + 0.5) * scale,
      width: frameWidth * scale,
      height: frameHeight * scale,
      scale,
      flip,
      // Two mirrors make a pokemon facing the way it was drawn
      mirror: flip !== (picture?.mirrored === true),
    };
  }

  /**
   * The box the pokemon would be drawn in, on the canvas.
   *
   * It is what a pointer is tested against: a sprite is a tall trimmed
   * frame rather than a circle round its feet, so anything guessing at
   * its size from the slot it stands on misses the head of a Charizard
   * and answers for empty ground beside a Diglett
   */
  bounds(
    x: number,
    y: number,
    options: DrawOptions = {},
  ): { left: number; top: number; width: number; height: number } | null {
    const placed = this.place(x, y, options);

    if (placed == null) {
      return null;
    }
    return {
      left: placed.originX,
      top: placed.originY,
      width: placed.width,
      height: placed.height,
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
    return spotOf(point, placed);
  }

  /**
   * The patch of ground the pokemon is standing on.
   *
   * Drawn by the caller rather than by `draw`, because whoever owns
   * the ground owns its shadows: a battle draws one under a unit on a
   * flat field, and the overworld board is tilted and squashes it
   * further
   */
  /** The patch this pokemon throws, for a caller stamping it */
  shadowOf(x: number, y: number, options: ShadowOptions = {}): ShadowPatch | null {
    const placed = this.place(x, y, options);
    // The resting mark, not the frame's: the ground does not rise with
    // a pokemon that has just left it
    const point = this.resting('shadow');
    const spot = placed == null || point == null ? null : spotOf(point, placed);

    if (spot == null) {
      return null;
    }

    const radius = this.shadowRadius(options.scale ?? 1, options.squash);
    const cast = options.cast;
    // Thrown away from the light: the patch slides out from under the
    // feet by half its own reach and stretches along the way it went,
    // which is what a shadow on flat ground does. The near end stays
    // at the feet — a shadow that let go of its caster reads as a
    // second thing lying on the floor
    const reach = cast == null ? 0 : cast.length * radius.x * 2;

    return {
      x: spot[0] + (cast?.dx ?? 0) * reach * 0.5,
      y: spot[1] + (cast?.dy ?? 0) * reach * 0.5,
      footX: spot[0],
      footY: spot[1],
      radiusX: radius.x + reach * 0.5,
      radiusY: radius.y,
      angle: cast == null ? 0 : Math.atan2(cast.dy, cast.dx),
      colour: options.color ?? SHADOW_COLOR,
      alpha: options.alpha ?? cast?.alpha ?? 1,
    };
  }

  drawShadow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: ShadowOptions = {},
  ): void {
    const patch = this.shadowOf(x, y, options);

    if (patch == null) {
      return;
    }
    context.save();
    context.beginPath();
    context.ellipse(patch.x, patch.y, patch.radiusX, patch.radiusY, patch.angle, 0, Math.PI * 2);
    context.fillStyle = patch.colour;
    context.globalAlpha = patch.alpha;
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
  /**
   * Where this frame is cut from and where it lands, for a caller
   * placing it as a quad rather than drawing it. A mirrored frame is
   * reported as mirrored rather than pre-flipped, since a quad turns
   * itself round with its corners
   */
  quadOf(x: number, y: number, options: DrawOptions = {}): SpriteQuad | null {
    const image = this.image;
    const placed = this.place(x, y, options);

    if (image == null || placed == null) {
      return null;
    }
    return {
      sheet: image,
      source: {
        x: placed.left,
        y: placed.top,
        width: placed.frameWidth,
        height: placed.frameHeight,
      },
      left: placed.originX + placed.insetX * placed.scale,
      top: placed.originY + placed.insetY * placed.scale,
      width: placed.frameWidth * placed.scale,
      height: placed.frameHeight * placed.scale,
      flip: placed.mirror,
    };
  }

  /**
   * The same frame as it would be drawn facing another way, without
   * turning the pokemon.
   *
   * What a shadow is cut from: the light sees the side of whatever it
   * is shining on, so a shadow thrown to the east is that pokemon's
   * eastward pose laid down. The facing is put back before this
   * returns
   */
  facedQuadOf(
    x: number,
    y: number,
    direction: SpriteDirection,
    options: DrawOptions = {},
  ): SpriteQuad | null {
    const held = this.facing;

    this.facing = direction;

    const quad = this.quadOf(x, y, options);

    this.facing = held;
    return quad;
  }

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

    const left = placed.originX + placed.insetX * placed.scale;
    const top = placed.originY + placed.insetY * placed.scale;
    const width = placed.frameWidth * placed.scale;
    const height = placed.frameHeight * placed.scale;

    if (placed.mirror) {
      context.translate(left + width, top);
      context.scale(-1, 1);
      context.drawImage(
        image,
        placed.left,
        placed.top,
        placed.frameWidth,
        placed.frameHeight,
        0,
        0,
        width,
        height,
      );
    } else {
      context.drawImage(
        image,
        placed.left,
        placed.top,
        placed.frameWidth,
        placed.frameHeight,
        left,
        top,
        width,
        height,
      );
    }
    context.restore();
  }
}
