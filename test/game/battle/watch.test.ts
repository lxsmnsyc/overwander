import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** The engine stand-in each test reads back */
const engine = {
  started: 0,
  ended: 0,
  settled: false,
  winner: null as unknown,
  mode: 0,
  speed: 1,
  initialize: () => {},
  start: () => {
    engine.started += 1;
  },
  end: () => {
    engine.ended += 1;
  },
};
let feed: (record: unknown) => void = () => {};

vi.mock('../../../src/auth/battles', () => ({
  BattleOutcome: { Won: 1, Lost: 2 },
  watchBattle: (_id: string, onChange: (record: unknown) => void) => {
    feed = onChange;
    return () => {};
  },
  listBattleTeams: vi.fn().mockResolvedValue([]),
  recordAftermath: vi.fn().mockResolvedValue([]),
  finishBattle: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../src/auth/raids', () => ({
  PLAYER_ALLIANCE: 0,
  getRaid: vi.fn().mockResolvedValue(null),
  clearRaid: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../src/overworld/stop/battle', () => ({
  createTrainerBattle: () => ({ battle: engine, units: new Map(), alliances: new Map() }),
}));
vi.mock('../../../src/overworld/raid/battle', () => ({
  createRaidBattle: () => ({ battle: engine, units: new Map(), alliances: new Map() }),
  collectAftermath: () => [],
  countDefeated: () => 0,
}));
vi.mock('../../../src/model/battle-kind', () => ({
  default: { Raid: 0, Npc: 1, Player: 2 },
  getBattleKind: () => 1,
}));

const { default: createBattleWatch, COUNTDOWN } = await import('../../../src/game/battle/watch');

const RECORD = { players: ['me'], opponent: '', limits: {}, biome: 0 };

function watchOne(replay: boolean): {
  watch: ReturnType<typeof createBattleWatch>;
  started: number[];
} {
  const started: number[] = [];
  const watch = createBattleWatch({ id: 'b', replay }, () => 'me', {
    started: () => {
      started.push(1);
    },
    settled: () => {},
    reward: () => {},
    candyInPassing: () => {},
  });

  return { watch, started };
}

describe('createBattleWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    engine.started = 0;
    engine.ended = 0;
    engine.speed = 1;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds the fight from the first record and counts it in once', async () => {
    const { watch, started } = watchOne(false);
    const stop = watch.start();

    feed(RECORD);
    await vi.waitFor(() => {
      expect(watch.instance.get()).not.toBeNull();
    });
    watch.ready();
    watch.ready();
    expect(started).toEqual([1]);
    expect(watch.counting.get()).toBe(COUNTDOWN);
    vi.advanceTimersByTime(1000 * COUNTDOWN);
    expect(watch.counting.get()).toBeNull();
    expect(engine.started).toBe(1);
    stop();
    expect(engine.ended).toBe(1);
  });

  it('asks before a fighter walks out of a live fight, and not before a replay', async () => {
    const live = watchOne(false);

    live.watch.start();
    feed(RECORD);
    await vi.waitFor(() => {
      expect(live.watch.instance.get()).not.toBeNull();
    });
    expect(live.watch.leaveNeedsAsking()).toBe(true);

    const replay = watchOne(true);

    replay.watch.start();
    feed(RECORD);
    expect(replay.watch.leaveNeedsAsking()).toBe(false);
  });

  it('hurries only a replay', async () => {
    const live = watchOne(false);

    live.watch.start();
    feed(RECORD);
    await vi.waitFor(() => {
      expect(live.watch.instance.get()).not.toBeNull();
    });
    live.watch.setSpeed(4);
    expect(engine.speed).toBe(1);

    const replay = watchOne(true);

    replay.watch.start();
    feed(RECORD);
    await vi.waitFor(() => {
      expect(replay.watch.instance.get()).not.toBeNull();
    });
    replay.watch.setSpeed(4);
    expect(engine.speed).toBe(4);
  });
});
