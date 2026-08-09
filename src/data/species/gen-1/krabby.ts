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
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Surf,
  Moves.Strength,
];

const FAMILY_ABILITIES = [Abilities.SheerForce, Abilities.HyperCutter, Abilities.ShellArmor];

export default function registerKrabbySpecies(): void {
  registerSpecies(Species.Krabby, {
    dexNumber: 98,
    evolvesInto: [
      {
        species: Species.Kingler,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Krabby',
    category: 'River Crab Pokemon',
    family: Families.Krabby,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 105,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 50,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Beach],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Leer],
        20: [Moves.ViceGrip],
        25: [Moves.Guillotine],
        30: [Moves.Stomp],
        35: [Moves.Crabhammer],
        40: [Moves.Harden],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Kingler, {
    dexNumber: 99,
    name: 'Kingler',
    category: 'Pincer Pokemon',
    family: Families.Krabby,
    evolvesFrom: Species.Krabby,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 130,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 75,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Beach],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Leer, Moves.ViceGrip],
        20: [Moves.ViceGrip],
        25: [Moves.Guillotine],
        34: [Moves.Stomp],
        42: [Moves.Crabhammer],
        49: [Moves.Harden],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
