import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import EffectSprite, {
  EFFECT_TICK,
  type EffectSpriteData,
  asEffectSpriteData,
} from '../../src/canvas/effect-sprite';

/**
 * The real thing: whatever is under `public/sprites` is what the
 * canvases will be handed, so the tests read those rather than a
 * fixture that agrees with the code by construction.
 */
// The directional sheets are the same description in the same shape,
// and are meant to be playable as ordinary effects as well as aimed
// ones, so they are held to the same rules here
const ROOTS = ['public/sprites/effects', 'public/sprites/particles', 'public/sprites/directional'];

const SHEETS: { name: string; data: EffectSpriteData }[] = ROOTS.flatMap((root) =>
  readdirSync(root)
    // A folder with no description in it is one the packing tool has
    // not finished writing, and it is skipped rather than failed on
    .filter((id) => existsSync(`${root}/${id}/data.json`))
    .sort((a, b) => Number(a) - Number(b))
    .map((id) => ({
      name: `${root}/${id}`,
      data: asEffectSpriteData(JSON.parse(readFileSync(`${root}/${id}/data.json`, 'utf8'))),
    })),
);

/**
 * One field of a parsed description, without trusting what the file
 * turned out to hold
 */
function fieldOf(value: unknown, key: string): unknown {
  return typeof value === 'object' && value != null && key in value
    ? Object.getOwnPropertyDescriptor(value, key)?.value
    : undefined;
}

/**
 * A sheet whose frame numbers have holes in them, which is the case
 * the timeline exists for
 */
const HOLED: EffectSpriteData = asEffectSpriteData({
  compact: true,
  width: 64,
  height: 64,
  images: [
    {
      name: '000.png',
      x: 0,
      y: 0,
      width: 8,
      height: 8,
      sourceWidth: 32,
      sourceHeight: 24,
      trim: [12, 8],
    },
    {
      name: '002.png',
      x: 8,
      y: 0,
      width: 16,
      height: 16,
      sourceWidth: 32,
      sourceHeight: 24,
      trim: [8, 4],
    },
    {
      name: '005.png',
      x: 24,
      y: 0,
      width: 4,
      height: 4,
      sourceWidth: 32,
      sourceHeight: 24,
      trim: [14, 10],
    },
  ],
});

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
function loaded(data: EffectSpriteData = HOLED): EffectSprite {
  const sprite = new EffectSprite('image.png', data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

describe('effect sprite metadata', () => {
  it('reads the shipped descriptions', () => {
    expect(SHEETS.length).toBeGreaterThan(0);

    for (const { name, data } of SHEETS) {
      expect(data.frames.length, `${name} frames`).toBeGreaterThan(0);
      expect(data.width, `${name} sheet width`).toBeGreaterThan(0);
      expect(data.compact, `${name} trimmed`).toBe(true);
    }
  });

  it('draws every sheet from one cell', () => {
    for (const { name, data } of SHEETS) {
      const cells = new Set(
        data.frames.map((frame) => `${frame.sourceWidth}x${frame.sourceHeight}`),
      );

      expect([...cells], `${name} cell sizes`).toHaveLength(1);
    }
  });

  it('keeps every frame inside its cell and inside the sheet', () => {
    for (const { name, data } of SHEETS) {
      for (const frame of data.frames) {
        expect(frame.x + frame.width, `${name} ${frame.index} right edge`).toBeLessThanOrEqual(
          data.width,
        );
        expect(frame.y + frame.height, `${name} ${frame.index} bottom edge`).toBeLessThanOrEqual(
          data.height,
        );
        expect(
          frame.trim[0] + frame.width,
          `${name} ${frame.index} untrimmed width`,
        ).toBeLessThanOrEqual(frame.sourceWidth);
        expect(
          frame.trim[1] + frame.height,
          `${name} ${frame.index} untrimmed height`,
        ).toBeLessThanOrEqual(frame.sourceHeight);
      }
    }
  });

  it('numbers the frames in order and without repeats', () => {
    for (const { name, data } of SHEETS) {
      const indices = data.frames.map((frame) => frame.index);

      expect(new Set(indices).size, `${name} distinct ticks`).toBe(indices.length);
      expect(
        [...indices].sort((a, b) => a - b),
        `${name} order`,
      ).toEqual(indices);
    }
  });

  it('says of every shipped sheet whether it can be looped', () => {
    for (const { name } of SHEETS) {
      const raw = JSON.parse(readFileSync(`${name}/data.json`, 'utf8')) as unknown;

      // Read off the file rather than through the parser, which fills a
      // missing answer in as `false`: a sheet nobody has measured and a
      // sheet measured as unloopable must not look the same here
      expect(typeof fieldOf(raw, 'loops'), `${name} loops`).toBe('boolean');
    }
  });

  it('marks a sheet that ends on the frame it started on as looping', () => {
    // The one case that needs no judgement: if the last frame is the
    // same rectangle of the sheet as the first, the seam is invisible by
    // construction, and anything saying otherwise is measuring wrong
    for (const { name, data } of SHEETS) {
      if (data.frames.length < 2) {
        continue;
      }

      const first = data.frames[0];
      const last = data.frames[data.frames.length - 1];

      const same =
        first.x === last.x &&
        first.y === last.y &&
        first.width === last.width &&
        first.height === last.height;

      if (same) {
        expect(data.loops, `${name} ends where it began`).toBe(true);
      }
    }
  });

  it('reads a missing loop answer as one to play once', () => {
    // A description written before anything measured its seam, or by a
    // tool that does not know the field: the safe reading is that it
    // does not loop, since a wrong `true` flickers on screen
    expect(asEffectSpriteData({ compact: true, images: [] }).loops).toBe(false);
    expect(loaded(asEffectSpriteData({ loops: true, images: [] })).loops).toBe(true);
  });

  it('reads a description with nothing in it as an effect that draws nothing', () => {
    const sprite = loaded(asEffectSpriteData({}));

    expect(sprite.length).toBe(0);
    expect(sprite.ready).toBe(false);

    const { context, drawn } = recorder();

    sprite.play();
    sprite.draw(context, 0, 0);
    expect(drawn).toHaveLength(0);
  });
});

describe('EffectSprite', () => {
  it('holds a frame over the ticks the packer dropped', () => {
    const sprite = loaded();

    expect(sprite.length).toBe(6);
    sprite.play();

    for (const expected of [0, 0, 2, 2, 2, 5]) {
      expect(sprite.frame?.index).toBe(expected);
      sprite.advance(EFFECT_TICK);
    }
  });

  it('runs for as long as the timeline is, not as long as the frame list', () => {
    const sprite = loaded();

    sprite.play();
    expect(sprite.duration).toBeCloseTo(6 * EFFECT_TICK);
  });

  it('holds its last frame and reports itself finished', () => {
    const sprite = loaded();

    sprite.play();
    expect(sprite.finished).toBe(false);

    sprite.advance(1000);
    expect(sprite.finished).toBe(true);
    expect(sprite.progress).toBe(1);
    expect(sprite.frame?.index).toBe(5);
  });

  it('comes round again when it loops', () => {
    const sprite = loaded();

    sprite.play({ loop: true });
    sprite.advance(6 * EFFECT_TICK + EFFECT_TICK);
    expect(sprite.finished).toBe(false);
    expect(sprite.frame?.index).toBe(0);
  });

  it('stretches the whole clip into a window it was given', () => {
    const sprite = loaded();

    sprite.play({ duration: 600 });
    expect(sprite.duration).toBe(600);

    sprite.advance(300);
    expect(sprite.frame?.index).toBe(2);
    sprite.advance(299);
    expect(sprite.finished).toBe(false);
    sprite.advance(1);
    expect(sprite.finished).toBe(true);
  });

  it('freezes on stop and rewinds on play', () => {
    const sprite = loaded();

    sprite.play();
    sprite.advance(2 * EFFECT_TICK);
    sprite.stop();
    sprite.advance(1000);
    expect(sprite.frame?.index).toBe(2);

    sprite.play();
    expect(sprite.frame?.index).toBe(0);
  });

  it('places a trimmed frame where it was drawn in the cell', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.play();
    // The cell is 32x24 centred on (100, 100), so its top left is
    // (84, 88) and the frame sits at its trim inside that
    sprite.draw(context, 100, 100);
    expect(drawn[0]).toEqual([0, 0, 8, 8, 84 + 12, 88 + 8, 8, 8]);

    sprite.advance(2 * EFFECT_TICK);
    sprite.draw(context, 100, 100);
    expect(drawn[1]).toEqual([8, 0, 16, 16, 84 + 8, 88 + 4, 16, 16]);
  });

  it('anchors on the cell rather than on the frame', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.play();
    sprite.draw(context, 100, 100, { anchor: 'top-left' });
    expect(drawn[0]?.slice(4, 6)).toEqual([112, 108]);

    sprite.draw(context, 100, 100, { anchor: 'foot' });
    expect(drawn[1]?.slice(4, 6)).toEqual([96, 84]);
  });

  it('fits the cell to a box, not the frame showing', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.play();
    // 64 over the 32 wide cell is a doubling, so the 8px frame is
    // drawn at 16 rather than blown up to fill the box itself
    sprite.draw(context, 0, 0, { size: 64 });
    expect(drawn[0]?.slice(6)).toEqual([16, 16]);

    sprite.draw(context, 0, 0, { scale: 3 });
    expect(drawn[1]?.slice(6)).toEqual([24, 24]);
  });

  it('shares the sheet with a clone and nothing else', () => {
    const sprite = loaded();
    const other = sprite.clone();

    expect(other.ready).toBe(true);
    sprite.play();
    sprite.advance(2 * EFFECT_TICK);
    expect(sprite.frame?.index).toBe(2);
    expect(other.frame?.index).toBe(0);
    expect(other.finished).toBe(false);
  });

  it('shows, on every tick of every sheet, the frame the numbering says', () => {
    for (const { name, data } of SHEETS) {
      const sprite = loaded(data);

      sprite.play();
      for (let tick = 0; tick < sprite.length; tick += 1) {
        // The rule, worked out here from the names alone: a frame
        // starts on its own number and holds until the next number
        // there is, so the frame showing is the last one numbered at
        // or before this tick — and none at all before the first
        const due = data.frames.filter((frame) => frame.index <= tick).at(-1) ?? null;

        expect(sprite.frame?.index ?? null, `${name} tick ${tick}`).toBe(due?.index ?? null);
        sprite.advance(EFFECT_TICK);
      }
    }
  });

  it('gives the last frame of every sheet exactly one tick', () => {
    for (const { name, data } of SHEETS) {
      const sprite = loaded(data);
      const last = data.frames.at(-1);

      // Nothing follows the last frame to say when it ends, so the
      // timeline stops one tick after it starts
      expect(sprite.length, `${name} length`).toBe((last?.index ?? -1) + 1);

      sprite.play();
      sprite.advance((sprite.length - 1) * EFFECT_TICK);
      expect(sprite.frame?.index, `${name} last frame`).toBe(last?.index);
      expect(sprite.finished, `${name} still running`).toBe(false);

      sprite.advance(EFFECT_TICK);
      expect(sprite.finished, `${name} finished`).toBe(true);
    }
  });

  it('keeps the numbering proportional when the clip is stretched', () => {
    for (const { name, data } of SHEETS) {
      const natural = loaded(data);
      const stretched = loaded(data);

      natural.play();
      stretched.play({ duration: natural.duration * 3 });

      for (let tick = 0; tick < natural.length; tick += 1) {
        expect(stretched.frame?.index, `${name} tick ${tick}`).toBe(natural.frame?.index);
        natural.advance(EFFECT_TICK);
        stretched.advance(EFFECT_TICK * 3);
      }
    }
  });

  it('plays every shipped sheet from start to end', () => {
    for (const { name, data } of SHEETS) {
      const sprite = loaded(data);
      const seen = new Set<number>();

      const first = data.frames[0].index;

      sprite.play();
      for (let tick = 0; tick < sprite.length; tick += 1) {
        const frame = sprite.frame;

        // A sheet whose first picture is numbered above zero opens on
        // empty ticks — the packer had nothing to pack for them,
        // because the effect had not started yet
        if (tick >= first) {
          expect(frame, `${name} tick ${tick}`).not.toBeNull();
        }
        if (frame != null) {
          seen.add(frame.index);
        }
        sprite.advance(EFFECT_TICK);
      }
      expect(sprite.finished, `${name} finished`).toBe(true);
      // Every picture on the sheet gets its turn — a frame the
      // timeline never reaches is one the effect would never show
      expect(seen.size, `${name} frames shown`).toBe(data.frames.length);
    }
  });
});
