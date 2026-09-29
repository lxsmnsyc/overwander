import { describe, expect, it } from 'vitest';
import registerAbilities, { getSpeciesSignature } from '../../src/data/abilities';
import { BASE_FRIENDSHIP } from '../../src/data/constants/friendship';
import { Stats } from '../../src/data/constants/stats';
import Abilities from '../../src/data/ids/abilities';
import { TimeOfDay } from '../../src/data/ids/biome';
import { Items } from '../../src/data/ids/items';
import type { Moves } from '../../src/data/ids/moves';
import Regions from '../../src/data/ids/regions';
import { ALOLAN_FORMS, Genders, Species } from '../../src/data/ids/species';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import {
  type EvolutionContext,
  getAvailableEvolutions,
  getSpeciesData,
  getSpeciesRegion,
  isBaseForm,
  registerSpecies,
} from '../../src/data/species';

registerMoves();
registerAbilities();
registerSpecies();
registerItems();

const EVEN_STATS: Record<Stats, number> = {
  [Stats.HP]: 100,
  [Stats.Attack]: 100,
  [Stats.Defense]: 100,
  [Stats.SpecialAttack]: 100,
  [Stats.SpecialDefense]: 100,
  [Stats.Speed]: 100,
};

function context(
  species: Species,
  level: number,
  time: TimeOfDay,
  carried: Items[] = [],
): EvolutionContext {
  return {
    species,
    level,
    carried: new Set(carried),
    held: new Set<Items>(),
    canEvolve: false,
    stats: EVEN_STATS,
    friendship: BASE_FRIENDSHIP,
    gender: Genders.Male,
    time,
    moves: new Set<Moves>(),
  };
}

function targets(roads: { species: Species }[]): Species[] {
  const species: Species[] = [];

  for (const road of roads) {
    species.push(road.species);
  }
  return species;
}

describe('the Alolan forms', () => {
  it('are variants of their Kanto species, filed under Alola and fed the same candy', () => {
    for (const form of ALOLAN_FORMS) {
      expect(isBaseForm(form)).toBe(false);
      expect(getSpeciesRegion(form)).toBe(Regions.Alola);
    }
    expect(getSpeciesRegion(Species.Rattata)).toBe(Regions.Kanto);
    expect(getSpeciesData(Species.VulpixAlola).family).toBe(getSpeciesData(Species.Vulpix).family);
  });

  it('carries a line of its own signature only where every stage is regional', () => {
    expect(getSpeciesSignature(Species.RattataAlola)).toBe(Abilities.RichDiet);
    expect(getSpeciesSignature(Species.RaticateAlola)).toBe(Abilities.RichDiet);
    expect(getSpeciesSignature(Species.Rattata)).toBe(Abilities.Nibble);
    // Pichu and Pikachu have no Alolan form, so the family's stands
    expect(getSpeciesSignature(Species.RaichuAlola)).toBe(getSpeciesSignature(Species.Raichu));
  });

  it('offers a Pikachu both Raichu for the same stone', () => {
    const pikachu = context(Species.Pikachu, 10, TimeOfDay.Day, [Items.ThunderStone]);

    expect(targets(getAvailableEvolutions(pikachu))).toEqual([Species.Raichu, Species.RaichuAlola]);
  });

  it('grows an Alolan Rattata only at night', () => {
    expect(getAvailableEvolutions(context(Species.RattataAlola, 20, TimeOfDay.Day))).toEqual([]);
    expect(
      targets(getAvailableEvolutions(context(Species.RattataAlola, 20, TimeOfDay.Night))),
    ).toEqual([Species.RaticateAlola]);
  });

  it('offers an Exeggcute both Exeggutor for the same stone', () => {
    const exeggcute = context(Species.Exeggcute, 10, TimeOfDay.Day, [Items.LeafStone]);

    expect(targets(getAvailableEvolutions(exeggcute))).toEqual([
      Species.Exeggutor,
      Species.ExeggutorAlola,
    ]);
  });

  it('grows a Cubone into a Kanto Marowak by day and an Alolan one by night', () => {
    expect(targets(getAvailableEvolutions(context(Species.Cubone, 28, TimeOfDay.Day)))).toEqual([
      Species.Marowak,
    ]);
    expect(targets(getAvailableEvolutions(context(Species.Cubone, 28, TimeOfDay.Night)))).toEqual([
      Species.MarowakAlola,
    ]);
  });

  it('gives the fully regional Geodude and Grimer lines their own signatures', () => {
    expect(getSpeciesSignature(Species.GolemAlola)).toBe(Abilities.MagnetFloat);
    expect(getSpeciesSignature(Species.MukAlola)).toBe(Abilities.CrystalToxin);
    expect(getSpeciesSignature(Species.ExeggutorAlola)).toBe(
      getSpeciesSignature(Species.Exeggcute),
    );
    expect(getSpeciesSignature(Species.MarowakAlola)).toBe(getSpeciesSignature(Species.Cubone));
  });
});
