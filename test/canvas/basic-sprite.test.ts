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
    expect(empty.images[0]).toEqual({ name: '', x: 0, y: 0, width: 0, height: 0 });
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
    const sprite = new BasicSprite('image.png', {
      width: 32,
      height: 32,
      images: [
        { name: 'real.png', x: 0, y: 0, width: 32, height: 32 },
        { name: 'hollow.png', x: 0, y: 0, width: 0, height: 0 },
      ],
    });

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

  it('fits a picture to the box it was given without stretching it', () => {
    const sprite = loaded({
      width: 64,
      height: 32,
      // Twice as wide as it is tall, so a box that fitted by the
      // wrong side would come out squashed
      images: [{ name: 'wide.png', x: 8, y: 4, width: 32, height: 16 }],
    });
    const { context, calls } = recorder();

    sprite.draw(context, 'wide', 0, 0, { size: 64, anchor: 'top-left' });

    // Source is the sub-image, untouched; destination is twice its
    // size in both directions, which is the largest that fits in 64
    expect(calls).toEqual([[8, 4, 32, 16, 0, 0, 64, 32]]);
  });

  it('centres on the point unless asked for a corner', () => {
    const sprite = loaded({
      width: 32,
      height: 32,
      images: [{ name: 'square.png', x: 0, y: 0, width: 32, height: 32 }],
    });
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
