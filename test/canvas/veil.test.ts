import { describe, expect, it } from 'vitest';
import {
  VEIL_ALPHA,
  VEIL_SHARE,
  coverOf,
} from '../../src/components/overworld/chunk-canvas/metrics';

/**
 * What decides that something on the board is standing in the way of
 * the player rather than merely standing near them.
 *
 * The board draws far to near, so anything painted after the player is
 * in front of them; this is the other half of the question, which is
 * how much of them it actually hides.
 */

const PLAYER = { left: 100, top: 100, width: 40, height: 60 };

describe('what counts as standing in front of the player', () => {
  it('measures the cover as a share of the player, not of the thing covering them', () => {
    // A tree is several times their size: measured against the tree,
    // the same overlap would read as barely anything
    const tree = { left: 90, top: 40, width: 120, height: 160 };

    expect(coverOf(PLAYER, tree)).toBeCloseTo(1, 6);
    expect(coverOf(tree, PLAYER)).toBeLessThan(0.2);
  });

  it('is nothing at all for a neighbour that misses them', () => {
    expect(coverOf(PLAYER, { left: 200, top: 100, width: 40, height: 60 })).toBe(0);
    // Touching edges is not covering: a box that stops where the
    // player starts hides none of them
    expect(coverOf(PLAYER, { left: 140, top: 100, width: 40, height: 60 })).toBe(0);
  });

  it('leaves an elbow uncovered and a head covered', () => {
    // A quarter of their width down one side, which is a sprite
    // standing beside them rather than over them
    const beside = { left: 130, top: 100, width: 40, height: 60 };

    expect(coverOf(PLAYER, beside)).toBeLessThan(VEIL_SHARE);

    // ...and the top half of them, which is not
    const over = { left: 100, top: 70, width: 40, height: 60 };

    expect(coverOf(PLAYER, over)).toBeGreaterThan(VEIL_SHARE);
  });

  it('fades what is in the way rather than taking it away', () => {
    // Faint enough to see the player through, solid enough that the
    // cell still reads as having a tree on it
    expect(VEIL_ALPHA).toBeGreaterThan(0);
    expect(VEIL_ALPHA).toBeLessThan(1);
  });
});
