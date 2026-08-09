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
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

const FAMILY_ABILITIES = [Abilities.SwiftSwim, Abilities.BattleArmor];

export default function registerKabutoSpecies(): void {
  registerSpecies(Species.Kabuto, {
    dexNumber: 140,
    evolvesInto: [
      {
        species: Species.Kabutops,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Kabuto',
    category: 'Shellfish Pokemon',
    family: Families.Kabuto,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 80,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 55,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.WeakArmor,
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Beach, Biome.Ocean],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden],
        34: [Moves.Absorb],
        39: [Moves.Slash],
        44: [Moves.Leer],
        49: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Kabutops, {
    dexNumber: 141,
    name: 'Kabutops',
    category: 'Shellfish Pokemon',
    family: Families.Kabuto,
    evolvesFrom: Species.Kabuto,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 115,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 80,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.WeakArmor,
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Beach, Biome.Ocean],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden, Moves.Absorb],
        34: [Moves.Absorb],
        39: [Moves.Slash],
        46: [Moves.Leer],
        53: [Moves.HydroPump],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.BodySlam,
        Moves.SeismicToss,
        Moves.Submission,
        Moves.RazorWind,
        Moves.Cut,
      ],
    },
  });
}
