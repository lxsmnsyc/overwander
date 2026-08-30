import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import paintSky from '../../src/canvas/sky';
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

  it('draws the rainbow as bands walking inward, never past nothing', () => {
    const radii: number[] = [];
    const context = stubContext();

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    (context as unknown as { arc: (x: number, y: number, radius: number) => void }).arc = (
      _x,
      _y,
      radius,
    ) => {
      radii.push(radius);
    };

    paintSky(context, 960, 540, Weather.Rainbow, 0);

    expect(radii).toHaveLength(6);
    for (const [at, radius] of radii.entries()) {
      expect(radius).toBeGreaterThan(0);
      if (at > 0) {
        expect(radius).toBeLessThan(radii[at - 1]);
      }
    }
  });
});
