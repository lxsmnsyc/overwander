import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import {
  type WatchedWindow,
  buildBoardView,
  runningWindows,
  viewChunks,
} from '../../src/game/overworld/board-view';
import { BOARD_CELLS, BOARD_CENTER } from '../../src/game/overworld/board-metrics';
import AleaRNG from '../../src/core/alea';
import { chunkOfCell } from '../../src/overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../src/overworld/chunk-snapshot';
import { SLOT_PERIOD, SLOT_TOTAL } from '../../src/overworld/spawn-life';
import { cycleAt, liveSpawns, parseSpawnId } from '../../src/overworld/spawn-life/lifetimes';
import { spawnKey } from '../../src/overworld/safari';
import getWorld from '../../src/overworld/current';
import { isLavaAt } from '../../src/overworld/terrain/ground';
import { pickFreeCell } from '../../src/overworld/start';
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

    // The pokemon are not in a window: the board derives them from the clock
    windows.set(`${x},${y}`, {
      x,
      y,
      record: { seed: snapshot.chunk.seed, offset: 480, timestamp, spawns: [] },
    });
  }
  return windows;
}

describe("a volcano's lava", () => {
  it('walls a walk off and keeps everything off it', () => {
    const world = getWorld(Depth.Surface);
    let found: [number, number] | null = null;

    for (let y = -1500; y <= 1500 && found == null; y += 7) {
      for (let x = -1500; x <= 1500; x += 7) {
        if (isLavaAt(world, x, y)) {
          found = [x, y];
          break;
        }
      }
    }
    if (found == null) {
      throw new Error('no lava in the sampled world');
    }

    const [lavaX, lavaY] = found;
    const originX = lavaX - BOARD_CENTER;
    const originY = lavaY - BOARD_CENTER;
    const view = buildBoardView(
      originX,
      originY,
      publish(originX, originY, Depth.Surface),
      480,
      'player',
      null,
      new Set(),
    );

    expect(view.walls.has(BOARD_CENTER * BOARD_CELLS + BOARD_CENTER)).toBe(true);

    const chunk = world.getChunk(chunkOfCell(lavaX), chunkOfCell(lavaY));
    const lava = chunk.getLavaCells();
    const snapshot = new ChunkSnapshot(chunk, 5_000_000 * SNAPSHOT_INTERVAL, 480);

    expect(lava.size).toBeGreaterThan(0);
    for (let step = 0; step < 40; step++) {
      for (const live of liveSpawns(chunk, 480, snapshot.timestamp + step * 60_000)) {
        expect(lava.has(live.home), `spawn at ${live.home}`).toBe(false);
      }
    }
    for (const cell of chunk.getLandmarkCells().keys()) {
      expect(lava.has(cell), `landmark at ${cell}`).toBe(false);
    }
    for (const cell of snapshot.getPhenomena().keys()) {
      expect(lava.has(cell), `phenomenon at ${cell}`).toBe(false);
    }
    for (let seed = 0; seed < 20; seed++) {
      const { cellX, cellY } = pickFreeCell(world, chunk.x, chunk.y, new AleaRNG(`lava${seed}`));

      expect(lava.has(cellY * 16 + cellX), `start at ${cellX},${cellY}`).toBe(false);
    }
  });
});

describe('the spawns a board draws', () => {
  const NOON = 5_000_010 * SNAPSHOT_INTERVAL + 60_000;
  const lure: Buddy = {
    species: Species.Staryu,
    shiny: false,
    abilities: [Abilities.Illuminate],
    items: [],
    nature: Natures.Hardy,
    gender: Genders.Genderless,
  };
  const build = (
    now: number,
    buddy: Buddy | null = null,
    fled: Set<string> = new Set(),
    depth: Depth = Depth.Surface,
  ): ReturnType<typeof buildBoardView> =>
    buildBoardView(
      260,
      -40,
      publish(260, -40, depth, Math.floor(now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL),
      480,
      'player',
      buddy,
      fled,
      depth,
      now,
    );

  it('puts the same pokemon on the same cells for two clients at one instant', () => {
    const first = build(NOON);
    const second = build(NOON);

    expect(first.spawns.size).toBeGreaterThan(0);
    expect([...second.spawns]).toEqual([...first.spawns]);
  });

  it('draws them before their window has landed, from the clock alone', () => {
    const landed = build(NOON);
    const unread = buildBoardView(
      260,
      -40,
      new Map(),
      480,
      'player',
      null,
      new Set(),
      Depth.Surface,
      NOON,
    );

    expect([...unread.spawns.keys()]).toEqual([...landed.spawns.keys()]);
    for (const [seat, spawn] of unread.spawns) {
      expect(unread.at(seat)?.snapshot.chunk).toBeDefined();
      expect(spawn.id).toBe(landed.spawns.get(seat)?.id);
    }
  });

  it("draws the cave's slots in a cave and the ground's on the ground", () => {
    const surface = build(NOON);
    const cave = build(NOON, null, new Set(), Depth.Cave);

    expect(surface.spawns.size).toBeGreaterThan(0);
    for (const { id } of surface.spawns.values()) {
      expect(id).not.toContain('cave');
    }
    for (const { id } of cave.spawns.values()) {
      expect(id).toContain('cave');
    }
  });

  it('lets a spawn leave at its cycle end and fills its place after the rest', () => {
    const view = build(NOON);
    const [[seat, spawn]] = [...view.spawns];
    const parsed = parseSpawnId(spawn.id);
    const chunk = view.at(seat)?.snapshot.chunk;

    if (parsed == null || chunk == null) {
      throw new Error('the spawn names no cycle');
    }

    const cycle = cycleAt(chunk, 480, parsed.slot, NOON);

    if (cycle == null) {
      throw new Error('the spawn stands outside its cycle');
    }

    // Standing until the last millisecond, gone at the end
    expect(build(cycle.end - 1).spawns.get(seat)?.id).toBe(spawn.id);
    expect(build(cycle.end).spawns.get(seat)?.id).not.toBe(spawn.id);
    expect([...build(cycle.end).spawns.values()].some((held) => held.id === spawn.id)).toBe(false);

    // The slot rests, then rolls again under a new id (a new cycle start)
    let arrival: string | null = null;

    for (
      let time = cycle.end;
      time < cycle.end + 3 * SLOT_PERIOD && arrival == null;
      time += 10_000
    ) {
      for (const live of liveSpawns(chunk, 480, time)) {
        if (live.slot === parsed.slot) {
          arrival = live.id;
        }
      }
    }
    expect(arrival).not.toBeNull();
    expect(arrival).not.toBe(spawn.id);
  });

  it('hides a spawn that has fled until its cycle ends, then shows the next', () => {
    const view = build(NOON);
    const [[seat, spawn]] = [...view.spawns];
    const parsed = parseSpawnId(spawn.id);
    const snapshot = view.at(seat)?.snapshot;

    if (parsed == null || snapshot == null) {
      throw new Error('the spawn names no cycle');
    }

    const cycle = cycleAt(snapshot.chunk, 480, parsed.slot, NOON);
    const window = Math.floor(parsed.start / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    const fled = new Set([spawnKey(snapshot.chunk.x, snapshot.chunk.y, window, spawn.spawn[1])]);

    expect(build(NOON, null, fled).spawns.has(seat)).toBe(false);
    expect(cycle).not.toBeNull();

    // Every other slot is untouched
    expect(build(NOON, null, fled).spawns.size).toBe(view.spawns.size - 1);
    expect(parsed.slot).toBeLessThan(SLOT_TOTAL);
  });

  it("keeps a lure's extras for the rest of their cycle, and lets them go with it", () => {
    const alone = build(NOON).spawns.size;
    const lured = build(NOON, lure).spawns.size;
    // The buddy put away halfway through
    const swapped = build(NOON + 1_000).spawns.size;

    expect(lured).toBeGreaterThan(alone);
    expect(swapped).toBeGreaterThanOrEqual(lured - 2);
    expect(swapped).toBeGreaterThan(alone);

    // A whole period later every cycle shown before has ended
    const later = NOON + 2 * SLOT_PERIOD;
    const nextAlone = build(later).spawns.size;

    expect(build(later, lure).spawns.size).toBeGreaterThan(nextAlone);
  });
});

describe('the windows a board holds', () => {
  it('lets one run out without taking the pokemon with it', () => {
    const opened = 5_000_010 * SNAPSHOT_INTERVAL;
    const windows = publish(260, -40, Depth.Surface, opened);

    expect(runningWindows(windows, opened + SNAPSHOT_INTERVAL / 2).size).toBe(windows.size);
    expect(runningWindows(windows, opened + SNAPSHOT_INTERVAL).size).toBe(0);

    const spawns = buildBoardView(
      260,
      -40,
      runningWindows(windows, opened + SNAPSHOT_INTERVAL),
      480,
      'player',
      null,
      new Set(),
      Depth.Surface,
      opened + SNAPSHOT_INTERVAL + 1_000,
    ).spawns;

    expect(spawns.size).toBeGreaterThan(0);
  });
});

describe('people past the live circle', () => {
  it('are dressed by the clock where no window has landed', () => {
    const now = 5_000_000 * SNAPSHOT_INTERVAL;
    const unread = buildBoardView(180, -120, new Map(), 480, 'player', null, new Set());
    const dressed = buildBoardView(
      180,
      -120,
      new Map(),
      480,
      'player',
      null,
      new Set(),
      Depth.Surface,
      now,
    );
    // The same coats every published window at this hour would put on them
    const published = buildBoardView(
      180,
      -120,
      publish(180, -120, Depth.Surface, now),
      480,
      'player',
      null,
      new Set(),
    );

    expect(unread.coats.size).toBe(0);
    expect(dressed.coats.size).toBeGreaterThan(0);
    expect(dressed.coats).toEqual(published.coats);
  });
});
