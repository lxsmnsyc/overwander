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
  Moves.RazorWind,
  Moves.Whirlwind,
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkyAttack,
  Moves.Rest,
  Moves.Substitute,
  Moves.Fly,
];

export default function registerPidgeySpecies(): void {
  registerSpecies(Species.Pidgey, {
    dexNumber: 16,
    evolvesInto: [
      {
        species: Species.Pidgeotto,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Pidgey',
    category: 'Tiny Bird Pokemon',
    family: Families.Pidgey,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 56,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.KeenEye, Abilities.TangledFeet],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Gust],
        5: [Moves.SandAttack],
        12: [Moves.QuickAttack],
        19: [Moves.Whirlwind],
        28: [Moves.WingAttack],
        36: [Moves.Agility],
        44: [Moves.MirrorMove],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Pidgeotto, {
    dexNumber: 17,
    evolvesInto: [
      {
        species: Species.Pidgeot,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Pidgeotto',
    category: 'Bird Pokemon',
    family: Families.Pidgey,
    evolvesFrom: Species.Pidgey,
    stats: {
      [Stats.HP]: 63,
      [Stats.Attack]: 60,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 71,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.KeenEye, Abilities.TangledFeet],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Gust, Moves.SandAttack],
        5: [Moves.SandAttack],
        12: [Moves.QuickAttack],
        21: [Moves.Whirlwind],
        31: [Moves.WingAttack],
        40: [Moves.Agility],
        49: [Moves.MirrorMove],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Pidgeot, {
    dexNumber: 18,
    name: 'Pidgeot',
    category: 'Bird Pokemon',
    family: Families.Pidgey,
    evolvesFrom: Species.Pidgeotto,
    stats: {
      [Stats.HP]: 83,
      [Stats.Attack]: 80,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 101,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.KeenEye, Abilities.TangledFeet],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Gust, Moves.SandAttack, Moves.QuickAttack],
        5: [Moves.SandAttack],
        12: [Moves.QuickAttack],
        21: [Moves.Whirlwind],
        31: [Moves.WingAttack],
        44: [Moves.Agility],
        54: [Moves.MirrorMove],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
