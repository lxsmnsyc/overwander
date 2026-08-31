import { describe, expect, it } from 'vitest';
import pack, { packSmallest } from '../../src/server/sprites/packing';

/**
 * Choosing a sheet's shape.
 *
 * The tree grows a sheet around whatever it is handed first and keeps
 * the result roughly square, which is right for boxes of every size and
 * wrong for a pokemon's frames: those are all about one size, and boxes
 * of one size want rows. What matters is that trying both never comes
 * out worse than trying one.
 */
describe('packing a sheet', () => {
  const boxesOf = (count: number, w: number, h: number): { w: number; h: number }[] =>
    Array.from({ length: count }, () => ({ w, h }));

  const areaOf = (packed: { width: number; height: number }): number =>
    packed.width * packed.height;

  it('never comes out larger than the tree alone', () => {
    for (const boxes of [
      boxesOf(42, 23, 21),
      boxesOf(7, 40, 12),
      [...boxesOf(10, 16, 16), ...boxesOf(3, 48, 40)],
      boxesOf(1, 9, 9),
    ]) {
      expect(areaOf(packSmallest(boxes))).toBeLessThanOrEqual(areaOf(pack(boxes)));
    }
  });

  it('finds the rows a grid of equal boxes wants', () => {
    // Twelve 20x20 boxes fit a 4x3 rectangle exactly, which the tree
    // does not find
    const packed = packSmallest(boxesOf(12, 20, 20));

    expect(areaOf(packed)).toBe(12 * 20 * 20);
  });

  it('places every box, and none of them overlapping', () => {
    const boxes = [...boxesOf(9, 14, 22), ...boxesOf(5, 31, 12)];
    const packed = packSmallest(boxes);

    expect(packed.placed).toHaveLength(boxes.length);
    for (const one of packed.placed) {
      expect(one.x + one.box.w).toBeLessThanOrEqual(packed.width);
      expect(one.y + one.box.h).toBeLessThanOrEqual(packed.height);
      for (const other of packed.placed) {
        if (one === other) {
          continue;
        }
        const apart =
          one.x + one.box.w <= other.x ||
          other.x + other.box.w <= one.x ||
          one.y + one.box.h <= other.y ||
          other.y + other.box.h <= one.y;

        expect(apart).toBe(true);
      }
    }
  });

  it('refuses a strip one box wide, however tightly it fits', () => {
    const packed = packSmallest(boxesOf(40, 10, 10));

    expect(Math.max(packed.width, packed.height)).toBeLessThanOrEqual(
      Math.min(packed.width, packed.height) * 2.5,
    );
  });
});
