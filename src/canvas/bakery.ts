/**
 * Art drawn in code, kept as a picture once it has been drawn.
 *
 * A tree, a landmark's disc, the ring under somebody's feet: each is
 * a handful of arcs and strokes, and each is exactly the same handful
 * every frame. Drawn once into a corner of one sheet, it is a picture
 * from then on, which is the only thing a batch of quads can carry.
 *
 * One sheet rather than one canvas per piece, so everything baked
 * lands in a single run of the batch. Pieces are square and anchored
 * at their middle, which is how all of this art is drawn: around a
 * point on the ground rather than from a corner.
 */

/** Where a baked piece sits on the sheet, in the sheet's own pixels. */
export interface Baked {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How large the sheet is. Big enough for every piece the board draws
 * at the size they are baked, small enough to upload without thought
 */
const SHEET = 1024;

/**
 * How much empty sheet is left around each piece.
 *
 * Not tidiness. A piece stamped smaller than it was baked is sampled
 * smoothly, and a sampler at the edge of a piece reaches past it:
 * packed edge to edge, a landmark's disc comes out wearing pieces of
 * its neighbour's letter
 */
const GUTTER = 4;

export default class Bakery {
  readonly sheet: HTMLCanvasElement;

  /**
   * Bumped whenever something new is drawn onto the sheet, so whoever
   * uploaded it knows the copy they hold is behind
   */
  revision = 0;

  private readonly context: CanvasRenderingContext2D | null;
  private readonly known = new Map<string, Baked>();

  /** Where the next piece goes: along the shelf, and how tall it is */
  private across = 0;
  private down = 0;
  private shelf = 0;

  constructor() {
    this.sheet = document.createElement('canvas');
    this.sheet.width = SHEET;
    this.sheet.height = SHEET;
    this.context = this.sheet.getContext('2d');
  }

  /**
   * The piece under this name, drawn the first time it is asked for.
   *
   * `paint` is handed a context whose origin is the middle of a box
   * `box` tall and `wide` across, which is where these painters expect
   * to be drawing from. Square unless a caller says otherwise, since
   * most of this art is drawn around a point. Answers null when the
   * sheet is full or there is no context to draw with, and a caller
   * that gets one draws the old way
   */
  take(
    key: string,
    box: number,
    paint: (context: CanvasRenderingContext2D) => void,
    wide = box,
  ): Baked | null {
    const held = this.known.get(key);

    if (held != null) {
      return held;
    }
    if (this.context == null) {
      return null;
    }

    const size = Math.max(1, Math.ceil(box));
    const across = Math.max(1, Math.ceil(wide));

    if (this.across + across > SHEET) {
      this.across = 0;
      this.down += this.shelf + GUTTER;
      this.shelf = 0;
    }
    if (this.down + size > SHEET) {
      // Full. Nothing is thrown out to make room: every piece here is
      // asked for again next frame, so an eviction is a rebake a frame
      return null;
    }

    const spot: Baked = { x: this.across, y: this.down, width: across, height: size };

    this.context.save();
    this.context.clearRect(spot.x, spot.y, across, size);
    // Held to its own square. A painter handed something it did not
    // expect can draw a great deal larger than it means to, and on one
    // shared sheet that is every neighbour it reaches wearing the
    // overflow
    this.context.beginPath();
    this.context.rect(spot.x, spot.y, across, size);
    this.context.clip();
    this.context.translate(spot.x + across / 2, spot.y + size / 2);
    paint(this.context);
    this.context.restore();

    this.across += across + GUTTER;
    this.shelf = Math.max(this.shelf, size);
    this.known.set(key, spot);
    this.revision += 1;
    return spot;
  }
}
