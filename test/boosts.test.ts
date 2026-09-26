import { beforeEach, describe, expect, it, vi } from 'vitest';

let rows: Record<string, unknown>[] = [];
let reads = 0;
let failing = false;

vi.mock('../src/server/db', () => ({
  getSql: () => async () => {
    reads += 1;
    if (failing) {
      throw new Error('down');
    }
    return Promise.resolve(rows);
  },
}));

const { Boost, boostOf, boosted, boostedAll, forgetBoosts } = await import('../src/server/boosts');

describe('boosts', () => {
  beforeEach(() => {
    forgetBoosts();
    reads = 0;
    failing = false;
    rows = [
      { reward: 'candy', factor: 2, starts_at: 100, ends_at: 200 },
      { reward: 'candy', factor: 3, starts_at: 150, ends_at: 180 },
      { reward: 'gold', factor: 1.5, starts_at: 0, ends_at: 1000 },
    ];
  });

  it('count only inside their window', async () => {
    expect(await boostOf(Boost.Candy, 99)).toBe(1);
    forgetBoosts();
    expect(await boostOf(Boost.Candy, 120)).toBe(2);
    forgetBoosts();
    expect(await boostOf(Boost.Candy, 200)).toBe(1);
  });

  it('take the larger of two that overlap rather than multiplying them', async () => {
    expect(await boostOf(Boost.Candy, 160)).toBe(3);
  });

  it('keep each reward to its own', async () => {
    expect(await boostOf(Boost.Gold, 120)).toBe(1.5);
  });

  it('are read once a minute rather than once a reward', async () => {
    await boostOf(Boost.Candy, 120);
    await boostOf(Boost.Gold, 130);
    expect(reads).toBe(1);
    await boostOf(Boost.Candy, 120 + 60_000);
    expect(reads).toBe(2);
  });

  it('pay unboosted when they cannot be read', async () => {
    failing = true;
    expect(await boostOf(Boost.Candy, 120)).toBe(1);
  });

  it('round to whole amounts and never pay less', () => {
    expect(boosted(3, 1.5)).toBe(5);
    expect(boosted(1, 1.2)).toBe(1);
    expect([...boostedAll([[7, 2]], 2)]).toEqual([[7, 4]]);
  });
});
