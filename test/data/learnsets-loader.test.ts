import { describe, expect, it } from 'vitest';
import ensureLearnSets, { isLearnSetsReady } from '../../src/data/learnset-data';
import { Species } from '../../src/data/ids/species';
import registerWorldData from '../../src/data/world';
import {
  getEggMoves,
  getLearnableMoves,
  getLevelUpMoves,
  getMovesLearnedAt,
  getRegisteredSpecies,
  getSpeciesData,
  getTeachableMoves,
} from '../../src/data/species';
import { readLearnSets } from '../../src/data/species/yaml';
import { deriveShiny } from '../../src/overworld/encounter';
import ChunkSnapshot, { SPAWN_COUNT } from '../../src/overworld/chunk-snapshot';
import World from '../../src/overworld/world';

/**
 * The learn sets load apart from the species: the world is drawn
 * without them, and a read before they arrive says what to wait for
 */
const files = import.meta.glob('../../src/data/species/learnsets/**/*.yaml', {
  eager: true,
  import: 'default',
});

// What the app registers at boot, and all it registers before the first frame
registerWorldData();

describe('learn sets on their own loader', () => {
  it('registers the world without them', () => {
    expect(isLearnSetsReady()).toBe(false);
    expect(getRegisteredSpecies().length).toBeGreaterThan(1000);
  });

  it('draws the board without reading one', () => {
    const world = new World('overworld');
    let spawned = 0;

    for (let x = 0; x < 6; x++) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, 0), 0);

      // What the board does with a chunk: stage its spawns and read each one's shininess
      for (const spawn of snapshot.getSpawns(SPAWN_COUNT)) {
        deriveShiny(spawn[0], spawn[1], snapshot.timestamp, 'player', {});
        spawned++;
      }
    }
    expect(spawned).toBeGreaterThan(0);
    expect(isLearnSetsReady()).toBe(false);
  });

  it('refuses a read before the load and names what to wait for', () => {
    expect(() => getLevelUpMoves(Species.Bulbasaur, 100)).toThrow(/ensureLearnSets/);
    expect(() => getSpeciesData(Species.Bulbasaur).learnSet).toThrow(/ensureLearnSets/);
    expect(() => getTeachableMoves(Species.Charizard)).toThrow(/ensureLearnSets/);
  });

  it('answers the same lists as the files give once loaded', async () => {
    await ensureLearnSets();
    // A second ask shares the first
    await ensureLearnSets();
    expect(isLearnSetsReady()).toBe(true);

    const expected = readLearnSets(files);

    // A line's base, an evolution, a regional form and a legendary
    for (const species of [
      Species.Bulbasaur,
      Species.Charizard,
      Species.Raichu,
      Species.RaichuAlola,
      Species.Mewtwo,
    ]) {
      const set = expected.get(species);

      expect(set).toBeDefined();
      expect(getSpeciesData(species).learnSet).toEqual(set);
      expect(getTeachableMoves(species)).toEqual(set?.teachable);
      expect(getEggMoves(species)).toEqual(set?.egg ?? []);
      expect(getMovesLearnedAt(species, 1)).toEqual(set?.level[1] ?? []);
      expect(getLearnableMoves(species).length).toBeGreaterThan(0);
    }
    expect(getLevelUpMoves(Species.Bulbasaur, 100).length).toBeGreaterThan(0);
  });

  it('gives every species a set, a worn shape reading its pokemon', () => {
    for (const species of getRegisteredSpecies()) {
      expect(getSpeciesData(species).learnSet.teachable).toBeDefined();
    }
    expect(getSpeciesData(Species.CharizardMegaX).learnSet).toBe(
      getSpeciesData(Species.Charizard).learnSet,
    );
  });
});
