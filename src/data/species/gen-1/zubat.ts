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
  Moves.MegaDrain,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
];

export default function registerZubatSpecies(): void {
  registerSpecies(Species.Zubat, {
    dexNumber: 41,
    evolvesInto: [
      {
        species: Species.Golbat,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Zubat',
    category: 'Bat Pokemon',
    height: 0.8,
    weight: 7.5,
    family: Families.Zubat,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 55,
    },
    types: [Types.Poison, Types.Flying],
    abilities: [Abilities.InnerFocus],
    hiddenAbility: Abilities.Infiltrator,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.LeechLife],
        10: [Moves.Supersonic],
        15: [Moves.Bite],
        21: [Moves.ConfuseRay],
        28: [Moves.WingAttack],
        36: [Moves.Haze],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Golbat, {
    dexNumber: 42,
    name: 'Golbat',
    category: 'Bat Pokemon',
    height: 1.6,
    weight: 55,
    family: Families.Zubat,
    evolvesFrom: Species.Zubat,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 90,
    },
    types: [Types.Poison, Types.Flying],
    abilities: [Abilities.InnerFocus],
    hiddenAbility: Abilities.Infiltrator,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Screech, Moves.LeechLife, Moves.Bite],
        10: [Moves.Supersonic],
        15: [Moves.Bite],
        21: [Moves.ConfuseRay],
        32: [Moves.WingAttack],
        43: [Moves.Haze],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
