import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Flash,
];

const FAMILY_ABILITIES = [Abilities.Analytic, Abilities.MagnetPull, Abilities.Sturdy];

export default function registerMagnemiteSpecies(): void {
  registerSpecies(Species.Magnemite, {
    dexNumber: 81,
    evolvesInto: [
      {
        species: Species.Magneton,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Magnemite',
    category: 'Magnet Pokemon',
    family: Families.Magnemite,
    stats: {
      [Stats.HP]: 25,
      [Stats.Attack]: 35,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 45,
    },
    types: [Types.Electric, Types.Steel],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        21: [Moves.SonicBoom],
        25: [Moves.ThunderShock],
        29: [Moves.Supersonic],
        35: [Moves.ThunderWave],
        41: [Moves.Swift],
        47: [Moves.Screech],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Magneton, {
    dexNumber: 82,
    name: 'Magneton',
    category: 'Magnet Pokemon',
    family: Families.Magnemite,
    evolvesFrom: Species.Magnemite,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 60,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Electric, Types.Steel],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 60,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SonicBoom, Moves.ThunderShock],
        21: [Moves.SonicBoom],
        25: [Moves.ThunderShock],
        29: [Moves.Supersonic],
        38: [Moves.ThunderWave],
        46: [Moves.Swift],
        54: [Moves.Screech],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
