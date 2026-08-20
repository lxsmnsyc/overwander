import { describe, expect, it } from 'vitest';
import type { Pixels } from '../../src/server/sprites/dedupe';
import dedupe, { blankPixels, drawPictures, packedGrid } from '../../src/server/sprites/dedupe';
import pack from '../../src/server/sprites/packing';

/**
 * Packing each picture once, cropped to what is drawn in it.
 *
 * Half of every sheet is a drawing it already holds — a pose held for
 * ten frames, a row that is another row mirrored — and most of the rest
 * is the empty room a clip's box leaves around a quiet frame. The rule
 * neither may break is that a frame still comes out as the picture it
 * went in as, in the place it went in at.
 */

/** A grid of frames, each filled with whatever the caller says. */
function grid(
  columns: number,
  rows: number,
  width: number,
  height: number,
  paint: (column: number, row: number, x: number, y: number) => [number, number, number],
): Pixels {
  const image = blankPixels(columns * width, rows * height);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const [red, green, blue] = paint(column, row, x, y);
          const at = ((row * height + y) * image.width + column * width + x) * 4;

          image.data[at] = red;
          image.data[at + 1] = green;
          image.data[at + 2] = blue;
          image.data[at + 3] = 255;
        }
      }
    }
  }
  return image;
}

/** One frame's pixels as a string, for comparing two layouts. */
function frameOf(
  image: Pixels,
  left: number,
  top: number,
  width: number,
  height: number,
  flip = false,
): string {
  const seen: number[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = ((top + y) * image.width + left + (flip ? width - 1 - x : x)) * 4;

      seen.push(image.data[at], image.data[at + 1], image.data[at + 2]);
    }
  }
  return seen.join(',');
}

describe('packing each picture once', () => {
  it('keeps one of a pose that is held', () => {
    // Four frames a row, all the same drawing: one picture, and every
    // frame pointing at it
    const held = grid(4, 2, 3, 3, (_column, row) => [row * 40, 0, 0]);
    const found = dedupe([{ raster: held, grid: packedGrid(0, 0, 3, 3, 4, 2) }]);

    expect(found.pictures).toHaveLength(2);
    expect(found.frames.map((frame) => frame.cell)).toEqual([0, 0, 0, 0, 1, 1, 1, 1]);
    expect(found.frames.every((frame) => !frame.flip)).toBe(true);
  });

  it('keeps one of a pair that is the other mirrored', () => {
    // The second row is the first drawn backwards, which is what a
    // left-facing row is
    const facing = grid(2, 2, 4, 1, (column, row, x) => {
      const at = row === 0 ? x : 3 - x;

      return [column * 10 + at * 20, 0, 0];
    });
    const found = dedupe([{ raster: facing, grid: packedGrid(0, 0, 4, 1, 2, 2) }]);

    expect(found.pictures, 'two drawings, each kept once').toHaveLength(2);
    expect(found.frames.map((frame) => frame.flip)).toEqual([false, false, true, true]);
  });

  it('only pairs frames that pair in every coat', () => {
    // The same two frames: identical on the plain drawing, different
    // on the shiny. They share one description, so neither may be
    // dropped
    const plain = grid(2, 1, 2, 2, () => [10, 10, 10]);
    const shiny = grid(2, 1, 2, 2, (column) => [column * 90, 0, 0]);
    const together = dedupe([
      { raster: plain, grid: packedGrid(0, 0, 2, 2, 2, 1) },
      { raster: shiny, grid: packedGrid(0, 0, 2, 2, 2, 1) },
    ]);

    expect(together.pictures).toHaveLength(2);
    // And the plain drawing on its own would have collapsed them
    expect(
      dedupe([{ raster: plain, grid: packedGrid(0, 0, 2, 2, 2, 1) }]).pictures,
    ).toHaveLength(1);
  });

  it('crops each frame to what is drawn in it', () => {
    // One dot, in a different corner of each frame of a 4x4 box
    const corners: [number, number][] = [
      [0, 0],
      [3, 0],
      [0, 3],
      [3, 3],
    ];
    const dotted = blankPixels(16, 4);

    for (let frame = 0; frame < 4; frame += 1) {
      const [x, y] = corners[frame];
      const at = (y * dotted.width + frame * 4 + x) * 4;

      dotted.data[at] = 200;
      dotted.data[at + 3] = 255;
    }
    const found = dedupe([{ raster: dotted, grid: packedGrid(0, 0, 4, 4, 4, 1) }]);

    // One dot is every one of them: same picture, hung in four places
    expect(found.pictures).toHaveLength(1);
    expect(found.pictures[0]).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    expect(found.frames.map((frame) => frame.at)).toEqual(corners);
  });

  it('leaves the box alone when it is told not to crop', () => {
    const dotted = blankPixels(8, 4);

    dotted.data[3] = 255;
    const found = dedupe([{ raster: dotted, grid: packedGrid(0, 0, 4, 4, 2, 1) }], false);

    expect(found.pictures[0]).toEqual({ x: 0, y: 0, width: 4, height: 4 });
    expect(found.frames.map((frame) => frame.at)).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it('draws every frame back exactly as it went in', () => {
    const source = grid(6, 4, 5, 5, (column, row, x, y) => [
      // A pose held in pairs, and the bottom two rows mirroring the top
      Math.floor(column / 2) * 60,
      (row % 2) * 50,
      (row < 2 ? x : 4 - x) * 30 + y * 10,
    ]);
    const from = packedGrid(0, 0, 5, 5, 6, 4);
    const found = dedupe([{ raster: source, grid: from }]);
    const layout = pack(
      found.pictures.map((picture, at) => ({ at, w: picture.width, h: picture.height })),
    );
    const spots: { x: number; y: number }[] = [];

    for (const { box, x, y } of layout.placed) {
      spots[box.at] = { x, y };
    }
    const packed = blankPixels(layout.width, layout.height);

    drawPictures(packed, source, found.pictures, spots, { x: 0, y: 0 });
    expect(found.pictures.length, 'fewer pictures than frames').toBeLessThan(24);

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const frame = found.frames[row * 6 + column];
        const spot = spots[frame.cell];

        expect(
          frameOf(packed, spot.x, spot.y, 5, 5, frame.flip),
          `frame ${row},${column}`,
        ).toBe(frameOf(source, column * 5, row * 5, 5, 5));
      }
    }
  });
});
