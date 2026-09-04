import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.SolarBeam,
  Moves.SunnyDay,
  Moves.GigaDrain,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Cut,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SweetScent,
];

const FAMILY_ABILITIES = [Abilities.Chlorophyll, Abilities.SolarPower];

export default function registerSunkernSpecies(): void {
  registerSpecies(Species.Sunkern, {
    dexNumber: 191,
    evolvesInto: [
      {
        species: Species.Sunflora,
        method: EvolutionMethod.UsedItem,
        item: Items.SunStone,
      },
    ],
    name: 'Sunkern',
    category: 'Seed Pokemon',
    height: 0.3,
    weight: 1.8,
    family: Families.Sunkern,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 30,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.EarlyBird],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 235,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        4: [Moves.Growth],
        10: [Moves.MegaDrain],
        19: [Moves.SunnyDay],
        31: [Moves.Synthesis],
        46: [Moves.GigaDrain],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Sunflora, {
    dexNumber: 192,
    name: 'Sunflora',
    category: 'Sun Pokemon',
    height: 0.8,
    weight: 8.5,
    family: Families.Sunkern,
    evolvesFrom: Species.Sunkern,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 75,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass],
    abilities: [...FAMILY_ABILITIES],
    // Flower Gift is this registry's rather than the mainline's,
    // filling a final evolution to four: it turns the sun it stands
    // in over to the rest of the team
    hiddenAbilities: [Abilities.EarlyBird, Abilities.FlowerGift],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.Pound],
        4: [Moves.Growth],
        10: [Moves.RazorLeaf],
        19: [Moves.SunnyDay],
        31: [Moves.PetalDance],
        46: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
