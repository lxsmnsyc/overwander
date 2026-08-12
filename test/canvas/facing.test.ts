import { describe, expect, it } from 'vitest';
import facingToward from '../../src/canvas/facing';

/**
 * The canvas y axis grows downward, so something below another thing
 * has the larger y and is looked at by facing `down`. Getting that
 * backwards turns a lobby inside out — everybody looking away from
 * the boss they came for — without anything failing
 */
describe('facing', () => {
  it('names the four square directions in canvas coordinates', () => {
    // Looking from the middle of a 200x200 field at each edge
    expect(facingToward(100, 100, 100, 200)).toBe('down');
    expect(facingToward(100, 100, 100, 0)).toBe('up');
    expect(facingToward(100, 100, 200, 100)).toBe('right');
    expect(facingToward(100, 100, 0, 100)).toBe('left');
  });

  it('names the corners', () => {
    expect(facingToward(0, 0, 100, 100)).toBe('down-right');
    expect(facingToward(0, 100, 100, 0)).toBe('up-right');
    expect(facingToward(100, 0, 0, 100)).toBe('down-left');
    expect(facingToward(100, 100, 0, 0)).toBe('up-left');
  });

  it('rounds to the nearest of the eight', () => {
    // A shallow angle is the square direction, not the diagonal
    expect(facingToward(0, 0, 100, 10)).toBe('right');
    // And a steep one is the diagonal rather than the square
    expect(facingToward(0, 0, 100, 70)).toBe('down-right');
  });

  it('answers something for a point looking at itself', () => {
    // Nowhere is not a direction, so it settles on the first of the
    // eight rather than on nothing at all
    expect(facingToward(100, 100, 100, 100)).toBe('right');
  });
});
