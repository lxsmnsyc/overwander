// The Alpha's ground: where it stands and who it holds.

import { describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import {
  fitsSurface,
  getSpawnPool,
  isLegendarySpecies,
  isMythicalSpecies,
  spawnBand,
} from '../../../src/data/biome';
import { SPAWN_BAND_KEYS } from '../../../src/data/biome/__create';
import Biome, { getTimeOfDay } from '../../../src/data/ids/biome';
import { isFullyEvolved } from '../../../src/data/species';
import Landmark from '../../../src/data/overworld/landmark';
import landmarkPicture from '../../../src/data/overworld/landmark-sprite';
import { RaidKind, getRaidKindAt, getRaidTitle } from '../../../src/auth/raid-record';
import type Chunk from '../../../src/overworld/chunk';
import ChunkSnapshot, { RAID_INTERVAL } from '../../../src/overworld/chunk-snapshot';
import { Depth } from '../../../src/overworld/depth';
import World from '../../../src/overworld/world';
import { Species } from '../../../src/data/ids/species';

registerGameData();

const SPAN = 20;

/** Every chunk in a square round the origin holding an Alpha's ground, with its cell */
function alphaSites(world: World): [Chunk, number][] {
  const found: [Chunk, number][] = [];

  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const chunk = world.getChunk(x, y);
      const cells: number[] = [];

      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark === Landmark.AlphaRaid) {
          cells.push(cell);
        }
      }
      // One to a chunk at most
      expect(cells.length).toBeLessThanOrEqual(1);
      if (cells.length === 1) {
        found.push([chunk, cells[0]]);
      }
    }
  }
  return found;
}

/** Every species a cell's own spawn pool draws at that moment */
function spawnedAt(snapshot: ChunkSnapshot, cell: number, at: number): Set<Species> {
  const pool = getSpawnPool(
    snapshot.biomeAt(cell),
    getTimeOfDay(at),
    false,
    snapshot.chunk.getCellSurface(cell),
  );
  const species = new Set<Species>();

  for (const band of SPAWN_BAND_KEYS) {
    for (const entry of spawnBand(pool, band)) {
      species.add(entry.species);
    }
  }
  return species;
}

describe('Alpha sites', () => {
  const world = new World('overworld');
  const sites = alphaSites(world);

  it('stands out in the country on dry ground, drawn as its own picture', () => {
    expect(sites.length).toBeGreaterThan(0);
    for (const [chunk, cell] of sites) {
      expect(chunk.getCellRole(cell)).toBe('ground');
    }
    expect(landmarkPicture(Landmark.AlphaRaid)).toBe('alpha');
  });

  it('is never cut underground', () => {
    const cave = world.at(Depth.Cave);

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        expect(
          new Set(cave.getChunk(x, y).getLandmarkCells().values()).has(Landmark.AlphaRaid),
        ).toBe(false);
      }
    }
  });

  it('holds a species its own biome spawns there, never a legendary or a mythical', () => {
    let staged = 0;
    let young = 0;

    for (const [chunk, cell] of sites) {
      for (let window = 0; window < 3; window++) {
        const at = window * RAID_INTERVAL;
        const snapshot = new ChunkSnapshot(chunk, at);
        const roll = snapshot.getAlphaRaids().get(cell);

        expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Alpha);
        if (roll == null) {
          continue;
        }
        staged++;
        expect(roll.lair).toBeNull();
        expect(isLegendarySpecies(roll.species)).toBe(false);
        expect(isMythicalSpecies(roll.species)).toBe(false);
        expect(fitsSurface(roll.species, chunk.getCellSurface(cell))).toBe(true);
        expect(spawnedAt(snapshot, cell, snapshot.raidTimestamp).has(roll.species)).toBe(true);
        if (!isFullyEvolved(roll.species)) {
          young++;
        }
      }
    }
    expect(staged).toBeGreaterThan(0);
    // Any stage, not only the final ones a Totem or a Max Raid holds
    expect(young).toBeGreaterThan(0);
  });

  it('stages the same Alpha all window, and another one the next', () => {
    const seen = new Set<Species>();

    for (const [chunk, cell] of sites.slice(0, 8)) {
      const roll = new ChunkSnapshot(chunk, 0).getAlphaRaids().get(cell);

      expect(new ChunkSnapshot(chunk, RAID_INTERVAL - 60_000).getAlphaRaids().get(cell)).toEqual(
        roll,
      );
      for (let window = 0; window < 12; window++) {
        const later = new ChunkSnapshot(chunk, window * RAID_INTERVAL).getAlphaRaids().get(cell);

        if (later != null) {
          seen.add(later.species);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('names the raid after its Alpha', () => {
    expect(
      getRaidTitle({
        kind: RaidKind.Alpha,
        lair: null,
        biome: Biome.Woodland,
        species: Species.Rattata,
        traitValue: 0,
        host: '',
        teams: [],
        battle: null,
        timestamp: 0,
        offset: 0,
        chunk: { seed: '', x: 0, y: 0 },
        cell: 0,
        cleared: false,
      }),
    ).toBe('Alpha Raid Rattata');
  });
});
