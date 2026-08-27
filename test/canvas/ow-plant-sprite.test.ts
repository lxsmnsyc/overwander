import { describe, expect, it } from 'vitest';
import { type BasicSpriteData, asBasicSpriteData } from '../../src/canvas/basic-sprite';
import OWPlantSprite, { plantLayoutOf } from '../../src/canvas/ow-plant-sprite';
import { SPRITE_TICK } from '../../src/canvas/sprite-sheet';

/**
 * A berry plant as the plant script writes it: two frames across and
 * three stages down, packed at an offset so a class that assumes the
 * grid starts at the top left of the sheet is caught.
 */
const SHEET: BasicSpriteData = asBasicSpriteData({
  width: 128,
  height: 128,
  images: [
    { name: 'grid', x: 8, y: 12, width: 40, height: 96 },
    { name: 'stray.png', x: 100, y: 100, width: 4, height: 4 },
  ],
});

/** What the plant script writes beside the picture. */
const DESCRIBED = {
  compact: true,
  width: 40,
  height: 96,
  grid: {
    columns: 2,
    rows: 3,
    frameWidth: 20,
    frameHeight: 32,
    sourceFrameWidth: 22,
    sourceFrameHeight: 34,
    trim: [1, 2],
  },
  images: [{ name: 'grid', x: 0, y: 0, width: 40, height: 96 }],
};

function recorder(): { context: CanvasRenderingContext2D; drawn: number[][] } {
  const drawn: number[][] = [];
  const context = {
    globalAlpha: 1,
    drawImage: (_image: unknown, ...rest: number[]) => {
      drawn.push(rest);
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, drawn };
}

/**
 * A sprite with an image already in it, since nothing can be drawn
 * before one has loaded and there is no browser here to load one
 */
function loaded(data: BasicSpriteData = SHEET): OWPlantSprite {
  const sprite = new OWPlantSprite('image.png', data, { columns: 2, rows: 3 });

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

describe('the layout a plant sheet carries', () => {
  it('reads the grid the plant was packed on', () => {
    expect(plantLayoutOf(DESCRIBED)).toEqual({
      columns: 2,
      rows: 3,
      sourceFrameWidth: 22,
      sourceFrameHeight: 34,
    });
  });

  it('carries nothing out of a description that says nothing', () => {
    expect(plantLayoutOf(null)).toEqual({});
    expect(plantLayoutOf({})).toEqual({});
    expect(plantLayoutOf({ grid: 'no' })).toEqual({});
    // A key with nothing usable under it must not overrule a caller
    expect(plantLayoutOf({ grid: { columns: 0, rows: -3 } })).toEqual({});
  });
});

describe('a berry plant on the board', () => {
  it('cuts the grid into stages down and frames across', () => {
    const plant = loaded();

    expect(plant.frames).toBe(2);
    expect(plant.stages).toBe(3);
    expect(plant.frameWidth).toBe(20);
    expect(plant.frameHeight).toBe(32);
    // The grown plant is the bottom row, which is what a patch draws
    expect(plant.ripe).toBe(2);
  });

  it('finds every cell from the offset the grid was packed at', () => {
    const plant = loaded();

    expect(plant.rectOf(0, 0)).toEqual({ x: 8, y: 12, width: 20, height: 32 });
    expect(plant.rectOf(0, 1)).toEqual({ x: 28, y: 12, width: 20, height: 32 });
    // Stages run top to bottom, so the ripe one is two rows down
    expect(plant.rectOf(2, 0)).toEqual({ x: 8, y: 76, width: 20, height: 32 });
    expect(plant.rectOf(2, 1)).toEqual({ x: 28, y: 76, width: 20, height: 32 });
  });

  it('clamps a stage nobody drew rather than drawing off the sheet', () => {
    const plant = loaded();

    expect(plant.rectOf(-4, 0)).toEqual(plant.rectOf(0, 0));
    expect(plant.rectOf(9, 0)).toEqual(plant.rectOf(2, 0));
  });

  it('reads the frame off the clock, and wraps', () => {
    const plant = loaded();
    const hold = SPRITE_TICK * 12;

    expect(plant.frameAt(0)).toBe(0);
    expect(plant.frameAt(hold - 1)).toBe(0);
    expect(plant.frameAt(hold)).toBe(1);
    expect(plant.frameAt(hold * 2)).toBe(0);
    // However long the board has been open
    expect(plant.frameAt(hold * 101)).toBe(1);
  });

  it('puts two bushes out of step when they are given different phases', () => {
    const plant = loaded();
    const hold = SPRITE_TICK * 12;

    // Half a frame in, the phased one has already turned over
    expect(plant.frameAt(hold * 0.6, 0)).toBe(0);
    expect(plant.frameAt(hold * 0.6, 0.5)).toBe(1);
  });

  it('draws the ripe stage by default, with the soil on the point given', () => {
    const plant = loaded();
    const { context, drawn } = recorder();

    plant.draw(context, 100, 200, { scale: 2 });

    // Source is the bottom-left cell, drawn 40x64 with the point at
    // the bottom middle of it
    expect(drawn).toEqual([[8, 76, 20, 32, 80, 136, 40, 64]]);
  });

  it('draws an earlier stage when asked for one', () => {
    const plant = loaded();
    const { context, drawn } = recorder();

    plant.draw(context, 0, 0, { stage: 0, anchor: 'top-left' });

    expect(drawn[0].slice(0, 4)).toEqual([8, 12, 20, 32]);
  });

  it('draws nothing off a sheet with no grid on it', () => {
    const bare = loaded(asBasicSpriteData({ width: 0, height: 0, images: [] }));
    const { context, drawn } = recorder();

    expect(bare.ready).toBe(false);
    bare.draw(context, 0, 0);
    expect(drawn).toEqual([]);
  });
});
