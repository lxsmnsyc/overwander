import { describe, expect, it } from 'vitest';
import { asLeg, asSighting } from '../src/auth/sight';
import { DEFAULT_CHARSET, FREE_CHARSETS } from '../src/data/overworld/charsets';

describe('a presence from another client', () => {
  it('reads back what was tracked', () => {
    expect(asSighting('a', { c: FREE_CHARSETS[1], x: -40, y: 12, f: 'L' })).toEqual({
      uid: 'a',
      charset: FREE_CHARSETS[1],
      x: -40,
      y: 12,
      facing: [-1, 0],
    });
  });

  it('is drawn in the default charset when it names a file the game does not have', () => {
    expect(asSighting('a', { c: '../../secret', x: 0, y: 0, f: 'D' })?.charset).toBe(
      DEFAULT_CHARSET,
    );
  });

  it('is refused off the world, off the grid or without a facing', () => {
    expect(asSighting('a', { c: DEFAULT_CHARSET, x: 1e9, y: 0, f: 'D' })).toBeNull();
    expect(asSighting('a', { c: DEFAULT_CHARSET, x: 0.5, y: 0, f: 'D' })).toBeNull();
    expect(asSighting('a', { c: DEFAULT_CHARSET, x: 0, y: 0, f: '' })).toBeNull();
    expect(asSighting('', { c: DEFAULT_CHARSET, x: 0, y: 0, f: 'D' })).toBeNull();
  });
});

describe('a walk from another client', () => {
  it('reads back what was sent', () => {
    expect(asLeg({ u: 'a', x: 3, y: -4, s: 'RRD', t: 1234 })).toEqual({
      uid: 'a',
      x: 3,
      y: -4,
      steps: [
        [1, 0],
        [1, 0],
        [0, 1],
      ],
      at: 1234,
      planned: false,
    });
  });

  it('reads a route, which may be longer than a run', () => {
    const leg = asLeg({ u: 'a', x: 0, y: 0, s: 'R'.repeat(40), t: 1, p: 1 });

    expect(leg?.planned).toBe(true);
    expect(leg?.steps).toHaveLength(40);
    expect(asLeg({ u: 'a', x: 0, y: 0, s: 'R'.repeat(40), t: 1 })).toBeNull();
  });

  it('reads a run with no steps as where they are now', () => {
    expect(asLeg({ u: 'a', x: 5, y: 6, s: '', t: 1 })?.steps).toEqual([]);
  });

  it('is refused when any part of it is not a walk', () => {
    expect(asLeg({ u: 'a', x: 3, y: -4, s: 'RQ', t: 1 })).toBeNull();
    expect(asLeg({ u: 'a', x: 3, y: -4, s: 'R' })).toBeNull();
    expect(asLeg({ x: 3, y: -4, s: 'R', t: 1 })).toBeNull();
    expect(asLeg(null)).toBeNull();
  });
});
