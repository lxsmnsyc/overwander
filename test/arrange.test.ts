import { describe, expect, it } from 'vitest';
import { carried } from '../src/components/styled/reorder';
import { rearrangedAs } from '../src/server/catch-fields';

/**
 * Putting a pokemon's lists in the order its owner wants them.
 *
 * Two halves of the same rule: the section moves one entry at a time
 * as a drag crosses the others, and the server takes the finished
 * order only where it is the same list over again. The order decides
 * what the pokemon brings to a fight that allows fewer than it has,
 * so a list that quietly gained a move would be a way of bringing one
 * it never learned.
 */

describe('carrying one entry to another place in a list', () => {
  it('takes it out and puts it back in', () => {
    expect(carried([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(carried([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
    // Neighbours change places, which is what one step of a drag is
    expect(carried([1, 2, 3], 1, 2)).toEqual([1, 3, 2]);
  });

  it('leaves the list alone where there is nowhere to carry it', () => {
    expect(carried([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
    expect(carried([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
    expect(carried([1, 2, 3], -1, 0)).toEqual([1, 2, 3]);
  });

  it('answers with a list of its own, so a draft is never written through', () => {
    const held = [1, 2, 3];

    expect(carried(held, 0, 1)).not.toBe(held);
    expect(held).toEqual([1, 2, 3]);
  });
});

describe('what the server will take as a rearrangement', () => {
  it('takes the same entries in another order', () => {
    expect(rearrangedAs([4, 8, 15], [15, 4, 8])).toEqual([15, 4, 8]);
    expect(rearrangedAs([], [])).toEqual([]);
  });

  it('counts duplicates rather than reading the list as a set', () => {
    // A pokemon may hold two of the same item, and dropping one of
    // them is not a rearrangement
    expect(rearrangedAs([7, 7, 9], [9, 7, 7])).toEqual([9, 7, 7]);
    expect(rearrangedAs([7, 7, 9], [7, 9, 9])).toBeNull();
  });

  it('refuses anything that is not the same list over again', () => {
    // Nothing is learned, taught or handed over by arranging
    expect(rearrangedAs([1, 2], [1, 2, 3])).toBeNull();
    expect(rearrangedAs([1, 2, 3], [1, 2])).toBeNull();
    expect(rearrangedAs([1, 2, 3], [1, 2, 4])).toBeNull();
  });
});
