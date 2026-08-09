import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
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
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.HornDrill,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

const FAMILY_ABILITIES = [Abilities.SwiftSwim, Abilities.ShellArmor];

export default function registerOmanyteSpecies(): void {
  registerSpecies(Species.Omanyte, {
    dexNumber: 138,
    evolvesInto: [
      {
        species: Species.Omastar,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Omanyte',
    category: 'Spiral Pokemon',
    family: Families.Omanyte,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 40,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 35,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.WeakArmor,
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Withdraw],
        34: [Moves.HornAttack],
        39: [Moves.Leer],
        46: [Moves.SpikeCannon],
        53: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Omastar, {
    dexNumber: 139,
    name: 'Omastar',
    category: 'Spiral Pokemon',
    family: Families.Omanyte,
    evolvesFrom: Species.Omanyte,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 125,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 55,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.WeakArmor,
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Withdraw, Moves.HornAttack],
        34: [Moves.HornAttack],
        39: [Moves.Leer],
        44: [Moves.SpikeCannon],
        49: [Moves.HydroPump],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.BodySlam,
        Moves.SeismicToss,
        Moves.Submission,
      ],
    },
  });
}
