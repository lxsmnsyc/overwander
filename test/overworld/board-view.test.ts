import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { PUBLISHED_SPAWNS } from '../../src/auth/snapshots';
import {
  type WatchedWindow,
  buildBoardView,
  runningWindows,
  viewChunks,
} from '../../src/components/overworld/overworld-tab/board-view';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../src/overworld/chunk-snapshot';
import getWorld from '../../src/overworld/current';
import type { Buddy } from '../../src/overworld/core';
import { Depth } from '../../src/overworld/depth';
import Abilities from '../../src/data/ids/abilities';
import Natures from '../../src/data/ids/natures';
import { Genders, Species } from '../../src/data/ids/species';

registerGameData();

/** Every window the board at this origin covers, published from the given layer */
function publish(
  originX: number,
  originY: number,
  depth: Depth,
  timestamp = 5_000_000 * SNAPSHOT_INTERVAL,
): Map<string, WatchedWindow> {
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

  it("keeps a lure's extras for the rest of their window, and lets them go with it", () => {
    const lure: Buddy = {
      species: Species.Staryu,
      abilities: [Abilities.Illuminate],
      items: [],
      nature: Natures.Hardy,
      gender: Genders.Genderless,
    };
    const opened = 5_000_010 * SNAPSHOT_INTERVAL;
    const windows = publish(260, -40, Depth.Surface, opened);
    const count = (records: Map<string, WatchedWindow>, buddy: Buddy | null): number =>
      buildBoardView(260, -40, records, 480, 'player', buddy, new Set()).spawns.size;

    const alone = count(windows, null);
    const lured = count(windows, lure);
    // The buddy put away halfway through, with the expiry check in front
    const swapped = count(runningWindows(windows, opened + SNAPSHOT_INTERVAL / 2), null);
    const expired = count(runningWindows(windows, opened + SNAPSHOT_INTERVAL), null);

    expect(lured).toBeGreaterThan(alone);
    expect(swapped).toBe(lured);
    expect(expired).toBe(0);

    // The next window keeps nothing of the last one's: its extras are
    // the lure's to show again, and walking alone does not see them
    const next = publish(260, -40, Depth.Surface, opened + SNAPSHOT_INTERVAL);
    const nextAlone = count(next, null);

    expect(count(next, lure)).toBeGreaterThan(nextAlone);
  });
});
