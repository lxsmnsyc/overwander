import { describe, expect, it } from 'vitest';
import Abilities from '../src/data/ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay, getBiome } from '../src/data/ids/biome';
import { Items } from '../src/data/ids/items';
import { EvolutionMethod, Species } from '../src/data/ids/species';
import registerItems from '../src/data/items';
import registerGen1Moves from '../src/data/moves/gen-1';
import { getSpeciesAbilities, getSpeciesData, registerSpecies } from '../src/data/species';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerGen1Moves();
registerSpecies();
registerItems();

describe('species abilities', () => {
  it('evolved species learn their pre-evolutions abilities', () => {
    // Vileplume's own set plus Gloom's Stench and Oddish's Run Away
    const vileplume = getSpeciesAbilities(Species.Vileplume);

    expect(vileplume.has(Abilities.EffectSpore)).toBe(true);
    expect(vileplume.has(Abilities.Chlorophyll)).toBe(true);
    expect(vileplume.has(Abilities.Stench)).toBe(true);
    expect(vileplume.has(Abilities.RunAway)).toBe(true);

    // Base species only know their own set
    const oddish = getSpeciesAbilities(Species.Oddish);

    expect(oddish.has(Abilities.Stench)).toBe(false);
    expect(oddish.size).toBe(2);
  });
});

describe('evolution data', () => {
  it('describes level, stone and trade evolutions', () => {
    expect(getSpeciesData(Species.Bulbasaur).evolvesInto).toEqual([
      { species: Species.Ivysaur, method: EvolutionMethod.Level, level: 16 },
    ]);

    expect(getSpeciesData(Species.Eevee).evolvesInto).toHaveLength(3);
    expect(getSpeciesData(Species.Eevee).evolvesInto?.[0]).toEqual({
      species: Species.Vaporeon,
      method: EvolutionMethod.UsedItem,
      item: Items.WaterStone,
    });

    expect(getSpeciesData(Species.Haunter).evolvesInto).toEqual([
      { species: Species.Gengar, method: EvolutionMethod.Trade },
    ]);

    // Final stages have none
    expect(getSpeciesData(Species.Venusaur).evolvesInto).toBeUndefined();
  });
});

describe('biome data', () => {
  it('classifies climate samples into the nearest biome', () => {
    // Exact target points
    expect(getBiome(-0.9, 0.9, 0.2)).toBe(Biome.Desert);
    expect(getBiome(1, -0.2, -0.8)).toBe(Biome.DeepOcean);
    expect(getBiome(0.9, 0.9, 0.2)).toBe(Biome.TropicalRainforest);
    expect(getBiome(0.2, -0.9, 0.9)).toBe(Biome.Glacier);

    // Off-target samples resolve to the nearest neighbor
    expect(getBiome(-1, 1, 0.1)).toBe(Biome.Desert);
    expect(getBiome(0, -0.7, 0.35)).toBe(Biome.Tundra);
  });

  it('assigns habitat biomes to species', () => {
    expect(getSpeciesData(Species.Sandshrew).biomes).toEqual([Biome.Desert]);
    expect(getSpeciesData(Species.Lapras).biomes).toEqual([
      Biome.Ocean,
      Biome.DeepOcean,
      Biome.PolarOcean,
    ]);
    expect(getSpeciesData(Species.Articuno).biomes).toContain(Biome.Glacier);

    // Evolution can move a species to new waters
    expect(getSpeciesData(Species.Magikarp).biomes).toContain(Biome.Swamp);
    expect(getSpeciesData(Species.Gyarados).biomes).not.toContain(Biome.Swamp);

    // The gap-filler biomes all have residents
    expect(getSpeciesData(Species.Eevee).biomes).toContain(Biome.Woodland);
    expect(getSpeciesData(Species.Tauros).biomes).toContain(Biome.Steppe);
    expect(getSpeciesData(Species.Paras).biomes).toContain(Biome.MontaneForest);
    expect(getSpeciesData(Species.Seel).biomes).toContain(Biome.PolarOcean);
  });

  it('assigns day-cycle preferences to species', () => {
    // Nocturnal species avoid daylight entirely
    expect(getSpeciesData(Species.Zubat).activeTimes).toBe(TimeOfDay.Night);
    expect(getSpeciesData(Species.Zubat).activeTimes & TimeOfDay.Day).toBe(0);

    // Crepuscular species span evening into night
    expect(getSpeciesData(Species.Oddish).activeTimes).toBe(TimeOfDay.Evening | TimeOfDay.Night);

    // Diurnal fliers wake with the sun
    expect(getSpeciesData(Species.Pidgey).activeTimes).toBe(TimeOfDay.Morning | TimeOfDay.Day);

    // Time-agnostic species cover the full cycle
    expect(getSpeciesData(Species.Magikarp).activeTimes).toBe(AnyTimeOfDay);
  });
});
