import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PositionRecord } from '../../../src/model/position-record';

/** What the server hears, and the news the subscription is fed */
const saves: number[][] = [];
let hear: (record: PositionRecord | null) => void = () => {};
let stamp = 0;
let release: () => void = () => {};

vi.mock('../../../src/auth/positions', () => ({
  getPosition: vi.fn().mockResolvedValue(null),
  visitBiome: vi.fn().mockResolvedValue(undefined),
  watchPosition: (_uid: string, onChange: (record: PositionRecord | null) => void) => {
    hear = onChange;
    return () => {};
  },
  savePosition: async (...at: number[]) => {
    saves.push(at);
    stamp += 1;
    const mine = stamp;

    // Held until the test lets it land, like a slow server
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return mine;
  },
  settleWalk: vi.fn().mockResolvedValue({ stamp: 0, report: null }),
}));
vi.mock('../../../src/overworld/current', () => ({
  default: () => ({ getChunk: () => ({ biome: 0 }) }),
}));

const { createWalk } = await import('../../../src/game/session/walk');

const USER = { uid: 'me', email: null, displayName: null };

function row(chunkX: number, movedAt: number): PositionRecord {
  return { player: 'me', chunkX, chunkY: 0, cellX: 1, cellY: 1, depth: 0, movedAt };
}

describe('createWalk', () => {
  beforeEach(() => {
    saves.length = 0;
    stamp = 0;
  });

  it('stands down when another screen walks the row into another chunk', () => {
    const walk = createWalk();

    walk.standHere(row(0, 5));
    walk.follow(USER);
    hear(row(0, 6));
    expect(walk.elsewhere.get()).toBeNull();
    hear(row(3, 7));
    expect(walk.elsewhere.get()).toEqual(row(3, 7));
  });

  it('takes its own writes coming back for its own', () => {
    const walk = createWalk();

    walk.standHere(row(0, 10));
    walk.follow(USER);
    hear(row(3, 9));
    expect(walk.elsewhere.get()).toBeNull();
  });

  it('holds news that lands while a save is out, and reads it once the save is back', async () => {
    const walk = createWalk();

    walk.standHere(row(0, 0));
    walk.follow(USER);
    walk.saveWalk(0, 0, 2, 2, 0);
    hear(row(3, 1));
    // The save's own stamp has not come back yet
    expect(walk.elsewhere.get()).toBeNull();
    release();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    // Stamp 1 is this screen's own, so the held news was its echo
    expect(walk.elsewhere.get()).toBeNull();
    hear(row(3, 2));
    expect(walk.elsewhere.get()).toEqual(row(3, 2));
  });

  it('takes the walk back and writes where it stands', () => {
    const walk = createWalk();

    walk.standHere(row(0, 5));
    walk.follow(USER);
    hear(row(3, 6));
    walk.takeWalk();
    expect(walk.elsewhere.get()).toBeNull();
    expect(walk.position.get()).toEqual(row(3, 6));
    expect(saves).toEqual([[3, 0, 1, 1, 0]]);
  });
});
