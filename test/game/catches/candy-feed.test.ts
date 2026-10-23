import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The calls the server saw, as how many levels each asked for */
const calls: number[] = [];
/** The level the pretend record stands at */
let level = 10;
/** The levels that offer a move */
let offers: number[] = [];

vi.mock('../../../src/auth/candy', () => ({
  getCandyCost: () => 1,
  useCandy: async (_id: string, levels: number) => {
    calls.push(levels);
    level += levels;
    return Promise.resolve(level);
  },
}));
vi.mock('../../../src/model/level-moves', () => ({
  nextOfferLevel: (_caught: unknown, above: number) => {
    for (const at of offers) {
      if (at > above) {
        return at;
      }
    }
    return null;
  },
  getLevelMovesBetween: (_caught: unknown, from: number, to: number) => {
    const moves: number[] = [];

    for (const at of offers) {
      if (at >= from && at <= to) {
        moves.push(at);
      }
    }
    return moves;
  },
}));

const { default: createCandyFeed, CANDY_SETTLE } =
  await import('../../../src/game/catches/candy-feed');

function feeding(): {
  feed: ReturnType<typeof createCandyFeed>;
  grown: (number | null)[];
} {
  const grown: (number | null)[] = [];
  const feed = createCandyFeed({
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    recordOf: () => ({ level, shadow: false, moves: [] }) as never,
    showing: () => 'a',
    candies: () => 50,
    grew: (at) => {
      grown.push(at);
    },
    failed: () => {},
  });

  return { feed, grown };
}

describe('createCandyFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls.length = 0;
    level = 10;
    offers = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gathers a run of presses into one call', async () => {
    const { feed, grown } = feeding();

    feed.feed();
    feed.feed();
    feed.feed();
    expect(feed.shownLevel(null)).toBe(3);
    await vi.advanceTimersByTimeAsync(CANDY_SETTLE);
    expect(calls).toEqual([3]);
    expect(grown).toEqual([13]);
  });

  it('stops on a level with a move to offer and waits for the answer', async () => {
    offers = [12];

    const { feed } = feeding();

    for (let press = 0; press < 4; press += 1) {
      feed.feed();
    }
    await vi.advanceTimersByTimeAsync(0);
    // The press that reached level 12 went at once, and stopped there
    expect(calls).toEqual([2]);
    expect(feed.teaching.get()?.move).toBe(12);
    feed.nextTeaching();
    await vi.advanceTimersByTimeAsync(CANDY_SETTLE);
    expect(calls).toEqual([2, 2]);
  });

  it('starts counting again for another pokemon', () => {
    const { feed } = feeding();

    feed.feed();
    feed.switched();
    expect(feed.queued.get()).toBe(0);
    feed.dispose();
  });
});
