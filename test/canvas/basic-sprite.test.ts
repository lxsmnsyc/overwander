import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import BasicSprite, {
  type BasicSpriteData,
  asBasicSpriteData,
} from '../../src/canvas/basic-sprite';

/**
 * The atlas half of the sprite code: a sheet of pictures that do not
 * move, which is what every item icon in the game is.
 *
 * The sheets read here are the shipped ones rather than fixtures. A
 * fixture agrees with the code by construction; `public/sprites` is
 * what the browser will actually be handed.
 */
function readSheet(path: string): BasicSpriteData {
  return asBasicSpriteData(JSON.parse(readFileSync(path, 'utf8')));
}

const BALLS = readSheet('public/sprites/ui/items/balls/data.json');

/**
 * Somewhere to draw, and a record of what was asked for. The class
 * hands the browser a source rectangle and a destination rectangle
 * and nothing else, so that is the whole of what a test needs back
 */
function recorder(): {
  context: CanvasRenderingContext2D;
  calls: number[][];
} {
  const calls: number[][] = [];
  const context = {
    globalAlpha: 1,
    drawImage: (_image: unknown, ...rest: number[]) => {
      calls.push(rest);
    },
  };

  // The stub answers the two members `draw` touches; the cast is what
  // lets a test hold it where a real context goes
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

/**
 * A sheet with an image already in it, since nothing can be drawn
 * before one has loaded and there is no browser here to load one
 */
function loaded(data: BasicSpriteData): BasicSprite {
  const sprite = new BasicSprite('image.png', data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

describe('basic sprite data', () => {
  it('reads a shipped sheet', () => {
    expect(BALLS.width).toBeGreaterThan(0);
    expect(BALLS.height).toBeGreaterThan(0);
    expect(BALLS.images.length).toBeGreaterThan(0);
  });

  it('fills in what a broken one leaves out rather than throwing', () => {
    const empty = asBasicSpriteData({ images: [{}] });

    expect(empty.width).toBe(0);
    expect(empty.images[0]).toEqual({
      name: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      sourceWidth: 0,
      sourceHeight: 0,
      trim: [0, 0],
    });
    expect(asBasicSpriteData(null).images).toEqual([]);
  });
});

describe('basic sprite', () => {
  it('answers by the bare name rather than the file the picture came from', () => {
    const sprite = new BasicSprite('image.png', BALLS);

    // The sheets name their sub-images after the files they were cut
    // from; a caller asks for the ball
    expect(sprite.has('poke')).toBe(true);
    expect(sprite.has('poke.png')).toBe(false);
    expect(sprite.names).toContain('master');
    expect(sprite.has('cheri')).toBe(false);
  });

  it('leaves out a picture the sheet does not really have', () => {
    const sprite = new BasicSprite(
      'image.png',
      asBasicSpriteData({
        width: 32,
        height: 32,
        images: [
          { name: 'real.png', x: 0, y: 0, width: 32, height: 32 },
          { name: 'hollow.png', x: 0, y: 0, width: 0, height: 0 },
        ],
      }),
    );

    expect(sprite.has('real')).toBe(true);
    // Drawn, it would be a slice of whatever happens to sit there
    expect(sprite.has('hollow')).toBe(false);
    expect(sprite.sizeOf('hollow')).toEqual({ width: 0, height: 0 });
  });

  it('says how big a picture is, for whatever is drawn around it', () => {
    const sprite = new BasicSprite('image.png', BALLS);
    const size = sprite.sizeOf('poke');

    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it('has nothing to draw before the sheet has arrived', () => {
    const sprite = new BasicSprite('image.png', BALLS);
    const { context, calls } = recorder();

    sprite.draw(context, 'poke', 0, 0);
    expect(sprite.ready).toBe(false);
    expect(calls).toEqual([]);
  });

  it('draws nothing for a name it has not got', () => {
    const sprite = loaded(BALLS);
    const { context, calls } = recorder();

    sprite.draw(context, 'nothing-like-that', 0, 0);
    expect(calls).toEqual([]);
  });

  it('draws a picture at the size it was cut unless asked otherwise', () => {
    const sprite = loaded(
      asBasicSpriteData({
        width: 64,
        height: 32,
        // Twice as wide as it is tall, so anything squaring it off
        // would come out squashed
        images: [{ name: 'wide.png', x: 8, y: 4, width: 32, height: 16 }],
      }),
    );
    const { context, calls } = recorder();

    sprite.draw(context, 'wide', 0, 0, { anchor: 'top-left' });
    sprite.draw(context, 'wide', 0, 0, { scale: 2, anchor: 'top-left' });

    // Source is the sub-image, untouched; destination is the same size
    // as it, and twice it for a caller that asked for twice
    expect(calls[0]).toEqual([8, 4, 32, 16, 0, 0, 32, 16]);
    expect(calls[1]).toEqual([8, 4, 32, 16, 0, 0, 64, 32]);
  });

  it('scales the cell, not the picture left after trimming', () => {
    // Two icons drawn in the same cell, cropped differently: on a
    // compact sheet the smaller one has to stay smaller
    const sprite = loaded(
      asBasicSpriteData({
        compact: true,
        width: 64,
        height: 32,
        images: [
          {
            name: 'big.png',
            x: 0,
            y: 0,
            width: 32,
            height: 32,
            sourceWidth: 32,
            sourceHeight: 32,
            trim: [0, 0],
          },
          {
            name: 'small.png',
            x: 32,
            y: 0,
            width: 8,
            height: 8,
            sourceWidth: 32,
            sourceHeight: 32,
            trim: [12, 20],
          },
        ],
      }),
    );
    const { context, calls } = recorder();

    sprite.draw(context, 'big', 0, 0, { scale: 2, anchor: 'top-left' });
    sprite.draw(context, 'small', 0, 0, { scale: 2, anchor: 'top-left' });

    // The cell doubles, so the picture doubles with it: eight pixels
    // of icon stay eight pixels of icon
    expect(calls[0]).toEqual([0, 0, 32, 32, 0, 0, 64, 64]);
    // ...and it lands where it sat in the cell, twelve and twenty
    // pixels in, doubled
    expect(calls[1]).toEqual([32, 0, 8, 8, 24, 40, 16, 16]);
  });

  it('measures the cell an icon was drawn in, not what survived trimming', () => {
    const sprite = loaded(
      asBasicSpriteData({
        compact: true,
        width: 32,
        height: 32,
        images: [
          {
            name: 'trimmed.png',
            x: 0,
            y: 0,
            width: 20,
            height: 19,
            sourceWidth: 32,
            sourceHeight: 32,
            trim: [6, 7],
          },
        ],
      }),
    );

    // A caller sizing a row of icons is laying out boxes, and every
    // icon of a kind was drawn in the same one
    expect(sprite.sizeOf('trimmed')).toEqual({ width: 32, height: 32 });
  });

  it('reads a sheet that was never trimmed as a trim of nothing', () => {
    const plain = asBasicSpriteData({
      width: 32,
      height: 32,
      images: [{ name: 'square.png', x: 0, y: 0, width: 32, height: 24 }],
    });

    expect(plain.compact).toBe(false);
    expect(plain.images[0].sourceWidth).toBe(32);
    expect(plain.images[0].sourceHeight).toBe(24);
    expect(plain.images[0].trim).toEqual([0, 0]);
  });

  it('centres on the point unless asked for a corner', () => {
    const sprite = loaded(
      asBasicSpriteData({
        width: 32,
        height: 32,
        images: [{ name: 'square.png', x: 0, y: 0, width: 32, height: 32 }],
      }),
    );
    const { context, calls } = recorder();

    sprite.draw(context, 'square', 100, 50, { scale: 2 });
    sprite.draw(context, 'square', 100, 50, { scale: 2, anchor: 'top-left' });

    // Sixty-four across, so centred is thirty-two back from the point
    expect(calls[0].slice(4)).toEqual([68, 18, 64, 64]);
    expect(calls[1].slice(4)).toEqual([100, 50, 64, 64]);
  });

  it('puts back whatever transparency it was handed', () => {
    const sprite = loaded(BALLS);
    const { context } = recorder();

    context.globalAlpha = 0.5;
    sprite.draw(context, 'poke', 0, 0, { alpha: 0.25 });
    expect(context.globalAlpha).toBe(0.5);
  });
});
