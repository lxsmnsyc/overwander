import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PositionRecord } from '../../../src/model/position-record';

vi.mock('../../../src/auth/eggs', () => ({ walk: vi.fn().mockResolvedValue(null) }));
vi.mock('../../../src/auth/field-moves', () => ({
  useDig: vi.fn().mockResolvedValue(null),
  useTeleport: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../src/auth/sight', () => ({
  default: () => ({
    strangers: null,
    stand: () => {},
    setCharset: () => {},
    plan: () => {},
    setSeen: () => {},
    close: () => {},
  }),
}));

const { default: createBoardWalk } = await import('../../../src/game/overworld/walk');
const { PLAYER_CELL, SAVE_DELAY, STEP_PACE } =
  await import('../../../src/game/overworld/board-metrics');

/** Open ground everywhere, with rock wherever the test says */
function boardWith(rock: Set<number>): {
  ground: { role: () => string; biome: () => number };
  landmarks: Set<number>;
  decorations: Set<number>;
  walls: Set<number>;
  underground: boolean;
} {
  return {
    ground: { role: () => 'ground', biome: () => 0 },
    landmarks: new Set(),
    decorations: new Set(),
    walls: rock,
    underground: false,
  };
}

const AT: PositionRecord = {
  player: 'me',
  chunkX: 2,
  chunkY: 3,
  cellX: 4,
  cellY: 5,
  depth: 0,
  movedAt: 1,
};

function walkOn(
  rock = new Set<number>(),
  away: PositionRecord | null = null,
): {
  walk: ReturnType<typeof createBoardWalk>;
  saved: number[][];
} {
  const saved: number[][] = [];
  const walk = createBoardWalk({
    uid: () => 'me',
    elsewhere: () => away,
    takeWalk: () => {},
    standHere: () => {},
    setPosition: () => {},
    settleWalk: async (chunkX, chunkY, cellX, cellY, _depth, steps) => {
      saved.push([chunkX, chunkY, cellX, cellY, steps]);
      return Promise.resolve(null);
    },
    setFieldMoves: () => {},
    found: () => {},
    failed: () => {},
  });
  const board = boardWith(rock);

  walk.attach({
    buddy: () => null,
    view: () => board,
    engaged: () => false,
    holdsSomething: () => false,
    withinReach: () => false,
    reach: () => {},
    askForWindow: () => {},
  });
  walk.place(AT);
  return { walk, saved };
}

describe('createBoardWalk', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stands where the session says, once', () => {
    const { walk } = walkOn();
    const x = walk.x.get();

    walk.place({ ...AT, cellX: 9 });
    expect(walk.x.get()).toBe(x);
    expect(walk.placed.get()).toBe(true);
  });

  it('steps onto open ground and turns toward rock without moving', () => {
    const east = new Set([PLAYER_CELL + 1]);
    const { walk } = walkOn(east);
    const x = walk.x.get();
    const y = walk.y.get();

    walk.stepBy([[0, 1]]);
    expect(walk.y.get()).toBe(y + 1);
    vi.advanceTimersByTime(STEP_PACE);
    walk.stepBy([[1, 0]]);
    expect(walk.x.get()).toBe(x);
    expect(walk.facing.get()).toEqual([1, 0]);
  });

  it('holds the write back until the walk stops', async () => {
    const { walk, saved } = walkOn();

    walk.stepBy([[1, 0]]);
    vi.advanceTimersByTime(STEP_PACE);
    walk.stepBy([[1, 0]]);
    expect(saved).toEqual([]);
    await vi.advanceTimersByTimeAsync(SAVE_DELAY * 10);
    expect(saved).toHaveLength(1);
    expect(saved[0].slice(2, 4)).toEqual([AT.cellX + 2, AT.cellY]);
  });

  it('walks a pressed route a step a pace, and stops there', () => {
    const { walk } = walkOn();
    const x = walk.x.get();

    walk.press(PLAYER_CELL + 3);
    expect(walk.x.get()).toBe(x + 1);
    vi.advanceTimersByTime(STEP_PACE * 4);
    expect(walk.x.get()).toBe(x + 3);
    expect(walk.journey.get()).toBeNull();
  });

  it('does not walk while another screen has the walk', () => {
    const { walk } = walkOn(new Set(), { ...AT, chunkX: 9 });
    const x = walk.x.get();

    walk.stepBy([[1, 0]]);
    expect(walk.x.get()).toBe(x);
  });
});
