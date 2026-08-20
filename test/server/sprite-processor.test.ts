import { describe, expect, it } from 'vitest';
import readAnimData from '../../src/server/sprites/anim-data';
import markersFor from '../../src/server/sprites/markers';
import pack from '../../src/server/sprites/packing';
import { blank, blit } from '../../src/server/sprites/raster';
import type { Raster } from '../../src/server/sprites/raster';
import computeTrim from '../../src/server/sprites/trim';
import { animFilter } from '../../src/server/sprites/pmd';
import deduper, { drawPictures } from '../../src/server/sprites/dedupe';
import { extraDestination, pokemonDestination } from '../../src/server/sprites/files';
import { storedAs } from '../../src/components/admin/SpriteProcessor';
import { SpriteAnim } from '../../src/data/ids/sprite-anims';

/**
 * The sprite processor's arithmetic.
 *
 * Everything the page hands the server ends up in one of these: where
 * a box goes, how tight a frame can be cropped, which pixel was the
 * anchor, and what the file is called. They are tested apart from
 * `sharp` and the file system, since those two are the only parts that
 * are not a pure function of the pixels.
 */

/** An image with one filled rectangle in it, for the trim and marker tests. */
function drawn(
  width: number,
  height: number,
  filled: { x: number; y: number; width: number; height: number },
  color: [number, number, number, number] = [255, 255, 255, 255],
): Raster {
  const raster = blank(width, height);

  for (let y = filled.y; y < filled.y + filled.height; y += 1) {
    for (let x = filled.x; x < filled.x + filled.width; x += 1) {
      const at = (y * width + x) * 4;

      raster.data[at] = color[0];
      raster.data[at + 1] = color[1];
      raster.data[at + 2] = color[2];
      raster.data[at + 3] = color[3];
    }
  }
  return raster;
}

describe('packing', () => {
  it('puts every box somewhere inside the sheet it reports', () => {
    const boxes = [
      { w: 30, h: 10 },
      { w: 12, h: 40 },
      { w: 20, h: 20 },
      { w: 5, h: 5 },
    ];
    const packed = pack(boxes);

    expect(packed.placed, 'every box placed').toHaveLength(boxes.length);
    for (const { box, x, y } of packed.placed) {
      expect(x + box.w, 'inside the width').toBeLessThanOrEqual(packed.width);
      expect(y + box.h, 'inside the height').toBeLessThanOrEqual(packed.height);
    }
  });

  it('overlaps nothing', () => {
    const packed = pack([
      { w: 16, h: 16 },
      { w: 16, h: 16 },
      { w: 8, h: 24 },
      { w: 24, h: 8 },
      { w: 40, h: 12 },
    ]);

    for (const one of packed.placed) {
      for (const two of packed.placed) {
        if (one === two) {
          continue;
        }
        const apart =
          one.x + one.box.w <= two.x ||
          two.x + two.box.w <= one.x ||
          one.y + one.box.h <= two.y ||
          two.y + two.box.h <= one.y;

        expect(apart, 'two boxes on the same pixels').toBe(true);
      }
    }
  });

  it('has nothing to pack when handed nothing', () => {
    const packed = pack([]);

    expect(packed.width).toBe(0);
    expect(packed.placed).toEqual([]);
  });
});

describe('trimming', () => {
  it('finds the content of a single image', () => {
    const raster = drawn(20, 20, { x: 4, y: 6, width: 5, height: 3 });

    expect(computeTrim(raster, 20, 20, 1, 1)).toEqual({ x: 4, y: 6, width: 5, height: 3 });
  });

  it('keeps every frame on one grid', () => {
    // Two cells side by side, each drawn in a different place: the
    // rectangle has to hold both, or the frames stop lining up
    const raster = blank(20, 10);

    blit(
      raster,
      drawn(10, 10, { x: 2, y: 2, width: 2, height: 2 }),
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      },
      { x: 0, y: 0 },
    );
    blit(
      raster,
      drawn(10, 10, { x: 6, y: 5, width: 2, height: 2 }),
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      },
      { x: 10, y: 0 },
    );

    expect(computeTrim(raster, 10, 10, 2, 1)).toEqual({ x: 2, y: 2, width: 6, height: 5 });
  });

  it('leaves an empty image the size it came at', () => {
    expect(computeTrim(blank(8, 8), 8, 8, 1, 1)).toEqual({ x: 0, y: 0, width: 8, height: 8 });
  });
});

describe('the marks beside a frame', () => {
  it('averages a blob rather than taking its first pixel', () => {
    const shadow = drawn(16, 16, { x: 4, y: 8, width: 4, height: 2 });
    const found = markersFor(shadow, null, { x: 0, y: 0, width: 16, height: 16 }, [0, 0]);

    // The middle of a 4 × 2 blob at (4, 8), rounded
    expect(found.shadow).toEqual([6, 9]);
    expect(found.head, 'no offsets image to read').toBeNull();
  });

  it('tells the anchors apart by their channel', () => {
    const offsets = blank(16, 16);
    const put = (x: number, y: number, color: [number, number, number, number]): void => {
      blit(
        offsets,
        drawn(1, 1, { x: 0, y: 0, width: 1, height: 1 }, color),
        {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
        { x, y },
      );
    };

    put(1, 1, [255, 0, 0, 255]);
    put(2, 3, [0, 255, 0, 255]);
    put(4, 5, [0, 0, 255, 255]);
    put(6, 7, [255, 255, 255, 255]);

    const found = markersFor(null, offsets, { x: 0, y: 0, width: 16, height: 16 }, [0, 0]);

    expect(found.head).toEqual([1, 1]);
    expect(found.left).toEqual([2, 3]);
    expect(found.right).toEqual([4, 5]);
    expect(found.center).toEqual([6, 7]);
  });

  it('lets a mark fall outside the frame it was trimmed to', () => {
    // A shadow drawn below the feet is cropped off the picture, and its
    // anchor is negative rather than lost
    const shadow = drawn(16, 16, { x: 8, y: 1, width: 1, height: 1 });
    const found = markersFor(shadow, null, { x: 0, y: 0, width: 16, height: 16 }, [4, 6]);

    expect(found.shadow).toEqual([4, -5]);
  });
});

describe('AnimData.xml', () => {
  const SOURCE = `<?xml version="1.0"?>
<AnimData>
  <ShadowSize>2</ShadowSize>
  <Anims>
    <Anim>
      <Name>Walk</Name>
      <Index>0</Index>
      <FrameWidth>24</FrameWidth>
      <FrameHeight>32</FrameHeight>
      <Durations><Duration>4</Duration><Duration>6</Duration></Durations>
    </Anim>
    <Anim>
      <Name>Strike</Name>
      <Index>5</Index>
      <CopyOf>Walk</CopyOf>
    </Anim>
    <Anim>
      <Name>Sleep</Name>
      <Index>7</Index>
      <FrameWidth>16</FrameWidth>
      <FrameHeight>16</FrameHeight>
      <Durations><Duration>10</Duration></Durations>
    </Anim>
  </Anims>
</AnimData>`;

  it('reads the sizes and the frame times', () => {
    const data = readAnimData(SOURCE, animFilter(['Walk']));
    const walk = data.anims.find((anim) => anim.name === SpriteAnim.Walk);

    expect(data.shadowSize).toBe(2);
    expect(walk).toMatchObject({
      name: SpriteAnim.Walk,
      frameWidth: 24,
      frameHeight: 32,
      durations: [4, 6],
      target: SpriteAnim.Walk,
    });
  });

  it('resolves a copy against the animation it copies', () => {
    const data = readAnimData(SOURCE, animFilter(['Walk', 'Sleep']));
    const strike = data.anims.find((anim) => anim.name === SpriteAnim.Strike);

    // Kept because what it is *drawn from* is kept: a copy has no
    // image of its own
    expect(strike).toMatchObject({
      frameWidth: 24,
      frameHeight: 32,
      index: 5,
      target: SpriteAnim.Walk,
    });
  });

  it('drops what the filter does not name', () => {
    const data = readAnimData(SOURCE, animFilter(['Sleep']));

    // Filtered by the image an animation is *drawn from*, so a copy
    // rides in on whatever it copied and nothing else does
    expect(data.anims.map((anim) => anim.name)).toEqual([SpriteAnim.Sleep]);
    expect(readAnimData(SOURCE, animFilter(['Walk'])).anims.map((anim) => anim.name)).toEqual([
      SpriteAnim.Walk,
      SpriteAnim.Strike,
    ]);
  });

  it('refuses a filter that names nothing', () => {
    expect(() => animFilter([' '])).toThrow();
  });
});

describe('where a sheet is written', () => {
  it('files a pokemon under its coat, with one description for both', () => {
    expect(pokemonDestination({ species: 94, female: false, shiny: false })).toEqual({
      image: 'sprites/pokemon/kanto/regular/94.png',
      meta: 'sprites/pokemon/kanto/meta/94.json',
    });
    expect(pokemonDestination({ species: 94, female: false, shiny: true }).image).toBe(
      'sprites/pokemon/kanto/shiny/94.png',
    );
  });

  it('marks a female drawing on the coat and not on the description', () => {
    // Both coats share one description, so the suffix belongs to the
    // drawing alone
    const written = pokemonDestination({ species: 3, female: true, shiny: true });

    expect(written.image).toBe('sprites/pokemon/kanto/shiny/3_f.png');
    expect(written.meta).toBe('sprites/pokemon/kanto/meta/3.json');
  });

  it('keeps anything else out of the pokemon tree', () => {
    expect(extraDestination({ species: 12, female: false, shiny: false })).toEqual({
      image: 'sprites/extras/12.png',
      meta: 'sprites/extras/12.json',
    });
  });

  it('names all four drawings of one pokemon', () => {
    const four = [
      { female: false, shiny: false },
      { female: false, shiny: true },
      { female: true, shiny: false },
      { female: true, shiny: true },
    ].map((coat) => pokemonDestination({ species: 3, ...coat }));

    expect(four.map((written) => written.image)).toEqual([
      'sprites/pokemon/kanto/regular/3.png',
      'sprites/pokemon/kanto/shiny/3.png',
      'sprites/pokemon/kanto/regular/3_f.png',
      'sprites/pokemon/kanto/shiny/3_f.png',
    ]);
    // One description for the lot of them, which is why they have to
    // be packed to one layout
    expect(new Set(four.map((written) => written.meta)).size).toBe(1);
  });

  it('never lets a species number reach the path as anything but a number', () => {
    // The only thing the caller decides about a path, and it is cut to
    // a whole number before it is written into one
    expect(pokemonDestination({ species: 7.9, female: false, shiny: false }).image).toBe(
      'sprites/pokemon/kanto/regular/7.png',
    );
  });
});

describe('what the page says a drawing cost', () => {
  const sheet = { path: 'sprites/pokemon/kanto/regular/1.png', as: 'indexed 4-bit, none' };

  it('says what the container saved', () => {
    expect(storedAs({ ...sheet, bytes: 2048, plain: 8192, before: null })).toBe(
      '2.0K as indexed 4-bit, none, 75% off plain',
    );
  });

  it('says nothing about a saving there was not', () => {
    // The plainest container winning is not a saving, and a line
    // claiming 0% off would read as one
    expect(storedAs({ ...sheet, bytes: 4096, plain: 4096, before: null })).toBe(
      '4.0K as indexed 4-bit, none',
    );
  });

  it('measures a sheet against the one it replaced', () => {
    // The number worth noticing: a sheet that grew when it was
    // reprocessed is a sheet somebody should look at
    expect(storedAs({ ...sheet, bytes: 5000, plain: 9000, before: 4000 })).toBe(
      '4.9K as indexed 4-bit, none, 44% off plain, +1000B on 3.9K',
    );
    expect(storedAs({ ...sheet, bytes: 3000, plain: 9000, before: 4000 })).toContain('−1000B on');
    expect(storedAs({ ...sheet, bytes: 4000, plain: 9000, before: 4000 })).toContain(
      'same as before',
    );
  });
});

describe('drawing an animation into the sheet', () => {
  /** One column of two frames, each 4 × 4 with only its top half drawn. */
  function twoFrames(): Raster {
    const raster = blank(4, 8);
    const paint = (top: number, value: number): void => {
      for (let y = top; y < top + 2; y += 1) {
        for (let x = 0; x < 4; x += 1) {
          const at = (y * 4 + x) * 4;

          raster.data[at] = value;
          raster.data[at + 3] = 255;
        }
      }
    };

    paint(0, 40);
    paint(4, 90);
    return raster;
  }

  it('copies each frame out of its own cell when the grid was cropped', () => {
    const sheet = blank(4, 4);
    const source = twoFrames();
    const grid = {
      x: 0,
      y: 0,
      pitchX: 4,
      // Cropped at the bottom only, which is the case that used to
      // take a whole-image shortcut: the untrimmed picture was copied
      // into a box sized for the shorter frames, so the second frame
      // landed too low and the sheet lost its bottom
      pitchY: 4,
      offsetX: 0,
      offsetY: 0,
      frameWidth: 4,
      frameHeight: 2,
      columns: 1,
      rows: 2,
    };
    // Uncropped, so each frame is the whole of its box: the shortcut
    // this guards against is about where a box lands, not what is lit
    const kept = deduper(false);

    kept.add([{ raster: source, grid }], 0, 'one');
    drawPictures(
      sheet,
      kept.pictures,
      [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
      ],
      () => source,
    );

    const at = (y: number): number => sheet.data[y * 4 * 4];

    expect(kept.pictures, 'two different frames, both kept').toHaveLength(2);
    expect([at(0), at(1)], 'the first frame').toEqual([40, 40]);
    expect([at(2), at(3)], 'the second frame, not the first frame padding').toEqual([90, 90]);
  });
});
