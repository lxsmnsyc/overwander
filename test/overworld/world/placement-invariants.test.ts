import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import { isOpenSea, isWaterBiome } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import World from '../../../src/overworld/world';

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
        for (const cell of new ChunkSnapshot(chunk, 0).getPhenomena().keys()) {
          phenomena += 1;
          banked += banks.has(cell) ? 1 : 0;
        }
      }
    }
    // A marsh that only ever rippled would be a marsh that never hid
    // a grotto, so dry ground is taken first where there is any
    expect(phenomena).toBeGreaterThan(0);
    expect(banked).toBe(phenomena);
  });
});
