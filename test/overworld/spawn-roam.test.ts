import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data/index';
import { fitsSurface } from '../../src/data/biome';
import { SpawnSurface } from '../../src/data/ids/biome';
import { buildBoardView, findSpawnAt } from '../../src/game/overworld/board-view';
import { stepSpawn } from '../../src/canvas/overworld/chunk-view/spawn-walk';
import { Depth } from '../../src/overworld/depth';
import World from '../../src/overworld/world';
import type Chunk from '../../src/overworld/chunk';
import { CELL_COUNT, CHUNK_CELLS } from '../../src/overworld/chunk';
import { HOUR, type LiveSpawn, MEET_DRIFT_MS } from '../../src/overworld/spawn-life';
import { checkMeeting, getSpawnGround, liveSpawns } from '../../src/overworld/spawn-life/lifetimes';
import {
  LEASH_CELLS,
  STEP_MS,
  TOWN_LEASH_CELLS,
  WALK_DELAY_MAX,
  WAYPOINT_MS,
  getRoamArea,
  positionAt,
} from '../../src/overworld/spawn-life/roam';

registerGameData();

const DAY = 24 * HOUR;
const world = new World('overworld');
// Twenty minutes into an hour
const NOON = 400 * DAY + 12 * HOUR + 20 * 60 * 1000;

interface Standing {
  chunk: Chunk;
  live: LiveSpawn;
}

/** Every pokemon standing over some hours of a stretch of chunks */
function collect(range: number[], hours: number): Standing[] {
  const found: Standing[] = [];

  for (const x of range) {
    for (const y of range) {
      const chunk = world.getChunk(x, y);

      for (let hour = 0; hour < hours; hour++) {
        for (const live of liveSpawns(chunk, 0, NOON + hour * HOUR)) {
          found.push({ chunk, live });
        }
      }
    }
  }
  return found;
}

const sample = collect([-2, -1, 0, 1, 2], 2);

function apart(one: number, other: number): number {
  return Math.max(
    Math.abs((one % CHUNK_CELLS) - (other % CHUNK_CELLS)),
    Math.abs(Math.floor(one / CHUNK_CELLS) - Math.floor(other / CHUNK_CELLS)),
  );
}

describe('the roam area', () => {
  it('holds the start cell first, inside the leash, with no cell twice', () => {
    expect(sample.length).toBeGreaterThan(50);
    for (const { chunk, live } of sample) {
      const area = getRoamArea(chunk, 0, live);
      const leash = live.kind === 'street' ? TOWN_LEASH_CELLS : LEASH_CELLS;

      expect(area.cells[0]).toBe(live.home);
      expect(new Set(area.cells).size).toBe(area.cells.length);
      expect(area.cells.length).toBeLessThanOrEqual((2 * leash + 1) ** 2);
      for (const cell of area.cells) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(CELL_COUNT);
        expect(apart(cell, live.home)).toBeLessThanOrEqual(leash);
      }
    }
  });

  it('never holds a cell the hour closes: no landmark, scenery, rock, face, lava or phenomenon', () => {
    for (const { chunk, live } of sample) {
      const closed = getSpawnGround(chunk, 0, live.cycle.start).closed;

      for (const cell of getRoamArea(chunk, 0, live).cells) {
        expect(closed.has(cell)).toBe(false);
        expect(chunk.getLandmarkCells().has(cell)).toBe(false);
      }
    }
  });

  it('keeps a water species on water, and a ground species off it', () => {
    let water = 0;
    let ground = 0;

    for (const { chunk, live } of collect([-6, -4, -3, 3, 4, 6], 1)) {
      const [species] = live.spawn;
      const surfaces = new Set<SpawnSurface>();

      for (const cell of getRoamArea(chunk, 0, live).cells) {
        surfaces.add(chunk.getCellSurface(cell));
        expect(fitsSurface(species, chunk.getCellSurface(cell))).toBe(true);
      }
      if (!fitsSurface(species, SpawnSurface.Land) && surfaces.size > 0) {
        expect([...surfaces]).toEqual([SpawnSurface.Water]);
        water++;
      }
      if (!fitsSurface(species, SpawnSurface.Water)) {
        expect(surfaces.has(SpawnSurface.Water)).toBe(false);
        ground++;
      }
    }
    expect(water).toBeGreaterThan(0);
    expect(ground).toBeGreaterThan(0);
  });

  it('keeps a country slot out of the town, and a street slot on its streets', () => {
    let country = 0;
    let streets = 0;

    for (const { chunk, live } of sample) {
      const area = getRoamArea(chunk, 0, live);

      for (const cell of area.cells) {
        expect(chunk.isTownCell(cell)).toBe(live.kind === 'street');
      }
      if (live.kind === 'street') {
        streets++;
      } else {
        country++;
      }
    }
    expect(country).toBeGreaterThan(0);
    expect(streets).toBeGreaterThan(0);
  });
});

describe('where a pokemon stands', () => {
  it('stays inside its area, one cell at a time', () => {
    for (const { chunk, live } of sample.slice(0, 60)) {
      const area = getRoamArea(chunk, 0, live);
      let previous = live.home;

      for (let time = live.cycle.start; time < live.cycle.end; time += 100) {
        const at = positionAt(area, live, time);

        expect(area.open.has(at.cell)).toBe(true);
        expect(Math.abs(at.dx)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(at.dy)).toBeLessThanOrEqual(0.5);
        expect(apart(at.cell, previous)).toBeLessThanOrEqual(1);
        previous = at.cell;
      }
    }
  });

  it('ends every walk inside its epoch', () => {
    let walked = 0;

    for (const { chunk, live } of sample.slice(0, 60)) {
      const area = getRoamArea(chunk, 0, live);

      // The longest walk, a pause and 8 steps, fits the epoch with room to spare
      expect(WALK_DELAY_MAX - 1 + 2 * LEASH_CELLS * STEP_MS).toBeLessThan(WAYPOINT_MS);

      for (let epoch = 0; epoch < 40; epoch++) {
        const begin = live.cycle.start + epoch * WAYPOINT_MS;
        const early = positionAt(area, live, begin);
        const late = positionAt(area, live, begin + WAYPOINT_MS - 1);
        const next = positionAt(area, live, begin + WAYPOINT_MS);

        // It stands at its waypoint before the next epoch starts, and starts the next one there
        expect(late.moving).toBe(false);
        expect(late.dx).toBe(0);
        expect(next.cell).toBe(late.cell);
        if (early.cell !== late.cell) {
          walked++;
        }
      }
    }
    expect(walked).toBeGreaterThan(100);
  });

  it('pauses before it walks, and heads the way of its step', () => {
    let moved = 0;

    for (const { chunk, live } of sample.slice(0, 40)) {
      const area = getRoamArea(chunk, 0, live);

      for (let time = live.cycle.start; time < live.cycle.end; time += 250) {
        const at = positionAt(area, live, time);

        if (at.moving) {
          moved++;
          expect(Math.abs(at.heading?.[0] ?? 0) + Math.abs(at.heading?.[1] ?? 0)).toBeGreaterThan(
            0,
          );
        }
        expect(positionAt(area, live, time - 1).cell).toBeDefined();
      }
    }
    expect(moved).toBeGreaterThan(100);
  });

  it('gives the same answer however the times are asked', () => {
    for (const { chunk, live } of sample.slice(0, 20)) {
      const times: number[] = [];

      for (let time = live.cycle.start; time < live.cycle.end; time += 700) {
        times.push(time);
      }

      const forward = times.map((time) => positionAt(getRoamArea(chunk, 0, live), live, time));
      const backward = times
        .toReversed()
        .map((time) => positionAt(getRoamArea(chunk, 0, live), live, time))
        .toReversed();

      expect(backward).toEqual(forward);
    }
  });
});

describe('the server check follows the walk', () => {
  it('accepts a press at the roamer, or one cell off it now or a second ago, and refuses the start cell once it has gone', () => {
    let left = 0;

    for (const { chunk, live } of sample.slice(0, 80)) {
      const area = getRoamArea(chunk, 0, live);

      for (let time = live.cycle.start; time < live.cycle.end; time += 1_300) {
        const here = positionAt(area, live, time).cell;
        const before = positionAt(area, live, time - MEET_DRIFT_MS).cell;
        const ask = (cell: number): LiveSpawn | null =>
          checkMeeting(chunk, 0, live.id, live.spawn[1], cell, time);

        expect(ask(here)?.id).toBe(live.id);
        expect(ask(before)?.id).toBe(live.id);

        if (apart(live.home, here) > 1 && apart(live.home, before) > 1) {
          expect(ask(live.home)).toBeNull();
          left++;
        }
      }
    }
    expect(left).toBeGreaterThan(0);
  });
});

describe('the board follows the walk', () => {
  const now = 5_000_000 * 300_000 + 17_000;
  const view = buildBoardView(
    260,
    -40,
    new Map(),
    480,
    'player',
    null,
    new Set(),
    Depth.Surface,
    now,
  );

  it('finds a pokemon on the cell it is drawn in, and not on the cell it left', () => {
    let moved = 0;

    expect(view.spawns.size).toBeGreaterThan(0);
    for (const spawn of view.spawns.values()) {
      for (let time = now; time < now + 20_000; time += 400) {
        const here = stepSpawn(spawn.walk, time);

        if (here == null) {
          continue;
        }

        const found = findSpawnAt(view, here.index, time);

        // Either it, or one on the same cell with a lower slot
        expect(found).toBeDefined();
        expect(found?.walk.live.slot).toBeLessThanOrEqual(spawn.walk.live.slot);
        expect(stepSpawn(found!.walk, time)?.index).toBe(here.index);
        if (here.moving) {
          moved++;
        }
      }
    }
    expect(moved).toBeGreaterThan(0);
  });
});
