import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import paintSky, { FALL_TABLE, thinningAt, worldDropAt } from '../../src/canvas/sky';
import Weather, { WEATHER_NAMES } from '../../src/data/overworld/weather';

/**
 * Painting the sky over the board.
 *
 * The board is the page, so its canvas is however large the window
 * is — and while a dialog is over it the element measures **zero**.
 * The moment the dialog is dismissed the next frame paints into that
 * size, so every sky has to survive being drawn into nothing.
 */

/**
 * A context that refuses what a browser's refuses.
 *
 * Two behaviours matter and neither is obvious. A `lineWidth` of zero
 * is not a line width: the browser ignores it and keeps whatever the
 * caller set before. And an arc of negative radius throws, which is
 * how a sky that walked its bands inward past nothing took the page
 * down with it
 */
/** Every field a sheen has written, newest last */
const painted: { width: number; height: number; data: Uint8ClampedArray }[] = [];

function stubContext(): CanvasRenderingContext2D {
  let lineWidth = 1;
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    // Zero is not a line width. The browser drops the assignment and
    // keeps the last good one, which is the whole of how the rainbow
    // came to ask for a negative arc
    get lineWidth(): number {
      return lineWidth;
    },
    set lineWidth(value: number) {
      if (Number.isFinite(value) && value > 0) {
        lineWidth = value;
      }
    },
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => undefined,
    closePath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    fill: () => undefined,
    fillRect: () => undefined,
    translate: () => undefined,
    rotate: () => undefined,
    scale: () => undefined,
    setTransform: () => undefined,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    createPattern: () => ({ setTransform: () => undefined }),
    arc: (_x: number, _y: number, radius: number) => {
      if (radius < 0) {
        throw new Error('IndexSizeError: The radius provided is negative.');
      }
    },
    ellipse: () => undefined,
    // The sheen is arithmetic per pixel written into a small canvas,
    // so the stub has to hand out somewhere to write and keep what
    // was written
    createImageData: (width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    }),
    putImageData: (image: { width: number; height: number; data: Uint8ClampedArray }) => {
      painted.push(image);
    },
    rect: () => undefined,
    drawImage: () => undefined,
  };

  // The stub answers the members the painters touch; the cast is what
  // lets a test hold it where a real context goes
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return context as unknown as CanvasRenderingContext2D;
}

/**
 * Every sky there is, read off the table that has to name them all
 * rather than off the enum, which is erased
 */
const SKIES: [sky: Weather, name: string][] = Object.entries(WEATHER_NAMES).map(([key, name]) => [
  Number(key),
  name,
]);

/**
 * The falls are tiled off a second canvas the browser hands out. There
 * is no browser here, so one is stood in for: what is being tested is
 * the arithmetic that reaches the context, not the tile it draws
 */
beforeAll(() => {
  // The tiled falls slide their pattern with a matrix, which is the
  // browser's rather than the language's
  vi.stubGlobal(
    'DOMMatrix',
    class {
      translate(): unknown {
        return this;
      }
      scale(): unknown {
        return this;
      }
    },
  );
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => stubContext(),
    }),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('the sky over the board', () => {
  it('survives a canvas that has not been laid out yet', () => {
    for (const [sky, name] of SKIES) {
      const drawing = (): void => {
        // A width the browser will not take, with the line width the
        // board leaves behind it
        const context = stubContext();

        context.lineWidth = 1;
        paintSky(context, 0, 0, sky, 0);
      };

      expect(drawing, name).not.toThrow();
    }
  });

  /**
   * A bow is a sheen rather than an arch: a field of colour worked
   * out per pixel into a small canvas and stretched over the picture.
   * The arch it replaced was a hoop standing in the field, and it
   * could put a band's radius past nothing and throw
   */
  describe('a bow drawn as a sheen', () => {
    /** The field a sky writes, and the spread of colour in it */
    const fieldOf = (
      sky: Weather,
      width = 960,
      height = 540,
    ): { size: [number, number]; spread: number; alpha: [number, number] } => {
      painted.length = 0;
      paintSky(stubContext(), width, height, sky, 4000);

      const field = painted.at(-1);

      if (field == null) {
        throw new Error(`${WEATHER_NAMES[sky]} wrote no field`);
      }
      let spread = 0;
      let low = 1;
      let high = 0;

      for (let at = 0; at < field.data.length; at += 4) {
        const [red, green, blue, alpha] = field.data.slice(at, at + 4);

        spread = Math.max(spread, Math.max(red, green, blue) - Math.min(red, green, blue));
        low = Math.min(low, alpha / 0xff);
        high = Math.max(high, alpha / 0xff);
      }
      return { size: [field.width, field.height], spread, alpha: [low, high] };
    };

    it('lays the spectrum across a rainbow and drains it for a fogbow', () => {
      // A rainbow is the whole hue wheel; a fogbow's drops are too
      // small to split the light, so it comes out all but white
      const bow = fieldOf(Weather.Rainbow).spread;

      expect(bow).toBeGreaterThan(0x80);
      expect(fieldOf(Weather.Fogbow).spread).toBeLessThan(bow / 4);
    });

    it('bands the light rather than laying a flat film', () => {
      const [low, high] = fieldOf(Weather.Rainbow).alpha;

      expect(high).toBeGreaterThan(0.5);
      expect(low).toBeLessThan(0.1);
    });

    it('works the field out at its own size whatever the window is', () => {
      expect(fieldOf(Weather.Rainbow, 3840, 2160).size).toEqual(
        fieldOf(Weather.Rainbow, 320, 240).size,
      );
    });
  });

  it('costs about the same however large the window is', () => {
    /** How many drops reach the context, which is one subpath each */
    const drops = (width: number, height: number): number => {
      let counted = 0;
      const context = stubContext();

      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      (context as unknown as { moveTo: () => void }).moveTo = () => {
        counted += 1;
      };
      paintSky(context, width, height, Weather.Blizzard, 0);
      return counted;
    };

    const small = drops(960, 540);
    const large = drops(3840, 2160);

    expect(small).toBeGreaterThan(0);
    // Sixteen times the pixels, and a density per pixel would draw
    // sixteen times the flakes. The fall is sized for the window
    // instead, so the count barely moves
    expect(large).toBeLessThan(small * 3);
  });
});

/**
 * The weather standing in the world rather than on the glass.
 *
 * A drop is a place in the world now, and the camera turns under it.
 * What that buys is worth a few guards, because the arithmetic has one
 * trap in it that nothing else in the file would catch.
 */
describe('a fall given a place in the world', () => {
  /** A real sky by name, since a made-up one proves nothing */
  const falling = (weather: Weather): NonNullable<(typeof FALL_TABLE)[Weather]> => {
    const fall = FALL_TABLE[weather];

    if (fall == null) {
      throw new Error(`${WEATHER_NAMES[weather]} has nothing falling in it`);
    }
    return fall;
  };

  const rain = falling(Weather.Rain);
  const breeze = falling(Weather.Breezy);
  const perBoard = 180;

  /**
   * The trap. A drop's place is `seconds * speed`, not a step added
   * each frame, so anything that moves with the camera and gets into
   * this arithmetic rewrites the whole history of the fall — the board
   * gives up room as it turns, and converting the fall's speed through
   * *that* scale made the rain surge back and forth in time with the
   * turn. The guard is the signature: there is no yaw to hand it
   */
  it('puts a drop in the same place whatever the camera is doing', () => {
    for (let at = 0; at < 40; at++) {
      const one = worldDropAt(rain, at, 12.5, perBoard);
      const other = worldDropAt(rain, at, 12.5, perBoard);

      expect(other).toEqual(one);
    }
  });

  it('keeps every drop inside the volume it wraps in', () => {
    const radius = 4.6 / 2;

    for (let at = 0; at < 400; at++) {
      const drop = worldDropAt(rain, at, 31.25, perBoard);

      expect(Math.abs(drop.u - 0.5), `drop ${at} across`).toBeLessThanOrEqual(radius + 0.5);
      expect(drop.h, `drop ${at} up`).toBeGreaterThanOrEqual(0);
      expect(drop.h, `drop ${at} up`).toBeLessThanOrEqual(1.5);
    }
  });

  /**
   * The flat sky leans a streak by `drift / speed` and gets away with
   * it because the streak is a handful of pixels either way. In the
   * world that ratio is the whole length, and a breeze at sixty parts
   * sideways to five down drew a streak eleven board widths long
   */
  it('draws a streak its own length however hard the wind blows', () => {
    const lengthOf = (fall: typeof rain): number => {
      const drop = worldDropAt(fall, 3, 4, perBoard);

      return Math.hypot(drop.tailU - drop.u, drop.tailH - drop.h);
    };

    // Rain falls nearly straight down and a breeze is nearly sideways
    expect(lengthOf(rain)).toBeCloseTo((rain.length / perBoard) * 1.5, 6);
    expect(lengthOf(breeze)).toBeCloseTo((breeze.length / perBoard) * 1.5, 6);
  });

  /**
   * A slab of world at arm's length projects onto more screen than the
   * same slab at the horizon, so an even world density piles into a
   * mat along the far edge unless the far half is thinned
   */
  it('keeps everything close and almost nothing at the horizon', () => {
    // The queue is uniform over 0 to 1, so the share kept is the share
    // of the queue below the line. Only the drops within a band of it
    // are dimmed, which is what keeps one from blinking as the camera
    // carries it past
    expect(thinningAt(2, 0.5)).toBe(1);
    expect(thinningAt(2, 0.95)).toBeLessThan(1);
    expect(thinningAt(1.6, 0.5)).toBeGreaterThan(0);
    expect(thinningAt(0.4, 0.5)).toBeLessThanOrEqual(0);
    // Nearer keeps more than further, at the same place in the queue
    expect(thinningAt(1.2, 0.4)).toBeGreaterThan(thinningAt(0.8, 0.4));
  });
});
