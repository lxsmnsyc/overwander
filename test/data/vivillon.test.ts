import { describe, expect, it } from 'vitest';
import Biome, { TimeOfDay } from '../../src/data/ids/biome';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SpawnRarity,
  getSpawnRarity,
  getTownPool,
} from '../../src/data/biome';
import { Species, VIVILLON_FORMS } from '../../src/data/ids/species';
import registerAbilities from '../../src/data/abilities';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { getSpeciesData, getWingPattern, registerSpecies } from '../../src/data/species';

registerMoves();
registerAbilities();
registerItems();
registerSpecies();
registerBiomeSpawns();

/** Every country there is, to read what wings it grows */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const EVERY_BIOME = Object.keys(BIOME_NAMES).map(Number) as Biome[];

describe('the wings a country hands a Vivillon', () => {
  it('gives each country its own pattern, and the meadow to the rest', () => {
    expect(getWingPattern(Species.Vivillon, Biome.Desert)).toBe(Species.VivillonSandstorm);
    expect(getWingPattern(Species.Vivillon, Biome.CoralReef)).toBe(Species.VivillonMarine);
    expect(getWingPattern(Species.Vivillon, Biome.Beach)).toBe(Species.VivillonArchipelago);
    expect(getWingPattern(Species.Vivillon, Biome.Ocean)).toBe(Species.VivillonOcean);
    // A country with no pattern of its own leaves the base form
    expect(getWingPattern(Species.Vivillon, Biome.Swamp)).toBe(Species.Vivillon);
  });

  it('leaves anything that is not a Vivillon alone', () => {
    expect(getWingPattern(Species.Spewpa, Biome.Desert)).toBe(Species.Spewpa);
    expect(getWingPattern(Species.Butterfree, Biome.Desert)).toBe(Species.Butterfree);
  });

  it('keeps the two a town hands over off every country and off the road up', () => {
    const streets = getTownPool(TimeOfDay.Day);

    // Met on a street or not at all: no country grows either pattern,
    // and a Spewpa never comes out as one
    for (const species of [Species.VivillonFancy, Species.VivillonPokeBall]) {
      expect(getSpeciesData(species).biomes).toEqual([]);
      expect(getSpeciesData(species).evolvesFrom).toBeUndefined();

      for (const pattern of EVERY_BIOME) {
        expect(getWingPattern(Species.Vivillon, pattern)).not.toBe(species);
      }
    }

    expect(streets.prized?.map((entry) => entry.species)).toContain(Species.VivillonFancy);
    expect(streets.mythical?.map((entry) => entry.species)).toContain(Species.VivillonPokeBall);
    // The fancy one is staged above the band its line would earn
    expect(getSpawnRarity(Species.VivillonFancy)).toBe(SpawnRarity.Prized);
  });

  it('draws every pattern as the same butterfly under different wings', () => {
    const base = getSpeciesData(Species.Vivillon);

    for (const species of VIVILLON_FORMS.slice(1, -2)) {
      const form = getSpeciesData(species);

      expect(form.dexNumber).toBe(base.dexNumber);
      expect(form.family).toBe(base.family);
      expect(form.stats).toEqual(base.stats);
      expect(form.types).toEqual(base.types);
      expect(form.baseForm).toBe(false);
      // Each one belongs to the single country that hands it over
      expect(form.biomes).toHaveLength(1);
      expect(getWingPattern(Species.Vivillon, form.biomes[0])).toBe(species);
    }
  });
});
