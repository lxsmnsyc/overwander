import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import { createPager } from '../src/components/styled/pager';

/**
 * Which slice of a long list is on screen.
 *
 * How often the slice is rebuilt is the other half, and it is not
 * asserted here: Vitest resolves Solid to its server build, where a
 * memo is not a memo and any count would pass whether or not the page
 * is held.
 */

describe('paging a long list', () => {
  const rows = Array.from({ length: 200 }, (_, at) => at);

  it('shows a page of the size it was given', () => {
    createRoot((dispose) => {
      const pager = createPager(() => rows, 30);

      expect(pager.shown()).toHaveLength(30);
      expect(pager.shown().at(0)).toBe(0);
      dispose();
    });
  });

  it('gives a short list one page and all of it', () => {
    createRoot((dispose) => {
      const pager = createPager(() => rows.slice(0, 4), 30);

      expect(pager.shown()).toEqual([0, 1, 2, 3]);
      dispose();
    });
  });

  it('takes its size from an accessor, for a box the player resized', () => {
    createRoot((dispose) => {
      const pager = createPager(
        () => rows,
        () => 40,
      );

      expect(pager.shown()).toHaveLength(40);
      dispose();
    });
  });
});
