import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data/index';
import World from '../../src/overworld/world';
import { CELL_COUNT, CHUNK_CELLS } from '../../src/overworld/chunk';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import { spawnId } from '../../src/model/snapshot-record';
import { toZoneKey } from '../../src/model/local-time';
import {
  HOUR,
  type LiveSpawn,
  MEET_DRIFT_MS,
  MIN_STAY,
  PRESENT_MAX,
  PRESENT_MIN,
  RARE_SLOT,
  SLOT_PERIOD,
  SLOT_TOTAL,
} from '../../src/overworld/spawn-life';
import {
  checkMeeting,
  cycleAt,
  cycleOf,
  getSpawnGround,
  liveSpawns,
  parseSpawnId,
  rollSlot,
  slotPhase,
} from '../../src/overworld/spawn-life/lifetimes';

registerGameData();

const DAY = 24 * HOUR;
const world = new World('overworld');
const chunk = world.getChunk(0, 0);
const KEY = `${chunk.seed}${toZoneKey(0)}`;
// Twenty minutes into an hour
const NOON = 400 * DAY + 12 * HOUR + 20 * 60 * 1000;

describe('slot clocks', () => {
  it('has cycleAt and cycleOf agree and keeps the cycles of a slot apart', () => {
    for (let slot = 0; slot < SLOT_TOTAL; slot++) {
      let previousEnd = -Infinity;
      const first = Math.floor((NOON - slotPhase(KEY, slot)) / SLOT_PERIOD);

      for (let cycle = first; cycle < first + 200; cycle++) {
        const found = cycleOf(chunk, 0, slot, cycle);

        if (found == null) {
          continue;
        }
        expect(found.start).toBe(slotPhase(KEY, slot) + cycle * SLOT_PERIOD);
        expect(found.start).toBeGreaterThanOrEqual(previousEnd);
        expect(found.end - found.start).toBeGreaterThanOrEqual(MIN_STAY);
        expect(found.end - found.start).toBeLessThanOrEqual(PRESENT_MAX);
        previousEnd = found.end;

        expect(cycleAt(chunk, 0, slot, found.start)).toEqual(found);
        expect(cycleAt(chunk, 0, slot, found.end - 1)).toEqual(found);
        expect(cycleAt(chunk, 0, slot, found.end)).toBeNull();
      }
    }
  });

  it('keeps an uncut present length in range', () => {
    let uncut = 0;

    for (let cycle = 0; cycle < 400; cycle++) {
      const found = cycleOf(chunk, 0, 3, cycle);

      if (found != null && found.end % HOUR !== 0) {
        expect(found.end - found.start).toBeGreaterThanOrEqual(PRESENT_MIN);
        expect(found.end - found.start).toBeLessThan(PRESENT_MAX);
        uncut++;
      }
    }
    expect(uncut).toBeGreaterThan(300);
  });

  it('crosses an hour mark only where the start cell stays open, and ends there when it closes', () => {
    let kept = 0;
    let cut = 0;

    for (let x = -3; x < 3; x++) {
      for (let y = -3; y < 3; y++) {
        const other = world.getChunk(x, y);
        const otherKey = `${other.seed}${toZoneKey(0)}`;

        for (let slot = 0; slot < SLOT_TOTAL; slot++) {
          const first = Math.floor((20 * DAY - slotPhase(otherKey, slot)) / SLOT_PERIOD);

          for (let cycle = first; cycle < first + (2 * DAY) / SLOT_PERIOD; cycle++) {
            const found = cycleOf(other, 0, slot, cycle);

            if (found == null) {
              continue;
            }

            const mark = (Math.floor(found.start / HOUR) + 1) * HOUR;
            const live = rollSlot(other, 0, slot, found);

            // A cycle only ever runs past a mark by keeping its cell open
            if (found.end > mark && live != null) {
              expect(getSpawnGround(other, 0, mark).closed.has(live.home)).toBe(false);
            }
            // One that starts so close to the mark that it must cross it
            if (found.start + PRESENT_MIN > mark && live != null) {
              const closes = getSpawnGround(other, 0, mark).closed.has(live.home);

              expect(found.end > mark).toBe(!closes);
              if (closes) {
                cut++;
              } else {
                kept++;
              }
            }
          }
        }
      }
    }
    expect(kept).toBeGreaterThan(10);
    expect(cut).toBeGreaterThan(0);
  });

  it('stands about 0.727 of the day on average', () => {
    let present = 0;
    let total = 0;

    for (let at = 0; at < 12; at++) {
      const other = world.getChunk(at, 7);
      const otherKey = `${other.seed}${toZoneKey(0)}`;

      for (let slot = 0; slot < SLOT_TOTAL; slot++) {
        const first = Math.floor((10 * DAY - slotPhase(otherKey, slot)) / SLOT_PERIOD);
        const last = Math.floor((11 * DAY - slotPhase(otherKey, slot)) / SLOT_PERIOD);

        for (let cycle = first; cycle <= last; cycle++) {
          const found = cycleOf(other, 0, slot, cycle);

          if (found != null) {
            present += Math.min(found.end, 11 * DAY) - Math.max(found.start, 10 * DAY);
          }
        }
        total += DAY;
      }
    }
    expect(Math.abs(present / total - 0.727)).toBeLessThan(0.02);
  });

  it('leaves the board standing just after an hour mark', () => {
    for (let hour = 0; hour < 6; hour++) {
      const mark = 400 * DAY + (hour + 1) * HOUR;

      expect(liveSpawns(chunk, 0, mark + 60_000).length).toBeGreaterThan(3);
    }
  });
});

describe('the ground of an hour', () => {
  it('deals disjoint territories that hold no closed cell', () => {
    for (const [x, y] of [
      [0, 0],
      [3, -2],
      [-7, 5],
    ]) {
      const other = world.getChunk(x, y);
      const ground = getSpawnGround(other, 0, NOON);
      const closed = new ChunkSnapshot(other, NOON, 0).getClosedCells();
      const seen = new Set<number>();

      expect(ground.territories).toHaveLength(SLOT_TOTAL);
      expect(ground.kinds[RARE_SLOT]).toBe('rare');
      for (const territory of ground.territories) {
        for (const cell of territory) {
          expect(closed.has(cell)).toBe(false);
          expect(seen.has(cell)).toBe(false);
          seen.add(cell);
        }
      }
    }
  });

  it('is one ground for the whole hour and another for the next', () => {
    const start = Math.floor(NOON / HOUR) * HOUR;

    expect(getSpawnGround(chunk, 0, start + 5)).toBe(getSpawnGround(chunk, 0, start + HOUR - 5));
    expect(getSpawnGround(chunk, 0, start + HOUR)).not.toBe(getSpawnGround(chunk, 0, start));
  });

  it('starts street slots on town cells only', () => {
    let seenStreet = false;

    for (let x = -12; x < 12 && !seenStreet; x++) {
      for (let y = -12; y < 12 && !seenStreet; y++) {
        const other = world.getChunk(x, y);
        const ground = getSpawnGround(other, 0, NOON);

        for (let slot = 0; slot < SLOT_TOTAL; slot++) {
          for (const cell of ground.territories[slot]) {
            expect(other.isTownCell(cell)).toBe(ground.kinds[slot] === 'street');
          }
          seenStreet ||= ground.kinds[slot] === 'street';
        }
      }
    }
    expect(seenStreet).toBe(true);
  });
});

describe('rolling a slot', () => {
  it('never starts two slots on one cell', () => {
    for (const time of [NOON, NOON + HOUR, NOON + 5 * HOUR]) {
      const homes = new Set<number>();

      for (const live of liveSpawns(chunk, 0, time)) {
        expect(homes.has(live.home)).toBe(false);
        homes.add(live.home);
        expect(live.home).toBeGreaterThanOrEqual(0);
        expect(live.home).toBeLessThan(CELL_COUNT);
      }
    }
  });

  it('names a live spawn by its cycle start and slot', () => {
    const standing = liveSpawns(chunk, 0, NOON);

    expect(standing.length).toBeGreaterThan(0);
    for (const live of standing) {
      expect(live.id).toBe(spawnId(KEY, live.cycle.start, live.slot));
      expect(parseSpawnId(live.id)).toEqual({ key: KEY, start: live.cycle.start, slot: live.slot });
      expect(rollSlot(chunk, 0, live.slot, live.cycle)).toEqual(live);
    }
  });

  it('rolls the same again on a fresh world', () => {
    const first = liveSpawns(chunk, 0, NOON).map((live) => structuredClone(live));
    const again = liveSpawns(new World('overworld').getChunk(0, 0), 0, NOON);

    expect(again).toEqual(first);
  });

  it('pins the rolls of one chunk and one hour', () => {
    const rows = new Set<string>();

    for (let time = NOON; time < NOON + HOUR; time += 60 * 1000) {
      for (const live of liveSpawns(chunk, 0, time)) {
        rows.add(`${live.id}|${live.kind}|${live.spawn[0]}|${live.home}`);
      }
    }
    expect([...rows]).toMatchSnapshot();
  });

  it('meets ordinary slots far more often than the rare one', () => {
    const kinds = new Map<string, number>();

    for (let time = NOON; time < NOON + 2 * DAY; time += SLOT_PERIOD) {
      for (const live of liveSpawns(chunk, 0, time)) {
        kinds.set(live.kind, (kinds.get(live.kind) ?? 0) + 1);
      }
    }
    expect(kinds.get('country')).toBeGreaterThan(100);
    expect(kinds.get('rare') ?? 0).toBeLessThan(30);
  });
});

describe('the server check', () => {
  const standing = liveSpawns(chunk, 0, NOON);
  const live = standing[0];
  const individual = live.spawn[1];
  const meet = (
    id: string,
    value: number,
    cell: number,
    time: number,
    at = chunk,
    zone = 0,
  ): LiveSpawn | null => checkMeeting(at, zone, id, value, cell, time);

  it('accepts a meeting inside the cycle', () => {
    expect(meet(live.id, individual, live.home, NOON)).toEqual(live);
    expect(meet(live.id, individual, live.home, live.cycle.start)).toEqual(live);
  });

  it('accepts the drift at both edges and refuses past it', () => {
    const { start, end } = live.cycle;

    expect(meet(live.id, individual, live.home, start - MEET_DRIFT_MS)).toEqual(live);
    expect(meet(live.id, individual, live.home, end + MEET_DRIFT_MS - 1)).toEqual(live);
    expect(meet(live.id, individual, live.home, start - MEET_DRIFT_MS - 1)).toBeNull();
    expect(meet(live.id, individual, live.home, end + MEET_DRIFT_MS)).toBeNull();
  });

  it('accepts a cell one away and refuses farther', () => {
    const column = live.home % CHUNK_CELLS;
    const step = column < CHUNK_CELLS - 1 ? 1 : -1;
    const far = column < CHUNK_CELLS - 4 ? 4 : -4;

    expect(meet(live.id, individual, live.home + step, NOON)).toEqual(live);
    expect(meet(live.id, individual, live.home + far, NOON)).toBeNull();
  });

  it('refuses a wrong individual value', () => {
    expect(meet(live.id, individual + 1, live.home, NOON)).toBeNull();
  });

  it('refuses a wrong slot, key, start, zone, chunk and a bad id', () => {
    const other = (live.slot + 1) % SLOT_TOTAL;
    const { start } = live.cycle;

    expect(meet(spawnId(KEY, start, other), individual, live.home, NOON)).toBeNull();
    expect(meet(spawnId(KEY, start, SLOT_TOTAL), individual, live.home, NOON)).toBeNull();
    expect(meet(spawnId(`${KEY}x`, start, live.slot), individual, live.home, NOON)).toBeNull();
    expect(meet(spawnId(KEY, start + 1, live.slot), individual, live.home, NOON)).toBeNull();
    expect(meet('nonsense', individual, live.home, NOON)).toBeNull();
    expect(meet(live.id, individual, live.home, NOON, world.getChunk(1, 0))).toBeNull();
    expect(meet(live.id, individual, live.home, NOON, chunk, 480)).toBeNull();
  });

  it('parses only spawn ids', () => {
    expect(parseSpawnId('a@b#c')).toBeNull();
    expect(parseSpawnId('@5#1')).toBeNull();
    expect(parseSpawnId('key@-5#11')).toEqual({ key: 'key', start: -5, slot: 11 });
  });

  it('refuses an id that is not written the one way', () => {
    expect(parseSpawnId('key@5#07')).toBeNull();
    expect(parseSpawnId('key@-0#3')).toBeNull();
    expect(parseSpawnId('key@05#3')).toBeNull();
    expect(parseSpawnId('key@+5#3')).toBeNull();
    expect(parseSpawnId('key@5#3')).toEqual({ key: 'key', start: 5, slot: 3 });
  });
});
