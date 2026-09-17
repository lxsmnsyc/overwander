import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import Biome, { growsBerries, growsTrees } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import Landmark from '../../../src/data/overworld/landmark';
import World from '../../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('what the ground grows', () => {
  it('bears no fruit where nothing can root', () => {
    // Lava, ice and bare sand: a bush there would be a landmark the
    // player walks to and finds impossible
    for (const biome of [
      Biome.Desert,
      Biome.ColdDesert,
      Biome.Badlands,
      Biome.Volcano,
      Biome.Glacier,
      Biome.AlpineTundra,
    ]) {
      expect(growsBerries(biome)).toBe(false);
      expect(growsTrees(biome)).toBe(false);
    }
    // And nothing at all afloat
    expect(growsBerries(Biome.DeepOcean)).toBe(false);
  });

  it('fruits where a bush can stand, and grows a tree only below the line', () => {
    expect(growsBerries(Biome.Grassland)).toBe(true);
    expect(growsTrees(Biome.TemperateForest)).toBe(true);

    // The permafrost and the open steppe carry berries the way the
    // real ones do, but nothing stands tall on either
    for (const biome of [Biome.Tundra, Biome.Steppe, Biome.Mountain]) {
      expect(growsBerries(biome)).toBe(true);
      expect(growsTrees(biome)).toBe(false);
    }
  });

  it('rolls no patch or tree into a chunk that cannot grow one', () => {
    const world = new World('overworld');
    let barren = 0;
    let treeless = 0;
    let growing = 0;

    for (let x = -60; x < 60; x += 3) {
      for (let y = -60; y < 60; y += 3) {
        const chunk = world.getChunk(x, y);
        const landmarks = chunk.getLandmarks();
        const patches = landmarks.filter((kind) => kind === Landmark.BerryPatch).length;
        const trees = landmarks.filter((kind) => kind === Landmark.ApricornTree).length;

        if (!growsBerries(chunk.biome)) {
          barren += 1;
          expect(patches).toBe(0);
        }
        if (!growsTrees(chunk.biome)) {
          treeless += 1;
          expect(trees).toBe(0);
        }
        growing += growsTrees(chunk.biome) ? patches + trees : 0;
      }
    }
    // The sweep has to have crossed both kinds of dead ground, and
    // the living ground still bears
    expect(barren).toBeGreaterThan(0);
    expect(treeless).toBeGreaterThan(barren);
    expect(growing).toBeGreaterThan(0);
  });
});
