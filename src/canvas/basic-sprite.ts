/**
 * A sheet of pictures that do not move.
 *
 * [`SpeciesSpriteAnimation`](./species-sprite-animation.ts) is for
 * things that are alive: it carries a playhead, eight facings, frame
 * durations and a clock somebody else has to tick. An item icon has
 * none of that. It is one picture on a shared sheet, and everything
 * that class does with time is dead weight against it — a Poke Ball
 * does not need a rate, a direction or a frame index.
 *
 * So this is the other half: an **atlas**. The sheets under
 * `public/sprites/ui/items/{sheet}` are a `data.json` naming where
 * every sub-image sits and an `image.png` holding them:
 *
 * ```json
 * { "compact": true, "width": 110, "height": 129,
 *   "images": [{ "name": "beast.png", "x": 0, "y": 0,
 *                "width": 20, "height": 19,
 *                "sourceWidth": 32, "sourceHeight": 32,
 *                "trim": [6, 7] }] }
 * ```
 *
 * **A compact sheet stores each icon cropped to its lit pixels.** Every
 * item was drawn in the same 32x32 cell, and what is left after the
 * crop is however much of that cell the item filled — a Beast Ball
 * 20x19 of it, a Nugget rather less. So the **cell** is what a caller's
 * box is fitted to and the cropped picture is placed inside it at
 * `trim`: fitting the picture instead would blow a Nugget up to the
 * size of a ball and shift every icon by whatever was cropped off it.
 *
 * An older sheet carries neither field. It reads as a cell the size of
 * the picture under a trim of nothing, so nothing downstream has to ask
 * which kind of sheet it has.
 *
 * Having no state of its own is what makes it shareable: one loaded
 * sheet answers every caller at once, so thirty rows of a bag drawing
 * thirty different berries is one image and one description. There is
 * nothing to clone, because there is nothing to get out of step.
 */

export interface BasicSpriteImage {
  /**
   * What the picture is called on the sheet. The files carry the
   * `.png` the sub-image was cut from; callers ask by the bare name,
   * so the extension is taken off here rather than at every call
   */
  name: string;
  /** Where it sits on the sheet, at the size it is stored */
  x: number;
  y: number;
  width: number;
  height: number;
  /** The cell it was drawn in, which every icon on the sheet shares */
  sourceWidth: number;
  sourceHeight: number;
  /** Where the stored picture sits inside that cell */
  trim: [x: number, y: number];
}

export interface BasicSpriteData {
  /** Whether the pictures were cropped to their lit pixels before packing */
  compact: boolean;
  width: number;
  height: number;
  images: BasicSpriteImage[];
}

export interface BasicDrawOptions {
  /**
   * How much bigger to draw it than the sheet has it, in whole
   * multiples for anything that should stay crisp. It is the only
   * sizing there is: an atlas draws at the size it was cut, the way
   * the animated sheets do, and a caller with a box to fill decides
   * for itself what multiple of the cell fits it
   */
  scale?: number;
  /**
   * Where the point given to `draw` sits on the picture
   */
  anchor?: 'center' | 'top-left';
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
 * nothing rather than throw inside a draw call
 */
export function asBasicSpriteData(value: unknown): BasicSpriteData {
  const root = asRecord(value);

  return {
    compact: root.compact === true,
    width: asNumber(root.width),
    height: asNumber(root.height),
    images: asArray(root.images).map((entry) => {
      const image = asRecord(entry);
      const width = asNumber(image.width);
      const height = asNumber(image.height);
      const trim = asArray(image.trim);

      return {
        name: asString(image.name),
        x: asNumber(image.x),
        y: asNumber(image.y),
        width,
        height,
        // A sheet packed before the cropping existed says nothing about
        // a cell, and the picture is the whole of it
        sourceWidth: asNumber(image.sourceWidth) || width,
        sourceHeight: asNumber(image.sourceHeight) || height,
        trim: [asNumber(trim[0]), asNumber(trim[1])],
      };
    }),
  };
}

/**
 * The name a caller asks by. The sheets name their sub-images after
 * the files they were cut from, and a caller asking for `poke` should
 * not have to know that
 */
function bareName(name: string): string {
  return name.endsWith('.png') ? name.slice(0, -'.png'.length) : name;
}

export default class BasicSprite {
  /**
   * Where the sheet is, so a caller can tell two apart and a failed
   * load can say what failed
   */
  readonly source: string;

  readonly data: BasicSpriteData;

  private readonly images = new Map<string, BasicSpriteImage>();

  private image: HTMLImageElement | null = null;

  private loading: Promise<this> | null = null;

  constructor(source: string, data: BasicSpriteData) {
    this.source = source;
    this.data = data;

    for (const image of data.images) {
      // A sub-image with no size is one the sheet does not really
      // have; it is left out rather than drawn as a slice of whatever
      // sits at those coordinates
      if (image.width > 0 && image.height > 0) {
        this.images.set(bareName(image.name), image);
      }
    }
  }

  /**
   * The sheet and its description, fetched together. The description
   * is what says how to read the sheet, so neither is any use without
   * the other
   */
  static async fetch(basePath: string): Promise<BasicSprite> {
    const response = await fetch(`${basePath}/data.json`);

    if (!response.ok) {
      throw new Error(`No sprite data at ${basePath}`);
    }
    return new BasicSprite(`${basePath}/image.png`, asBasicSpriteData(await response.json()));
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
   * Whether there is a sheet to draw from yet. A canvas redrawing on
   * its own schedule asks this rather than awaiting
   */
  get ready(): boolean {
    return this.image != null;
  }

  /**
   * Every picture on it
   */
  get names(): string[] {
    return [...this.images.keys()];
  }

  has(name: string): boolean {
    return this.images.has(name);
  }

  /**
   * How big one picture is, before any scaling: the cell it was drawn
   * in rather than what survived the cropping, since a caller laying
   * out a row of icons is laying out cells. A name the sheet has not
   * got measures nothing
   */
  sizeOf(name: string): { width: number; height: number } {
    const image = this.images.get(name);

    return { width: image?.sourceWidth ?? 0, height: image?.sourceHeight ?? 0 };
  }

  /**
   * Draw one picture with `x`, `y` as the anchor point.
   *
   * Nothing is drawn before the sheet has arrived, or for a name it
   * has not got, which is deliberate: a caller should be able to draw
   * an icon it is still waiting for and get a gap for a frame rather
   * than an exception
   */
  draw(
    context: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    options: BasicDrawOptions = {},
  ): void {
    const image = this.images.get(name);
    const sheet = this.image;

    if (image == null || sheet == null) {
      return;
    }

    // Everything is measured off the **cell**, so two icons drawn in
    // the same 32x32 come out the same size however differently they
    // were cropped
    const scale = options.scale ?? 1;
    const cellWidth = image.sourceWidth * scale;
    const cellHeight = image.sourceHeight * scale;
    const left = options.anchor === 'top-left' ? x : x - cellWidth / 2;
    const top = options.anchor === 'top-left' ? y : y - cellHeight / 2;
    const alpha = context.globalAlpha;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }
    context.drawImage(
      sheet,
      image.x,
      image.y,
      image.width,
      image.height,
      // Placed where it sat in its cell, so an item drawn low in the
      // cell is still drawn low in it
      left + image.trim[0] * scale,
      top + image.trim[1] * scale,
      image.width * scale,
      image.height * scale,
    );
    context.globalAlpha = alpha;
  }
}
