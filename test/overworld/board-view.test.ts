import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { PUBLISHED_SPAWNS } from '../../src/auth/snapshots';
import {
  type WatchedWindow,
  buildBoardView,
  viewChunks,
} from '../../src/components/overworld/overworld-tab/board-view';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';

registerGameData();

/** Every window the board at this origin covers, published from the given layer */
function publish(originX: number, originY: number, depth: Depth): Map<string, WatchedWindow> {
  const timestamp = 5_000_000 * SNAPSHOT_INTERVAL;
  const windows = new Map<string, WatchedWindow>();

  for (const [x, y] of viewChunks(originX, originY)) {
    const snapshot = new ChunkSnapshot(getWorld(depth).getChunk(x, y), timestamp, 480);
    const spawns = [];

    for (const [species, individualValue, traitValue] of snapshot.getSpawns(PUBLISHED_SPAWNS)) {
      spawns.push({ species, individualValue, traitValue });
    }
    windows.set(`${x},${y}`, {
      x,
      y,
      record: { seed: snapshot.chunk.seed, offset: 480, timestamp, spawns },
    });
  }
  return windows;
}

describe('the spawns a board draws', () => {
  it("never draws another layer's window at the same coordinates", () => {
    const surface = publish(180, -120, Depth.Surface);
    const build = (depth: Depth): number =>
      buildBoardView(180, -120, surface, 480, 'player', null, new Set(), depth).spawns.size;

    expect(build(Depth.Surface)).toBeGreaterThan(0);
    expect(build(Depth.Cave)).toBe(0);
  });
});
