import { describe, expect, it } from 'vitest';
import { type BasicSpriteData, asBasicSpriteData } from '../../src/canvas/basic-sprite';
import OWCharSprite from '../../src/canvas/ow-char-sprite';

/**
 * A charset as the packing tool writes it: one 128x128 picture of a
 * four by four grid, packed at an offset so the tests catch a class
 * that assumes the grid starts at the top left of the sheet.
 */
const SHEET: BasicSpriteData = asBasicSpriteData({
  width: 256,
  height: 256,
  images: [
    { name: 'hero.png', x: 64, y: 32, width: 128, height: 128 },
    { name: 'dust.png', x: 0, y: 0, width: 16, height: 16 },
  ],
});

/**
 * Somewhere to draw, and a record of what was asked for. The class
 * hands the browser a source rectangle, a destination rectangle and
 * the odd ellipse, so that is the whole of what a test needs back
 */
function recorder(): {
  context: CanvasRenderingContext2D;
  drawn: number[][];
  ellipses: number[][];
} {
  const drawn: number[][] = [];
  const ellipses: number[][] = [];
  const context = {
    globalAlpha: 1,
    fillStyle: '',
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    fill: () => {},
    drawImage: (_image: unknown, ...rest: number[]) => {
      drawn.push(rest);
    },
    ellipse: (...rest: number[]) => {
      ellipses.push(rest);
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, drawn, ellipses };
}

/**
 * A sprite with an image already in it, since nothing can be drawn
 * before one has loaded and there is no browser here to load one
 */
function loaded(data: BasicSpriteData = SHEET): OWCharSprite {
  const sprite = new OWCharSprite('image.png', data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

describe('OWCharSprite', () => {
  it('cuts the grid out of the sub-image it was packed into', () => {
    const sprite = loaded();

    expect(sprite.frameWidth).toBe(32);
    expect(sprite.frameHeight).toBe(32);
    expect(sprite.ready).toBe(true);
  });

  it('takes the named grid over the biggest one', () => {
    const sprite = new OWCharSprite('image.png', SHEET, { grid: 'dust' });

    expect(sprite.frameWidth).toBe(4);
    expect(sprite.frameHeight).toBe(4);
  });

  it('draws nothing at all from a sheet with no grid on it', () => {
    const sprite = loaded(asBasicSpriteData({ width: 0, height: 0, images: [] }));
    const { context, drawn } = recorder();

    expect(sprite.ready).toBe(false);
    sprite.draw(context, 0, 0);
    expect(drawn).toHaveLength(0);
  });

  it('reads the row a facing is drawn on out of the grid', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    for (const facing of ['Down', 'Left', 'Right', 'Up'] as const) {
      sprite.facing = facing;
      sprite.draw(context, 0, 0);
    }
    expect(drawn.map((call) => call[1])).toEqual([32, 64, 96, 128]);
  });

  it('draws a diagonal as the sideways row nearest it', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    for (const facing of ['DownRight', 'UpRight', 'UpLeft', 'DownLeft'] as const) {
      sprite.facing = facing;
      sprite.draw(context, 0, 0);
    }
    // Right, Right, Left, Left — the rows at y 96 and y 64
    expect(drawn.map((call) => call[1])).toEqual([96, 96, 64, 64]);
    // The facing itself is remembered as it was set, so a caller
    // asking which way somebody is looking is not told a rounded answer
    expect(sprite.facing).toBe('DownLeft');
  });

  it('stands still until it is told it is moving', () => {
    const sprite = loaded();

    sprite.advance(1000);
    expect(sprite.frame).toBe(0);

    sprite.moving = true;
    expect(sprite.frame).toBe(0);
  });

  it('walks a frame per hold on the clock', () => {
    const sprite = loaded();
    const hold = (1000 / 60) * 8;

    sprite.moving = true;
    for (const expected of [1, 2, 3, 0, 1]) {
      sprite.advance(hold);
      expect(sprite.frame).toBe(expected);
    }
  });

  it('walks a frame per stride on the ground', () => {
    const sprite = loaded();

    sprite.advanceBy(8);
    expect(sprite.frame).toBe(1);
    sprite.advanceBy(16);
    expect(sprite.frame).toBe(3);
    // Standing still is what a step of nothing means, and the pose
    // comes back without the caller having to say so twice
    sprite.advanceBy(0);
    expect(sprite.moving).toBe(false);
    expect(sprite.frame).toBe(0);
  });

  it('rewinds the cycle on stopping and on turning', () => {
    const sprite = loaded();

    sprite.advanceBy(8);
    sprite.stop();
    sprite.moving = true;
    expect(sprite.frame).toBe(0);

    sprite.advanceBy(8);
    expect(sprite.frame).toBe(1);
    sprite.facing = 'Left';
    expect(sprite.frame).toBe(0);
    // Turning within a row is not turning, so the stride is kept
    sprite.advanceBy(8);
    sprite.facing = 'DownLeft';
    expect(sprite.frame).toBe(1);
  });

  it('plays the cycle it was given rather than the columns in order', () => {
    const sprite = new OWCharSprite('image.png', SHEET, { cycle: [1, 0, 3, 0], standFrame: 0 });

    sprite.moving = true;
    for (const expected of [1, 0, 3, 0, 1]) {
      expect(sprite.frame).toBe(expected);
      sprite.advanceBy(8);
    }
  });

  it('hangs the cell above the point it is standing on', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.draw(context, 100, 200);
    expect(drawn[0]).toEqual([64, 32, 32, 32, 84, 168, 32, 32]);

    sprite.draw(context, 100, 200, { anchor: 'center' });
    expect(drawn[1]?.slice(4, 6)).toEqual([84, 184]);

    sprite.draw(context, 100, 200, { anchor: 'top-left' });
    expect(drawn[2]?.slice(4, 6)).toEqual([100, 200]);
  });

  it('fits a cell to the box it was given', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.draw(context, 0, 0, { size: 64 });
    expect(drawn[0]?.slice(6)).toEqual([64, 64]);

    sprite.draw(context, 0, 0, { scale: 3 });
    expect(drawn[1]?.slice(6)).toEqual([96, 96]);
  });

  it('lays the shadow on the ground under the feet', () => {
    const sprite = loaded();
    const { context, ellipses } = recorder();

    sprite.draw(context, 100, 200, { shadow: true });
    expect(ellipses[0]?.slice(0, 4)).toEqual([100, 200, 32 * 0.44 * 0.5, 32 * 0.44 * 0.5 * 0.4]);
  });

  it('shares the sheet with a clone and nothing else', () => {
    const sprite = loaded();
    const other = sprite.clone();

    expect(other.ready).toBe(true);
    other.facing = 'Up';
    other.advanceBy(8);
    expect(sprite.facing).toBe('Down');
    expect(sprite.frame).toBe(0);
    expect(other.frame).toBe(1);
  });
});
