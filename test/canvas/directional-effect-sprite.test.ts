import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import DirectionalEffectSprite from '../../src/canvas/directional-effect-sprite';
import {
  EFFECT_TICK,
  type EffectSpriteData,
  asEffectSpriteData,
} from '../../src/canvas/effect-sprite';

/**
 * The real thing: whatever is under `public/sprites/directional` is
 * what the canvases will be handed, so the tests read those rather than
 * a fixture that agrees with the code by construction.
 */
const ROOT = 'public/sprites/directional';

/**
 * The sheets that are actually there. A folder with no description in
 * it is one the packing tool has not finished writing, and it is
 * skipped rather than failed on — the sheets arrive a few at a time
 */
const SHEETS: { name: string; data: EffectSpriteData }[] = readdirSync(ROOT)
  .filter((id) => existsSync(`${ROOT}/${id}/data.json`))
  .sort((a, b) => Number(a) - Number(b))
  .map((id) => ({
    name: `${ROOT}/${id}`,
    data: asEffectSpriteData(JSON.parse(readFileSync(`${ROOT}/${id}/data.json`, 'utf8'))),
  }));

/** The long beam: a 32x240 cell, which is what a directional sheet is for. */
const BEAM = SHEETS[0].data;

/**
 * Somewhere to draw, and a record of what was asked for. A rotated
 * effect is a transform and a `drawImage`, so the transform calls are
 * recorded in the order they came in as well
 */
function recorder(): {
  context: CanvasRenderingContext2D;
  drawn: number[][];
  calls: string[];
  turns: number[];
  moves: number[][];
} {
  const drawn: number[][] = [];
  const calls: string[] = [];
  const turns: number[] = [];
  const moves: number[][] = [];
  const context = {
    globalAlpha: 1,
    save: () => {
      calls.push('save');
    },
    restore: () => {
      calls.push('restore');
    },
    translate: (x: number, y: number) => {
      calls.push('translate');
      moves.push([x, y]);
    },
    rotate: (angle: number) => {
      calls.push('rotate');
      turns.push(angle);
    },
    drawImage: (_image: unknown, ...rest: number[]) => {
      calls.push('drawImage');
      drawn.push(rest);
    },
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, drawn, calls, turns, moves };
}

/**
 * A sprite with an image already in it, since nothing can be drawn
 * before one has loaded and there is no browser here to load one
 */
function loaded(data: EffectSpriteData = BEAM): DirectionalEffectSprite {
  const sprite = new DirectionalEffectSprite('image.png', data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  sprite.play();
  return sprite;
}

describe('directional sprite metadata', () => {
  it('reads the shipped descriptions', () => {
    expect(SHEETS.length).toBeGreaterThan(0);

    for (const { name, data } of SHEETS) {
      expect(data.frames.length, `${name} frames`).toBeGreaterThan(0);
      expect(data.compact, `${name} trimmed`).toBe(true);

      const cells = new Set(
        data.frames.map((frame) => `${frame.sourceWidth}x${frame.sourceHeight}`),
      );

      expect([...cells], `${name} cell sizes`).toHaveLength(1);
    }
  });

  it('is drawn in a cell taller than it is wide, which is what makes it directional', () => {
    for (const { name, data } of SHEETS) {
      const frame = data.frames[0];

      expect(frame.sourceHeight, `${name} cell`).toBeGreaterThanOrEqual(frame.sourceWidth);
    }
  });
});

describe('DirectionalEffectSprite', () => {
  it('hangs from the top middle of its cell by default', () => {
    const sprite = loaded();

    expect(sprite.cellWidth).toBe(32);
    expect(sprite.cellHeight).toBe(240);
    expect(sprite.pivot).toEqual([16, 0]);
    expect(sprite.reach).toBe(240);
  });

  it('reaches only as far as the cell below the pivot', () => {
    const sprite = new DirectionalEffectSprite('image.png', BEAM, { pivot: [16, 90] });

    expect(sprite.reach).toBe(150);
  });

  it('draws straight down from the attach point when it is not turned', () => {
    const sprite = loaded();
    const { context, drawn, calls } = recorder();

    sprite.draw(context, 100, 50);
    // Frame 000 is 4x136 trimmed at [14, 2] out of a 32x240 cell, and
    // the cell's top left is half its width left of the attach point
    expect(drawn[0]?.slice(4)).toEqual([100 - 16 + 14, 50 + 2, 4, 136]);
    // Nothing pointing the way it was drawn needs a transform
    expect(calls).toEqual(['drawImage']);
  });

  it('turns about the attach point rather than about the sprite', () => {
    const sprite = loaded();
    const { context, drawn, calls, turns, moves } = recorder();

    sprite.rotation = 1;
    sprite.draw(context, 100, 50);
    expect(calls).toEqual(['save', 'translate', 'rotate', 'drawImage', 'restore']);
    expect(moves[0]).toEqual([100, 50]);
    expect(turns[0]).toBe(1);
    // The attach point is the origin under the transform, so the frame
    // is placed relative to nothing rather than relative to the caster
    expect(drawn[0]?.slice(4)).toEqual([-16 + 14, 2, 4, 136]);
  });

  it('aims along the line between two points', () => {
    const sprite = loaded();

    // The frames point down the screen, so a target below the attach
    // point needs no turn at all
    sprite.aimAt(100, 100, 100, 200);
    expect(sprite.rotation).toBeCloseTo(0);

    sprite.aimAt(100, 100, 200, 100);
    expect(sprite.rotation).toBeCloseTo(-Math.PI / 2);

    sprite.aimAt(100, 100, 100, 0);
    expect(Math.abs(sprite.rotation)).toBeCloseTo(Math.PI);

    sprite.aimAt(100, 100, 0, 100);
    expect(sprite.rotation).toBeCloseTo(Math.PI / 2);
  });

  it('leaves the aim alone when there is nowhere to aim', () => {
    const sprite = loaded();

    sprite.rotation = 0.75;
    sprite.aimAt(100, 100, 100, 100);
    expect(sprite.rotation).toBe(0.75);
  });

  it('stretches to cover the distance it was given', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    // Half the beam's 240 reach is half scale, so the 4x136 frame is
    // drawn at 2x68
    sprite.draw(context, 0, 0, { distance: 120 });
    expect(drawn[0]?.slice(6)).toEqual([2, 68]);

    sprite.draw(context, 0, 0, { scale: 2 });
    expect(drawn[1]?.slice(6)).toEqual([8, 272]);
  });

  it('measures the distance a caller has to cover', () => {
    expect(DirectionalEffectSprite.distanceBetween(0, 0, 3, 4)).toBe(5);
  });

  it('points somewhere for one draw without being turned', () => {
    const sprite = loaded();
    const { context, turns } = recorder();

    sprite.draw(context, 0, 0, { rotation: 2 });
    expect(turns[0]).toBe(2);
    expect(sprite.rotation).toBe(0);
  });

  it('plays the timeline the same way an upright effect does', () => {
    const sprite = loaded();

    expect(sprite.length).toBe(39);
    expect(sprite.frame?.index).toBe(0);
    sprite.advance(EFFECT_TICK);
    expect(sprite.frame?.index).toBe(1);
    sprite.advance(1000);
    expect(sprite.finished).toBe(true);
  });

  it('shares the sheet with a clone, aim and all', () => {
    const sprite = loaded();

    sprite.rotation = 0.5;
    sprite.pivot = [8, 4];

    const other = sprite.clone();

    expect(other.ready).toBe(true);
    expect(other.rotation).toBe(0.5);
    expect(other.pivot).toEqual([8, 4]);

    // The pivot is copied rather than shared, so turning one does not
    // move the other
    other.pivot[0] = 30;
    expect(sprite.pivot[0]).toBe(8);

    sprite.advance(2 * EFFECT_TICK);
    expect(sprite.frame?.index).toBe(2);
    expect(other.frame?.index).toBe(0);
  });

  it('draws nothing before the sheet has arrived', () => {
    const sprite = new DirectionalEffectSprite('image.png', BEAM);
    const { context, drawn } = recorder();

    sprite.play();
    sprite.draw(context, 0, 0);
    expect(drawn).toHaveLength(0);
  });
});
