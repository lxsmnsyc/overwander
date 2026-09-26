import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import { isOpenSea, isWaterBiome } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import { PLACEMENT_AREA, centeredCells, landmarkFloats } from '../../../src/overworld/chunk';
import Landmark from '../../../src/data/overworld/landmark';
import World, { Depth, Generation } from '../../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('placement invariants', () => {
  it('stands a wetland happening on a bank, where a grotto can be', () => {
    const world = new World('overworld');
    let phenomena = 0;
    let banked = 0;

    for (let x = -200; x < 200; x += 4) {
      for (let y = -200; y < 200 && phenomena < 12; y += 4) {
        const chunk = world.getChunk(x, y);

        if (!isWaterBiome(chunk.biome) || isOpenSea(chunk.biome)) {
          continue;
        }

        const banks = chunk.getSpotCells();

        // Only where the marsh has a bank to stand on: the banks are
        // the world's own dry ground now, and a chunk the water covers
        // outright has none
        if (banks.size === 0) {
          continue;
        }
        // The banks a phenomenon could actually be put on: a bank
        // under a tree, inside the town or outside the area things are
        // placed in is a bank nothing may stand on
        const occupied = new Set([
          ...chunk.getDecorationCells().keys(),
          ...chunk.getLandmarkCells().keys(),
          ...chunk.getRockCells(),
          ...chunk.getFaceCells(),
          ...chunk.getLavaCells(),
        ]);
        let free = 0;

        for (const spot of centeredCells(PLACEMENT_AREA)) {
          if (banks.has(spot) && !occupied.has(spot) && !chunk.isTownCell(spot)) {
            free += 1;
          }
        }
        if (free === 0) {
          continue;
        }
        for (const cell of new ChunkSnapshot(chunk, 0).getPhenomena().keys()) {
          phenomena += 1;
          banked += banks.has(cell) ? 1 : 0;
        }
      }
    }
    // A marsh that only ever rippled would be a marsh that never hid
    // a grotto, so dry ground is taken first wherever a bank is free
    expect(phenomena).toBeGreaterThan(0);
    expect(banked).toBe(phenomena);
  });

  it('puts nobody who needs ground on a lake', () => {
    const world = new World('overworld');
    let afloat = 0;

    for (let x = -120; x < 120; x += 8) {
      for (let y = -120; y < 120; y += 8) {
        const chunk = world.getChunk(x, y);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          if (chunk.getCellRole(cell) !== 'water') {
            continue;
          }
          afloat += 1;
          // A lake in a field is as wet as the ocean, so the rule is
          // read off the cell's own country rather than the chunk's
          expect(
            landmarkFloats(landmark, chunk.getCellBiomes()[cell]),
            `${x},${y} cell ${cell} holds ${landmark}`,
          ).toBe(true);
        }
      }
    }
    // A cache and a nest are still carried on the water, so the sweep
    // is checking something
    expect(afloat).toBeGreaterThan(0);
  });

  it('leaves a flooded field its landmarks, and nobody standing on them', () => {
    // A steppe almost entirely under one lake: 250 of its 256 cells
    // are water, and the dry handful is spoken for, which used to put
    // a Bird Keeper out on the water
    const world = new World('lxsmnsyc', Depth.Surface, Generation.Second);
    const chunk = world.getChunk(-45, 82);
    let wet = 0;

    for (const [cell, landmark] of chunk.getLandmarkCells()) {
      if (chunk.getCellRole(cell) !== 'water') {
        continue;
      }
      wet += 1;
      expect(landmark).not.toBe(Landmark.Trainer);
    }
    expect(chunk.getLandmarkCells().size).toBeGreaterThan(0);
    expect(wet).toBeGreaterThan(0);
  });
});
