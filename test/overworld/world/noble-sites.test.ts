// The Noble Arena: where it stands and who it holds.

import { describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { fitsSurface } from '../../../src/data/biome';
import Biome from '../../../src/data/ids/biome';
import { getSpeciesData, isFullyEvolved } from '../../../src/data/species';
import Landmark from '../../../src/data/overworld/landmark';
import landmarkPicture from '../../../src/data/overworld/landmark-sprite';
import { CANON_NOBLES, isCanonNoble } from '../../../src/data/overworld/nobles';
import { RaidKind, getRaidKindAt, getRaidTitle } from '../../../src/auth/raid-record';
import type Chunk from '../../../src/overworld/chunk';
import ChunkSnapshot, { RAID_INTERVAL } from '../../../src/overworld/chunk-snapshot';
import { Depth } from '../../../src/overworld/depth';
import World from '../../../src/overworld/world';
import { Species } from '../../../src/data/ids/species';

registerGameData();

const SPAN = 24;

/** Every chunk in a square round the origin holding a Noble Arena, with its cell */
function nobleSites(world: World): [Chunk, number][] {
  const found: [Chunk, number][] = [];

  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const chunk = world.getChunk(x, y);
      const cells: number[] = [];

      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark === Landmark.NobleArena) {
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

/** Whether a canon Noble lives in the biome of this cell */
function canonHome(snapshot: ChunkSnapshot, cell: number): boolean {
  const biome = snapshot.biomeAt(cell);

  for (const noble of CANON_NOBLES.keys()) {
    if (getSpeciesData(noble).biomes.includes(biome)) {
      return true;
    }
  }
  return false;
}

describe('Noble Arenas', () => {
  const world = new World('overworld');
  const sites = nobleSites(world);

  it('stands out in the country on dry ground, drawn as its own picture', () => {
    expect(sites.length).toBeGreaterThan(0);
    for (const [chunk, cell] of sites) {
      expect(chunk.getCellRole(cell)).toBe('ground');
    }
    expect(landmarkPicture(Landmark.NobleArena)).toBe('noble');
  });

  it('is never cut underground', () => {
    const cave = world.at(Depth.Cave);

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        expect(
          new Set(cave.getChunk(x, y).getLandmarkCells().values()).has(Landmark.NobleArena),
        ).toBe(false);
      }
    }
  });

  it('holds a final stage of its biome or a canon Noble at home there', () => {
    let staged = 0;

    for (const [chunk, cell] of sites) {
      for (let window = 0; window < 3; window++) {
        const snapshot = new ChunkSnapshot(chunk, window * RAID_INTERVAL);
        const roll = snapshot.getNobleRaids().get(cell);

        expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Noble);
        if (roll == null) {
          continue;
        }
        staged++;
        expect(roll.lair).toBeNull();
        expect(fitsSurface(roll.species, chunk.getCellSurface(cell))).toBe(true);
        if (isCanonNoble(roll.species)) {
          expect(getSpeciesData(roll.species).biomes).toContain(snapshot.biomeAt(cell));
        } else {
          expect(isFullyEvolved(roll.species)).toBe(true);
        }
      }
    }
    expect(staged).toBeGreaterThan(0);
  });

  it('turns up a canon Noble often in the biomes they live in', () => {
    let homes = 0;
    let canon = 0;

    for (const [chunk, cell] of sites) {
      for (let window = 0; window < 12; window++) {
        const snapshot = new ChunkSnapshot(chunk, window * RAID_INTERVAL);
        const roll = snapshot.getNobleRaids().get(cell);

        if (roll == null || !canonHome(snapshot, cell)) {
          continue;
        }
        homes++;
        if (isCanonNoble(roll.species)) {
          canon++;
        }
      }
    }
    expect(homes).toBeGreaterThan(0);
    // Half the time by the share, and now and then again by rule
    expect(canon / homes).toBeGreaterThan(0.4);
  });

  it('stages the same Noble all window', () => {
    for (const [chunk, cell] of sites.slice(0, 8)) {
      const roll = new ChunkSnapshot(chunk, 0).getNobleRaids().get(cell);

      expect(new ChunkSnapshot(chunk, RAID_INTERVAL - 60_000).getNobleRaids().get(cell)).toEqual(
        roll,
      );
    }
  });

  it('names the raid after its Noble', () => {
    expect(
      getRaidTitle({
        kind: RaidKind.Noble,
        lair: null,
        biome: Biome.Woodland,
        species: Species.Kleavor,
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
    ).toBe('Noble Kleavor');
  });
});
