// The Tera crystal: where it stands, who it holds, and that nothing else moved for it.

import { describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { fitsSurface, isLegendarySpecies, isMythicalSpecies } from '../../../src/data/biome';
import Biome from '../../../src/data/ids/biome';
import { isFullyEvolved } from '../../../src/data/species';
import Landmark from '../../../src/data/overworld/landmark';
import landmarkPicture from '../../../src/data/overworld/landmark-sprite';
import { RaidKind, getRaidKindAt, getRaidTitle } from '../../../src/model/raid-record';
import type Chunk from '../../../src/overworld/chunk';
import ChunkSnapshot, { RAID_INTERVAL } from '../../../src/overworld/chunk-snapshot';
import World, { Depth, Generation } from '../../../src/overworld/world';
import { Species } from '../../../src/data/ids/species';

registerGameData();

const SPAN = 16;

/** Every chunk in a square round the origin holding a Tera crystal, with its cell */
function teraSites(world: World): [Chunk, number][] {
  const found: [Chunk, number][] = [];

  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const chunk = world.getChunk(x, y);
      const cells: number[] = [];

      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (landmark === Landmark.TeraRaid) {
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

/**
 * Every landmark over the square, in a digest, with each Tera crystal
 * read as the cache it was carved from
 */
function landmarkDigest(world: World): string {
  let value = 0x811c9dc5;

  for (let y = -SPAN; y < SPAN; y++) {
    for (let x = -SPAN; x < SPAN; x++) {
      const cells = [...world.getChunk(x, y).getLandmarkCells()].sort((a, b) => a[0] - b[0]);

      for (const [cell, landmark] of cells) {
        const was = landmark === Landmark.TeraRaid ? Landmark.ItemCache : landmark;
        const text = `${x},${y},${cell},${was};`;

        for (let at = 0; at < text.length; at++) {
          value = Math.imul(value ^ text.charCodeAt(at), 16777619);
        }
      }
    }
  }
  return (value >>> 0).toString(16);
}

describe('Tera crystals', () => {
  const world = new World('overworld');
  const sites = teraSites(world);
  const caves = teraSites(world.at(Depth.Cave));

  it('stands on dry ground, drawn as its own picture', () => {
    expect(sites.length).toBeGreaterThan(0);
    for (const [chunk, cell] of [...sites, ...caves]) {
      expect(chunk.getCellRole(cell)).toBe('ground');
    }
    expect(landmarkPicture(Landmark.TeraRaid)).toBe('tera');
  });

  it('grows underground too', () => {
    expect(caves.length).toBeGreaterThan(0);
  });

  it('takes only rolls that were caches, so every other landmark stands where it did', () => {
    // Pinned before the crystal was carved out: with each crystal read
    // back as its cache, every map is exactly what it was
    for (const [generation, surface, cave] of [
      [Generation.First, '2ee5061e', '8edfc703'],
      [Generation.Second, '3cb3eb9d', '770026f7'],
    ] as const) {
      const pinned = new World('overworld', Depth.Surface, generation);

      expect(landmarkDigest(pinned)).toBe(surface);
      expect(landmarkDigest(pinned.at(Depth.Cave))).toBe(cave);
    }
  });

  it('holds a species its own biome spawns there, at any stage, never a legend', () => {
    let staged = 0;
    let young = 0;

    for (const [chunk, cell] of [...sites, ...caves]) {
      for (let window = 0; window < 3; window++) {
        const snapshot = new ChunkSnapshot(chunk, window * RAID_INTERVAL);
        const roll = snapshot.getTeraRaids().get(cell);

        expect(getRaidKindAt(snapshot, cell)).toBe(RaidKind.Tera);
        if (roll == null) {
          continue;
        }
        staged++;
        expect(roll.lair).toBeNull();
        expect(isLegendarySpecies(roll.species)).toBe(false);
        expect(isMythicalSpecies(roll.species)).toBe(false);
        expect(fitsSurface(roll.species, chunk.getCellSurface(cell))).toBe(true);
        if (!isFullyEvolved(roll.species)) {
          young++;
        }
      }
    }
    expect(staged).toBeGreaterThan(0);
    expect(young).toBeGreaterThan(0);
  });

  it('stages the same boss all window', () => {
    for (const [chunk, cell] of sites.slice(0, 8)) {
      const roll = new ChunkSnapshot(chunk, 0).getTeraRaids().get(cell);

      expect(new ChunkSnapshot(chunk, RAID_INTERVAL - 60_000).getTeraRaids().get(cell)).toEqual(
        roll,
      );
    }
  });

  it('names the raid after its boss', () => {
    expect(
      getRaidTitle({
        kind: RaidKind.Tera,
        lair: null,
        biome: Biome.Woodland,
        species: Species.Pikachu,
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
    ).toBe('Tera Raid Pikachu');
  });
});
