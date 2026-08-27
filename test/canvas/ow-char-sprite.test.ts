import { describe, expect, it } from 'vitest';
import { type BasicSpriteData, asBasicSpriteData } from '../../src/canvas/basic-sprite';
import OWCharSprite, { gridLayoutOf } from '../../src/canvas/ow-char-sprite';

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

describe('the layout a sheet carries', () => {
  /** What the processor writes beside the pictures. */
  const described = {
    compact: true,
    width: 120,
    height: 176,
    grid: {
      columns: 3,
      rows: 8,
      frameWidth: 40,
      frameHeight: 22,
      sourceFrameWidth: 65,
      sourceFrameHeight: 65,
      trim: [17, 10],
    },
    images: [{ name: 'grid', x: 0, y: 0, width: 120, height: 176 }],
  };

  it('reads the grid the sheet was packed on', () => {
    // The cell it was cut from as well as the one it was cut to: two
    // charsets cropped differently still have that in common, so it is
    // what a board scales them by
    expect(gridLayoutOf(described)).toEqual({
      columns: 3,
      rows: 8,
      sourceFrameWidth: 65,
      sourceFrameHeight: 65,
    });
  });

  it('falls back to the cropped cell where a sheet says nothing', () => {
    const bare = new OWCharSprite('image.png', SHEET);

    expect([bare.sourceFrameWidth, bare.sourceFrameHeight]).toEqual([
      bare.frameWidth,
      bare.frameHeight,
    ]);
  });

  it('says nothing about a sheet that carries nothing', () => {
    expect(gridLayoutOf({ width: 64, height: 64, images: [] })).toEqual({});
    expect(gridLayoutOf(null)).toEqual({});
    expect(gridLayoutOf('grid')).toEqual({});
    // A grid nobody could act on is one to ignore rather than to halve
    expect(gridLayoutOf({ grid: { columns: 0, rows: -4 } })).toEqual({});
  });

  it('cuts the cells the way the sheet says, not the way four by four would', () => {
    const sprite = new OWCharSprite('image.png', asBasicSpriteData(described), {
      ...gridLayoutOf(described),
    });

    expect([sprite.columns, sprite.rows]).toEqual([3, 8]);
    // 120 across three and 176 down eight, rather than 30 x 44
    expect([sprite.frameWidth, sprite.frameHeight]).toEqual([40, 22]);
  });

  it('lets the caller overrule what the sheet says', () => {
    const sprite = new OWCharSprite('image.png', asBasicSpriteData(described), {
      columns: gridLayoutOf(described).columns,
      // A caller that knows better — a sheet whose bottom rows are
      // something other than facings
      rows: 4,
    });

    expect([sprite.columns, sprite.rows]).toEqual([3, 4]);
  });
});

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

    // Measured off the cell rather than the cropped frame, so it does
    // not grow and shrink with the swing of an arm
    sprite.drawShadow(context, 100, 200);
    expect(ellipses[0]?.slice(0, 4)).toEqual([100, 200, 32 * 0.24, 32 * 0.24 * 0.42]);
  });

  it('lies as flat as the ground it is on', () => {
    const sprite = loaded();
    const { context, ellipses } = recorder();

    sprite.drawShadow(context, 100, 200, { squash: 0.5 });
    expect(ellipses[0]?.[3]).toBe(32 * 0.24 * 0.5);
  });

  it('keeps a thrown shadow attached to the feet', () => {
    const sprite = loaded();
    const { context, ellipses } = recorder();
    const across = 32 * 0.24;

    sprite.drawShadow(context, 100, 200, { cast: { dx: 1, dy: 0, length: 1 } });

    // Slid out by half its own reach and stretched by as much, so the
    // near end is still where the feet are
    const [x, , radius] = ellipses[0];

    expect(radius).toBe(across * 2);
    expect(x - radius).toBeCloseTo(100 - across);
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
