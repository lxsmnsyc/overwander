import { describe, expect, it } from 'vitest';
import pack from '../../src/server/sprites/packing';
import { blank, blit, opaque } from '../../src/server/sprites/raster';
import type { Raster } from '../../src/server/sprites/raster';
import computeTrim from '../../src/server/sprites/trim';
import {
  extraDestination,
  overworldDestination,
  overworldSlug,
} from '../../src/server/sprites/files';
import {
  FACINGS,
  GRID_NAME,
  packPokengine,
  parseOrder,
  withCredit,
} from '../../src/server/sprites/pokengine';
import { storedAs } from '../../src/components/admin/sprite-processor/shared';

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

describe('where a sheet is written', () => {
  it('keeps anything else out of the pokemon tree', () => {
    expect(extraDestination('Battle Effects!')).toEqual({
      image: 'sprites/extras/battle-effects.png',
      meta: 'sprites/extras/battle-effects.json',
    });
  });

  it('files an extras sheet under a subfolder when the name has one', () => {
    expect(extraDestination('UI/Battle Effects')).toEqual({
      image: 'sprites/extras/ui/battle-effects.png',
      meta: 'sprites/extras/ui/battle-effects.json',
    });
    // The same slug rules as a charset's: a dotted segment reduces to
    // nothing and is refused rather than climbing out
    expect(() => extraDestination('../loose')).toThrow();
    expect(() => extraDestination('ui//loose')).toThrow();
  });
});

/**
 * A charset: one flat block per cell, each in its own colour, sitting
 * in the same corner of every cell with a margin around it. Cropping it
 * should take the margin and nothing else
 */
function charset(
  columns: number,
  rows: number,
  cell: number,
  content: { x: number; y: number; width: number; height: number },
): Raster {
  const raster = blank(columns * cell, rows * cell);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const shade = 20 + (row * columns + column) * 10;

      for (let y = 0; y < content.height; y += 1) {
        for (let x = 0; x < content.width; x += 1) {
          const at =
            ((row * cell + content.y + y) * raster.width + column * cell + content.x + x) * 4;

          raster.data[at] = shade;
          raster.data[at + 1] = shade;
          raster.data[at + 2] = shade;
          raster.data[at + 3] = 255;
        }
      }
    }
  }
  return raster;
}

describe('cutting a pokengine charset down', () => {
  const content = { x: 6, y: 8, width: 20, height: 22 };
  const straight = [...FACINGS];

  it('crops every cell by the same rectangle', () => {
    const { sheet, data } = packPokengine(charset(3, 4, 32, content), {
      order: straight,
      compact: true,
    });

    expect(data.grid.frameWidth).toBe(content.width);
    expect(data.grid.frameHeight).toBe(content.height);
    expect(data.grid.sourceFrameWidth).toBe(32);
    expect(data.grid.trim).toEqual([content.x, content.y]);
    // The sheet is the grid and nothing but the grid
    expect([sheet.width, sheet.height]).toEqual([content.width * 3, content.height * 4]);
  });

  it('leaves every frame where a row and a column can find it', () => {
    const { sheet, data } = packPokengine(charset(3, 4, 32, content), {
      order: straight,
      compact: true,
    });

    // What `OWCharSprite` does to find a frame: multiply. Each cell has
    // its own shade, so a frame that slid would be reading a neighbour
    for (let row = 0; row < data.grid.rows; row += 1) {
      for (let column = 0; column < data.grid.columns; column += 1) {
        const at = (row * data.grid.frameHeight * sheet.width + column * data.grid.frameWidth) * 4;

        expect(sheet.data[at], `frame ${column},${row}`).toBe(20 + (row * 3 + column) * 10);
        expect(sheet.data[at + 3], `frame ${column},${row} is drawn`).toBe(255);
      }
    }
  });

  it('puts the rows into reading order whatever order they arrived in', () => {
    // The sheet arrives upside down; the pack lands it down, left,
    // right, up all the same
    const { sheet, data } = packPokengine(charset(3, 4, 32, content), {
      order: ['up', 'right', 'left', 'down'],
      compact: true,
    });

    for (let row = 0; row < data.grid.rows; row += 1) {
      const source = 3 - row;
      const at = row * data.grid.frameHeight * sheet.width * 4;

      expect(sheet.data[at], `facing ${FACINGS[row]}`).toBe(20 + source * 3 * 10);
    }
  });

  it('carries the three-frame walk: stand first, a step either side', () => {
    const { data } = packPokengine(charset(3, 4, 32, content), {
      order: straight,
      compact: true,
    });

    expect(data.grid.standFrame).toBe(0);
    expect(data.grid.cycle).toEqual([1, 0, 2, 0]);
  });

  it('snaps antialiased edges to pixel art', () => {
    const raster = charset(3, 4, 32, content);
    const paint = (x: number, y: number, alpha: number): void => {
      const at = (y * raster.width + x) * 4;

      raster.data[at] = 200;
      raster.data[at + 1] = 100;
      raster.data[at + 2] = 50;
      raster.data[at + 3] = alpha;
    };

    // A soft fringe outside the content, and two touched pixels inside
    paint(content.x - 2, content.y, 100);
    paint(content.x + 1, content.y + 1, 200);
    paint(content.x + 2, content.y + 2, 60);

    const { sheet, data } = packPokengine(raster, { order: straight, compact: true });

    // The fringe neither survives nor holds the crop open
    expect(data.grid.frameWidth).toBe(content.width);
    expect(data.grid.trim).toEqual([content.x, content.y]);
    // Above half is solid, below half is gone whole
    expect(sheet.data[(sheet.width + 1) * 4 + 3]).toBe(255);
    expect(sheet.data[(2 * sheet.width + 2) * 4 + 3]).toBe(0);
    expect(sheet.data[(2 * sheet.width + 2) * 4]).toBe(0);
  });

  it('keeps the cell whole when it is not asked to crop', () => {
    const { sheet, data } = packPokengine(charset(3, 4, 32, content), {
      order: straight,
      compact: false,
    });

    expect(data.grid.frameWidth).toBe(32);
    expect(data.grid.trim).toEqual([0, 0]);
    expect([sheet.width, sheet.height]).toEqual([96, 128]);
  });

  it('describes the grid as one picture, since that is how it is drawn', () => {
    const { data } = packPokengine(charset(3, 4, 32, content), {
      order: straight,
      compact: true,
    });

    expect(data.images).toHaveLength(1);
    expect(data.images[0].name).toBe(GRID_NAME);
    expect(data.images[0].width).toBe(data.width);
    expect(data.images[0].sourceWidth).toBe(96);
  });

  it('refuses a sheet the format does not divide into', () => {
    // 65 across three is not this format, and shaving the remainder
    // would drop a column of every sheet without saying so
    expect(() => packPokengine(blank(65, 64), { order: straight, compact: true })).toThrow(
      /does not divide/,
    );
  });

  it('keeps an empty sheet the size it came at', () => {
    const { data } = packPokengine(blank(96, 64), { order: straight, compact: true });

    expect(data.grid.frameWidth).toBe(32);
    expect(data.grid.trim).toEqual([0, 0]);
  });

  it('reads a row order and refuses a guessed one', () => {
    expect(parseOrder('down, left, right, up')).toEqual(straight);
    expect(parseOrder('UP right DOWN left')).toEqual(['up', 'right', 'down', 'left']);
    expect(() => parseOrder('down left right')).toThrow(/exactly once/);
    expect(() => parseOrder('down down left right')).toThrow(/exactly once/);
    expect(() => parseOrder('north south east west')).toThrow(/exactly once/);
  });
});

describe('crediting a pokengine sheet', () => {
  const page = [
    '## Art',
    '',
    '### Pokengine community',
    '',
    'Where the charsets come from.',
    '',
    '| Sheet | Credit |',
    '| ----- | ------ |',
    '',
    '> The note after the table stays.',
    '',
    '## The rules',
    '',
  ].join('\n');

  it('adds a row and keeps the rest of the page', () => {
    const credited = withCredit(page, 'rocket-grunt', 'Artist');

    expect(credited).toContain('| `rocket-grunt` | Artist |');
    expect(credited).toContain('> The note after the table stays.');
    expect(credited).toContain('## The rules');
  });

  it('updates a re-packed sheet rather than adding a second row', () => {
    const twice = withCredit(withCredit(page, 'rocket-grunt', 'Artist'), 'rocket-grunt', 'Other');

    expect(twice).toContain('| `rocket-grunt` | Other |');
    expect(twice).not.toContain('| Artist |');
  });

  it('keeps the rows sorted by sheet', () => {
    const credited = withCredit(withCredit(page, 'zubat-keeper', 'Z'), 'aide', 'A');

    expect(credited.indexOf('`aide`')).toBeLessThan(credited.indexOf('`zubat-keeper`'));
  });

  it('refuses a page with no section to credit into', () => {
    expect(() => withCredit('# Credits\n', 'rocket-grunt', 'Artist')).toThrow(/Pokengine/);
  });
});

describe('what a charset is filed as', () => {
  it('gives the grid and its description one folder', () => {
    expect(overworldDestination('Rocket Grunt')).toEqual({
      image: 'sprites/overworld/rocket-grunt/image.png',
      meta: 'sprites/overworld/rocket-grunt/data.json',
    });
  });

  it('takes a name down to what a folder may be called', () => {
    expect(overworldSlug('  Nurse Joy ')).toBe('nurse-joy');
    expect(overworldSlug('Grunt #2!')).toBe('grunt-2');
    // Slashes keep subfolders, and each segment is slugged on its own
    expect(overworldSlug('Characters/FRLG/Red')).toBe('characters/frlg/red');
  });

  it('refuses a name with nothing in it', () => {
    expect(() => overworldSlug('   ')).toThrow(/needs a name/);
    expect(() => overworldSlug('///')).toThrow(/needs a name/);
    // A dotted segment reduces to nothing rather than climbing out
    expect(() => overworldSlug('../../etc/passwd')).toThrow(/needs a name/);
    expect(() => overworldSlug('characters/')).toThrow(/needs a name/);
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

describe('copying a rectangle', () => {
  it('drops what hangs off the left rather than wrapping it', () => {
    const target = blank(4, 2);

    blit(
      target,
      drawn(4, 2, { x: 0, y: 0, width: 4, height: 2 }),
      {
        x: 0,
        y: 0,
        width: 4,
        height: 2,
      },
      { x: -2, y: 0 },
    );

    // The right half of the source, landed at the left of the target,
    // and nothing wrapped round onto the row above
    const lit: string[] = [];

    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        if (opaque(target, x, y)) {
          lit.push(`${x},${y}`);
        }
      }
    }
    expect(lit).toEqual(['0,0', '1,0', '0,1', '1,1']);
  });
});
