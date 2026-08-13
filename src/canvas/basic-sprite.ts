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
 * every sub-image sits and an `image.png` holding them, which is the
 * simplest thing a sprite sheet can be:
 *
 * ```json
 * { "width": 192, "height": 224,
 *   "images": [{ "name": "poke.png", "x": 128, "y": 128,
 *                "width": 32, "height": 32 }] }
 * ```
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
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BasicSpriteData {
  width: number;
  height: number;
  images: BasicSpriteImage[];
}

export interface BasicDrawOptions {
  /**
   * How much bigger to draw it than the sheet has it. Ignored when
   * `size` is given, which asks the same question the other way round
   */
  scale?: number;
  /**
   * The box to fit it in, in pixels. The picture is drawn as large as
   * fits without being stretched, which is what a caller with a slot
   * to fill actually wants — an icon column is a fixed width, and the
   * sheets are not all cut at the same size
   */
  size?: number;
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
    width: asNumber(root.width),
    height: asNumber(root.height),
    images: asArray(root.images).map((entry) => {
      const image = asRecord(entry);

      return {
        name: asString(image.name),
        x: asNumber(image.x),
        y: asNumber(image.y),
        width: asNumber(image.width),
        height: asNumber(image.height),
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
   * How big one picture is, before any scaling. A caller sizing a
   * canvas around an icon asks this; a name the sheet has not got
   * measures nothing
   */
  sizeOf(name: string): { width: number; height: number } {
    const image = this.images.get(name);

    return { width: image?.width ?? 0, height: image?.height ?? 0 };
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

    // A box to fit is answered as the scale that fits it, so there is
    // one path through the arithmetic below however the caller asked
    const scale =
      options.size != null && options.size > 0
        ? options.size / Math.max(image.width, image.height)
        : (options.scale ?? 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const left = options.anchor === 'top-left' ? x : x - width / 2;
    const top = options.anchor === 'top-left' ? y : y - height / 2;
    const alpha = context.globalAlpha;

    if (options.alpha != null) {
      context.globalAlpha = options.alpha;
    }
    context.drawImage(sheet, image.x, image.y, image.width, image.height, left, top, width, height);
    context.globalAlpha = alpha;
  }
}
