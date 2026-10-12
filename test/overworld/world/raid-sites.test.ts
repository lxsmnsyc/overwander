// The two raid sites a lair is not: the Max Raid and the Totem.

import { describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { fitsSurface } from '../../../src/data/biome';
import { canGigantamax } from '../../../src/data/moves/gmax-moves';
import Landmark from '../../../src/data/overworld/landmark';
import { getTotemsOf, isTotemSpecies } from '../../../src/data/overworld/totems';
import { RaidKind, getRaidKindAt, getRaidTitle } from '../../../src/auth/raid-record';
import type Chunk from '../../../src/overworld/chunk';
import ChunkSnapshot, { RAID_INTERVAL } from '../../../src/overworld/chunk-snapshot';
import { Depth } from '../../../src/overworld/depth';
import { isGigantamaxBoss } from '../../../src/overworld/raid';
import World from '../../../src/overworld/world';
import Biome from '../../../src/data/ids/biome';
import { Species } from '../../../src/data/ids/species';

registerGameData();

const SPAN = 20;

/** Every chunk in a square round the origin holding a landmark of this kind */
function chunksWith(world: World, kind: Landmark): Chunk[] {
  const found: Chunk[] = [];

  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const chunk = world.getChunk(x, y);

      if (new Set(chunk.getLandmarkCells().values()).has(kind)) {
        found.push(chunk);
      }
    }
  }
  return found;
}

/** The cells of one kind of landmark in a chunk */
function cellsOf(chunk: Chunk, kind: Landmark): number[] {
  const cells: number[] = [];

  for (const [cell, landmark] of chunk.getLandmarkCells()) {
    if (landmark === kind) {
      cells.push(cell);
    }
  }
  return cells;
}

describe('raid sites', () => {
  const world = new World('overworld');
  const maxRaids = chunksWith(world, Landmark.MaxRaid);
  const totems = chunksWith(world, Landmark.Totem);

  it('stands Max Raids and Totems out in the country, one of each to a chunk at most', () => {
    expect(maxRaids.length).toBeGreaterThan(0);
    expect(totems.length).toBeGreaterThan(0);

    for (const [chunk, kind] of [
      ...maxRaids.map((one) => [one, Landmark.MaxRaid] as const),
      ...totems.map((one) => [one, Landmark.Totem] as const),
    ]) {
      const cells = cellsOf(chunk, kind);

      expect(cells.length).toBe(1);
      // Dry ground: a hole and a trial site are dug into the land
      expect(chunk.getCellRole(cells[0])).toBe('ground');
    }
  });

  it('never cuts a Max Raid underground, though a Totem may hold a cave', () => {
    const cave = world.at(Depth.Cave);
    let caveTotems = 0;

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        const kinds = new Set(cave.getChunk(x, y).getLandmarkCells().values());

        expect(kinds.has(Landmark.MaxRaid)).toBe(false);
        if (kinds.has(Landmark.Totem)) {
          caveTotems++;
        }
      }
    }
    expect(caveTotems).toBeGreaterThan(0);
  });

  it('keeps every lair its own legendary or shadow, with no Totem in it', () => {
    let lairs = 0;

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        const chunk = world.getChunk(x, y);

        for (let window = 0; window < 4; window++) {
          const snapshot = new ChunkSnapshot(chunk, window * RAID_INTERVAL);

          for (const [cell, landmark] of chunk.getLandmarkCells()) {
            if (landmark === Landmark.LegendaryLair) {
              lairs++;
              // Held by its legendary, or standing as a shadow lair
              expect(
                snapshot.getLegendaryLairs().has(cell) || snapshot.getFallenLairs().has(cell),
              ).toBe(true);
            }
            if (landmark === Landmark.ShadowLair) {
              expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Shadow);
            }
          }
          for (const cell of snapshot.getTotems().keys()) {
            expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.Totem);
          }
          for (const cell of snapshot.getMaxRaids().keys()) {
            expect(chunk.getLandmarkCells().get(cell)).toBe(Landmark.MaxRaid);
          }
        }
      }
    }
    expect(lairs).toBeGreaterThan(0);
  });

  it('holds a Totem every window, a final stage the tile can stand', () => {
    let staged = 0;
    let windows = 0;

    for (const chunk of totems) {
      const [cell] = cellsOf(chunk, Landmark.Totem);

      for (let window = 0; window < 3; window++) {
        const snapshot = new ChunkSnapshot(chunk, window * RAID_INTERVAL);
        const roll = snapshot.getTotems().get(cell);

        windows++;
        expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Totem);
        if (roll == null) {
          continue;
        }
        staged++;
        expect(isTotemSpecies(roll.species)).toBe(true);
        expect(roll.lair).toBeNull();
        expect(fitsSurface(roll.species, chunk.getCellSurface(cell))).toBe(true);
      }
    }
    // Only a tile with no final stage of its own stands empty
    expect(staged / windows).toBeGreaterThan(0.9);
  });

  it('stages a Max Raid boss from the final stages of its biome, the same all window', () => {
    let staged = 0;

    for (const chunk of maxRaids) {
      const [cell] = cellsOf(chunk, Landmark.MaxRaid);
      const snapshot = new ChunkSnapshot(chunk, 0);
      const roll = snapshot.getMaxRaids().get(cell);

      expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Max);
      if (roll == null) {
        continue;
      }
      staged++;
      expect(isTotemSpecies(roll.species)).toBe(true);
      expect(getTotemsOf(roll.species)).toContain(roll.species);
      expect(fitsSurface(roll.species, chunk.getCellSurface(cell))).toBe(true);

      // Later in the same window, and asked again: the same boss
      const later = new ChunkSnapshot(chunk, RAID_INTERVAL - 60_000);

      expect(later.getMaxRaids().get(cell)).toEqual(roll);
      expect(new ChunkSnapshot(chunk, 0).getMaxRaids().get(cell)).toEqual(roll);
    }
    expect(staged).toBeGreaterThan(0);
  });

  it('turns a Max Raid boss over with the window', () => {
    const seen = new Set<Species>();

    for (const chunk of maxRaids.slice(0, 8)) {
      const [cell] = cellsOf(chunk, Landmark.MaxRaid);

      for (let window = 0; window < 12; window++) {
        const roll = new ChunkSnapshot(chunk, window * RAID_INTERVAL).getMaxRaids().get(cell);

        if (roll != null) {
          seen.add(roll.species);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('Gigantamaxes a boss exactly when its species can', () => {
    expect(isGigantamaxBoss(Species.Charizard)).toBe(true);
    expect(isGigantamaxBoss(Species.Salazzle)).toBe(false);

    for (const species of [Species.Venusaur, Species.Lapras, Species.Machamp, Species.Golem]) {
      expect(isGigantamaxBoss(species)).toBe(canGigantamax(species));
    }
  });

  it('names a Max Raid and a Totem after the boss', () => {
    const base = {
      lair: null,
      biome: Biome.Woodland,
      species: Species.Snorlax,
      traitValue: 0,
      host: '',
      teams: [],
      battle: null,
      timestamp: 0,
      offset: 0,
      chunk: { seed: '', x: 0, y: 0 },
      cell: 0,
      cleared: false,
    };

    expect(getRaidTitle({ ...base, kind: RaidKind.Max })).toBe('Max Raid Snorlax');
    expect(getRaidTitle({ ...base, kind: RaidKind.Totem })).toBe('Totem Snorlax');
  });
});
