/**
 * An effect that comes out of something and points somewhere.
 *
 * [`EffectSprite`](./effect-sprite.ts) draws an explosion: it happens
 * at a place, it has no direction, and the point a caller gives it is
 * the middle of it. The sheets under `public/sprites/directional/{id}`
 * are the other kind. Effect 1 is a beam drawn in a 32x240 cell —
 * eight pixels wide and two hundred long, growing out of the very top
 * of the cell and reaching down the rest of it. Centred on a point and
 * drawn upright it is useless: it is not an explosion at a place, it is
 * a thing coming **out of** a place, and where it comes out of and
 * which way it points are the whole content of it.
 *
 * So the point a caller gives this class is not the middle of the
 * effect, it is the **attach point** — the place on the caster the
 * effect grows out of — and the sprite is hung from its own
 * top-centre and turned about that point. Everything else is the same:
 * the same trimmed frames put back in the same cells, the same timeline
 * read out of the same numbered names.
 *
 * ```text
 *          caster                     caster
 *            *  <- attach point         *
 *            |                           \
 *            |  rotation 0                 \  rotation ~0.6
 *            v                               v
 * ```
 *
 * At a rotation of nothing the effect hangs straight down from the
 * attach point, which is the way the artist drew it: the cell's top
 * edge is at the attach point and its length runs down the screen. A
 * caller that knows where it is aiming should not have to work that
 * out, so `aimAt` takes two points and turns the effect along the line
 * between them.
 *
 * The distinction is in the drawing rather than in the file. A
 * directional sheet is the same description an effect sheet is, so
 * anything under `directional` can be handed to `EffectSprite`
 * instead and played upright and centred like any other effect —
 * which is worth doing for the ones that read as a burst as well as a
 * beam. It is the same picture either way; only the point it is hung
 * from changes.
 */

import EffectSprite, { type EffectSpriteData, asEffectSpriteData } from './effect-sprite';

/** A position, as `[x, y]`. */
export type Point = [x: number, y: number];

/**
 * A quarter turn. At a rotation of nothing the art points down the
 * screen, and `atan2` calls that a quarter turn, so this is the
 * difference between the two ways of counting
 */
const QUARTER = Math.PI / 2;

export interface DirectionalEffectOptions {
  /**
   * Where on the cell the effect is pinned to the caster, in cell
   * pixels. The top middle by default, which is where these sheets
   * grow their effect out of
   */
  pivot?: Point;
  /**
   * Which way it points to begin with, in radians clockwise from
   * straight down
   */
  rotation?: number;
}

export interface DirectionalDrawOptions {
  /** How much bigger to draw it than the sheet has it. */
  scale?: number;
  /**
   * How far the effect should reach from the attach point, in pixels.
   * Answered as the scale that reaches it, so a caller joining a caster
   * to a target does not have to know how long the sheet's beam is
   */
  distance?: number;
  /**
   * Which way to point for this draw only, in radians. Left out, the
   * rotation the sprite is already set to is used
   */
  rotation?: number;
  alpha?: number;
}

export default class DirectionalEffectSprite extends EffectSprite {
  /** Where the effect is pinned to the caster, in cell pixels. */
  pivot: Point;

  /**
   * Which way it points, in radians clockwise from straight down —
   * straight down being the way the frames are drawn
   */
  rotation: number;

  constructor(source: string, data: EffectSpriteData, options: DirectionalEffectOptions = {}) {
    super(source, data);
    this.pivot = options.pivot ?? [this.cellWidth / 2, 0];
    this.rotation = options.rotation ?? 0;
  }

  /**
   * The sheet and its description, fetched together — `data.json` and
   * `image.png` under one folder
   */
  static override async fetch(
    basePath: string,
    options: DirectionalEffectOptions = {},
  ): Promise<DirectionalEffectSprite> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }
    return new DirectionalEffectSprite(
      `${basePath}/image.png`,
      asEffectSpriteData(await response.json()),
      options,
    );
  }

  /**
   * Another copy of the effect off the same sheet, pointing the same
   * way but with a playhead of its own
   */
  override clone(): DirectionalEffectSprite {
    const copy = new DirectionalEffectSprite(this.source, this.data, {
      pivot: [this.pivot[0], this.pivot[1]],
      rotation: this.rotation,
    });

    copy.image = this.image;
    copy.loading = this.loading;
    return copy;
  }

  /**
   * How far the effect reaches from the attach point at a scale of
   * one. It is the cell measured from the pivot rather than the cell
   * itself, so a beam pinned at its top reaches its full length and one
   * pinned at its middle reaches half of it
   */
  get reach(): number {
    return this.cellHeight - this.pivot[1];
  }

  /**
   * Point the effect from one place at another.
   *
   * The two points are the attach point and whatever is being aimed at;
   * the effect is turned along the line between them and nothing else
   * about it changes. A target on top of the attach point leaves the
   * rotation alone rather than snapping it to some arbitrary direction
   */
  aimAt(fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (dx !== 0 || dy !== 0) {
      this.rotation = Math.atan2(dy, dx) - QUARTER;
    }
  }

  /**
   * How far it is between two points — the distance an effect aimed
   * from one at the other has to cover, which is what `reach` wants
   */
  static distanceBetween(fromX: number, fromY: number, toX: number, toY: number): number {
    return Math.hypot(toX - fromX, toY - fromY);
  }

  /**
   * Draw the effect growing out of `x`, `y`.
   *
   * The point is on the **caster**, not on the effect: the sprite's
   * pivot is put there and the sprite is turned about it, so a caller
   * animating a beam only has to know where the caster's shoulder is
   * and which way it is pointing
   */
  override draw(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: DirectionalDrawOptions = {},
  ): void {
    const sheet = this.image;
    const frame = this.frame;

    if (sheet == null || frame == null) {
      return;
    }

    const reach = this.reach;
    const scale =
      options.distance != null && options.distance > 0 && reach > 0
        ? options.distance / reach
        : (options.scale ?? 1);
    const rotation = options.rotation ?? this.rotation;
    const alpha = context.globalAlpha;
    // The cell hangs off the pivot, and the trimmed frame sits at its
    // trim inside the cell — the same two-step placement the upright
    // effects use, done in the rotated frame of reference instead
    const left = -this.pivot[0] * scale + frame.trim[0] * scale;
    const top = -this.pivot[1] * scale + frame.trim[1] * scale;
    const width = frame.width * scale;
    const height = frame.height * scale;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }

    // An effect pointing the way it was drawn does not need a
    // transform, and most of them are pointing somewhere, so the cheap
    // path is worth having: this is drawn once per effect per frame
    if (rotation === 0) {
      context.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        x + left,
        y + top,
        width,
        height,
      );
    } else {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        left,
        top,
        width,
        height,
      );
      context.restore();
    }
    context.globalAlpha = alpha;
  }
}
