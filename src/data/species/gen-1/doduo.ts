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
  Moves.Whirlwind,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkyAttack,
  Moves.Rest,
  Moves.TriAttack,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.RunAway, Abilities.EarlyBird];

export default function registerDoduoSpecies(): void {
  registerSpecies(Species.Doduo, {
    dexNumber: 84,
    evolvesInto: [
      {
        species: Species.Dodrio,
        method: EvolutionMethod.Level,
        level: 31,
      },
    ],
    name: 'Doduo',
    category: 'Twin Bird Pokemon',
    height: 1.4,
    weight: 39.2,
    family: Families.Doduo,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 85,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 75,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.TangledFeet,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck],
        20: [Moves.Growl],
        24: [Moves.FuryAttack],
        30: [Moves.DrillPeck],
        36: [Moves.Rage],
        40: [Moves.TriAttack],
        44: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Dodrio, {
    dexNumber: 85,
    name: 'Dodrio',
    category: 'Triple Bird Pokemon',
    height: 1.8,
    weight: 85.2,
    family: Families.Doduo,
    evolvesFrom: Species.Doduo,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 110,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 110,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.TangledFeet,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl],
        20: [Moves.Growl],
        24: [Moves.FuryAttack],
        30: [Moves.DrillPeck],
        39: [Moves.Rage],
        45: [Moves.TriAttack],
        51: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
