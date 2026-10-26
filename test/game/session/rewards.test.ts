import { describe, expect, it, vi } from 'vitest';
import type { Spoils } from '../../../src/game/session/types';

vi.mock('../../../src/auth/raids', () => ({
  claimRaidReward: vi.fn().mockResolvedValue({ gold: 40, items: [], encounter: null }),
}));
vi.mock('../../../src/auth/stops', () => ({
  claimStopReward: vi.fn().mockResolvedValue({ gold: 90, award: 3, items: [], encounter: null }),
}));
vi.mock('../../../src/auth/gym-seats', () => ({
  settleGymChallenge: vi.fn().mockResolvedValue({ freed: false, gold: 25 }),
}));

const { createRewards } = await import('../../../src/game/session/rewards');

function setUp(): {
  rewards: ReturnType<typeof createRewards>;
  passing: Spoils[];
  beaten: number[];
} {
  const passing: Spoils[] = [];
  const beaten: number[] = [];
  const rewards = createRewards({
    paidInPassing: (paid) => {
      passing.push(paid);
    },
    trainerBeaten: () => {
      beaten.push(1);
    },
  });

  return { rewards, passing, beaten };
}

describe('createRewards', () => {
  it('pays onto the summary while the battle has the page', async () => {
    const { rewards, passing, beaten } = setUp();

    rewards.battle.set({ id: 'b', replay: false, stop: 's' });
    rewards.reward.set({ stop: 's' });
    expect(rewards.reward.get()).toBeNull();
    await vi.waitFor(() => {
      expect(rewards.spoils.get()?.gold).toBe(90);
    });
    expect(passing).toEqual([]);
    expect(beaten).toEqual([1]);
  });

  it('says it in passing once the battle has gone', async () => {
    const { rewards, passing } = setUp();

    rewards.reward.set({ raid: 'r' });
    await vi.waitFor(() => {
      expect(passing).toHaveLength(1);
    });
    expect(passing[0].gold).toBe(40);
    expect(rewards.spoils.get()).toBeNull();
  });

  it('takes a lost seat challenge as gold lost', async () => {
    const { rewards } = setUp();

    rewards.battle.set({ id: 'b', replay: false, seat: 'g' });
    rewards.reward.set({ seat: 'g' });
    await vi.waitFor(() => {
      expect(rewards.spoils.get()).toMatchObject({ seat: 'held', gold: -25 });
    });
  });

  it('clears what was paid when the battle changes', async () => {
    const { rewards } = setUp();

    rewards.battle.set({ id: 'b', replay: false, stop: 's' });
    rewards.reward.set({ stop: 's' });
    await vi.waitFor(() => {
      expect(rewards.spoils.get()).not.toBeNull();
    });
    rewards.battle.set(null);
    expect(rewards.spoils.get()).toBeNull();
  });
});
