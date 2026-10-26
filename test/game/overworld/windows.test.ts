import { describe, expect, it, vi } from 'vitest';

/** The chunk keys a watch is open on, as the mock sees them */
const open = new Set<string>();
const visits: string[] = [];

vi.mock('../../../src/auth/snapshots', () => ({
  watchSnapshotWindow: (chunk: { x: number; y: number }) => {
    const key = `${chunk.x},${chunk.y}`;

    open.add(key);
    return () => {
      open.delete(key);
    };
  },
  visitChunkWindow: async (chunk: { x: number; y: number }) => {
    visits.push(`${chunk.x},${chunk.y}`);
    return Promise.resolve({ timestamp: 0, spawns: [] });
  },
  listClaimedPhenomena: vi.fn().mockResolvedValue([]),
  listPickedBerryPatches: vi.fn().mockResolvedValue([]),
  listClaimedItemCaches: vi.fn().mockResolvedValue([]),
  listLatheredHoneyTrees: vi.fn().mockResolvedValue([]),
}));

const { createStore } = await import('../../../src/game/store');
const { default: createBoardWindows } = await import('../../../src/game/overworld/windows');
const { boardChunks } = await import('../../../src/game/overworld/board-view');
const { BOARD_CENTER } = await import('../../../src/game/overworld/board-metrics');
const { CHUNK_CELLS } = await import('../../../src/overworld/chunk');

function standing(): {
  walk: {
    x: ReturnType<typeof createStore<number>>;
    y: ReturnType<typeof createStore<number>>;
    depth: ReturnType<typeof createStore<number>>;
    placed: ReturnType<typeof createStore<boolean>>;
  };
} {
  return {
    walk: {
      x: createStore(100 * CHUNK_CELLS + 8),
      y: createStore(100 * CHUNK_CELLS + 8),
      depth: createStore(0),
      placed: createStore(false),
    },
  };
}

function watching(x: number, y: number): string[] {
  const keys: string[] = [];

  for (const [cx, cy] of boardChunks(x - BOARD_CENTER, y - BOARD_CENTER)) {
    keys.push(`${cx},${cy}`);
  }
  return keys.sort();
}

describe('createBoardWindows', () => {
  it('watches nothing until the player is placed, then every chunk the board overlaps', () => {
    open.clear();

    const { walk } = standing();
    const windows = createBoardWindows({ walk, zone: 0, uid: () => 'me', failed: () => {} });

    expect(open.size).toBe(0);
    walk.placed.set(true);
    expect([...open].sort()).toEqual(watching(walk.x.get(), walk.y.get()));
    windows.dispose();
    expect(open.size).toBe(0);
  });

  it('follows the board as it walks into other chunks', () => {
    open.clear();

    const { walk } = standing();
    const windows = createBoardWindows({ walk, zone: 0, uid: () => 'me', failed: () => {} });

    walk.placed.set(true);
    walk.x.set(walk.x.get() + CHUNK_CELLS * 3);
    expect([...open].sort()).toEqual(watching(walk.x.get(), walk.y.get()));
    windows.dispose();
  });

  it('asks for the windows at most once in a short while', () => {
    open.clear();
    visits.length = 0;

    const { walk } = standing();
    const windows = createBoardWindows({ walk, zone: 0, uid: () => 'me', failed: () => {} });

    walk.placed.set(true);
    windows.askForWindow(true);

    const asked = visits.length;

    windows.askForWindow();
    expect(visits.length).toBe(asked);
    windows.dispose();
  });
});
