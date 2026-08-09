import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Strength,
];

export default function registerEkansSpecies(): void {
  registerSpecies(Species.Ekans, {
    dexNumber: 23,
    evolvesInto: [
      {
        species: Species.Arbok,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Ekans',
    category: 'Snake Pokemon',
    family: Families.Ekans,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 60,
      [Stats.Defense]: 44,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 54,
      [Stats.Speed]: 55,
    },
    types: [Types.Poison],
    abilities: [Abilities.Unnerve, Abilities.Intimidate, Abilities.ShedSkin],
    eggGroups: [EggGroups.Field, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer],
        10: [Moves.PoisonSting],
        17: [Moves.Bite],
        24: [Moves.Glare],
        31: [Moves.Screech],
        38: [Moves.Acid],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Arbok, {
    dexNumber: 24,
    name: 'Arbok',
    category: 'Cobra Pokemon',
    family: Families.Ekans,
    evolvesFrom: Species.Ekans,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 95,
      [Stats.Defense]: 69,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 79,
      [Stats.Speed]: 80,
    },
    types: [Types.Poison],
    abilities: [Abilities.Unnerve, Abilities.Intimidate, Abilities.ShedSkin],
    eggGroups: [EggGroups.Field, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer, Moves.PoisonSting],
        10: [Moves.PoisonSting],
        17: [Moves.Bite],
        27: [Moves.Glare],
        36: [Moves.Screech],
        47: [Moves.Acid],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
