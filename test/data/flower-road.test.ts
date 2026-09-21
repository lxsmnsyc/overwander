import { describe, expect, it } from 'vitest';
import type Biome from '../../src/data/ids/biome';
import { TimeOfDay } from '../../src/data/ids/biome';
import registerBiomeSpawns, {
  SpawnRarity,
  getSpawnRarity,
  getTownPool,
} from '../../src/data/biome';
import {
  EvolutionMethod,
  FLABEBE_FORMS,
  FLOETTE_FORMS,
  FLORGES_FORMS,
  Genders,
  Species,
} from '../../src/data/ids/species';
import Abilities from '../../src/data/ids/abilities';
import registerAbilities from '../../src/data/abilities';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { getSpeciesData, registerSpecies } from '../../src/data/species';

registerMoves();
registerAbilities();
registerItems();
registerSpecies();
registerBiomeSpawns();

/** The five colours, stage by stage, the red one first */
const COLOURS = FLABEBE_FORMS.map((flabebe, at) => ({
  flabebe,
  floette: FLOETTE_FORMS[at],
  florges: FLORGES_FORMS[at],
}));

describe('the colour a flower is picked in', () => {
  it('keeps each colour on its own road up', () => {
    for (const colour of COLOURS) {
      const flabebe = getSpeciesData(colour.flabebe);
      const floette = getSpeciesData(colour.floette);

      expect(flabebe.evolvesInto?.map((road) => road.species)).toEqual([colour.floette]);
      expect(floette.evolvesInto?.map((road) => road.species)).toEqual([colour.florges]);
      expect(floette.evolvesFrom).toBe(colour.flabebe);
      expect(getSpeciesData(colour.florges).evolvesFrom).toBe(colour.floette);
    }
  });

  it('grows all three stages of a colour in the same countries, and nowhere twice', () => {
    const claimed = new Set<Biome>();

    for (const colour of COLOURS) {
      const biomes = getSpeciesData(colour.flabebe).biomes;

      expect(biomes.length).toBeGreaterThan(0);
      expect(getSpeciesData(colour.floette).biomes).toEqual(biomes);
      expect(getSpeciesData(colour.florges).biomes).toEqual(biomes);

      // A country grows one colour of flower, never two
      for (const biome of biomes) {
        expect(claimed.has(biome)).toBe(false);
        claimed.add(biome);
      }
    }
  });

  it('bands each stage by how far it stands up its line', () => {
    for (const colour of COLOURS) {
      expect(getSpawnRarity(colour.flabebe)).toBe(SpawnRarity.Base);
      expect(getSpawnRarity(colour.floette)).toBe(SpawnRarity.Rare);
      expect(getSpawnRarity(colour.florges)).toBe(SpawnRarity.Elusive);
    }
    expect(getSpawnRarity(Species.Skiddo)).toBe(SpawnRarity.Uncommon);
    expect(getSpawnRarity(Species.Gogoat)).toBe(SpawnRarity.Scarce);
    // Nothing to grow into, so the poodle is elusive on its own
    expect(getSpawnRarity(Species.Furfrou)).toBe(SpawnRarity.Elusive);
  });

  it('keeps the flower that never wilts off every country and off the road up', () => {
    const eternal = getSpeciesData(Species.FloetteEternal);

    expect(eternal.biomes).toEqual([]);
    expect(eternal.evolvesFrom).toBeUndefined();
    expect(eternal.evolvesInto).toBeUndefined();

    for (const colour of COLOURS) {
      const roads = getSpeciesData(colour.floette).evolvesInto ?? [];

      expect(roads.map((road) => road.species)).not.toContain(Species.FloetteEternal);
    }

    expect(getTownPool(TimeOfDay.Day).mythical?.map((entry) => entry.species)).toContain(
      Species.FloetteEternal,
    );
  });
});

describe('the two Meowstic', () => {
  it('grows each sex of Espurr into its own pokemon', () => {
    const roads = getSpeciesData(Species.Espurr).evolvesInto ?? [];

    expect(roads.map((road) => road.species)).toEqual([Species.Meowstic, Species.MeowsticFemale]);
    for (const road of roads) {
      expect(road.method & EvolutionMethod.Gender).toBeTruthy();
      expect(road.level).toBe(25);
    }
    expect(roads[0].gender).toBe(Genders.Male);
    expect(roads[1].gender).toBe(Genders.Female);
  });

  it('gives her her own abilities and leaves his with him', () => {
    const female = getSpeciesData(Species.MeowsticFemale);

    expect(female.hiddenAbilities).toContain(Abilities.Competitive);
    expect(female.hiddenAbilities).not.toContain(Abilities.Prankster);
    expect(getSpeciesData(Species.Meowstic).hiddenAbilities).toContain(Abilities.Prankster);
    // The same cat underneath: one body, one home, one dex number
    expect(female.stats).toEqual(getSpeciesData(Species.Meowstic).stats);
    expect(female.dexNumber).toBe(getSpeciesData(Species.Meowstic).dexNumber);
    expect(female.baseForm).toBe(false);
  });

  it('shares the wood with him rather than crowding it', () => {
    const female = getSpeciesData(Species.MeowsticFemale);

    expect(female.biomes).toEqual(getSpeciesData(Species.Meowstic).biomes);
    expect(getSpawnRarity(Species.MeowsticFemale)).toBe(SpawnRarity.Scarce);
  });
});
