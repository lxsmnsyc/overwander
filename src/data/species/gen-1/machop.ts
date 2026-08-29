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
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Metronome,
  Moves.RockSlide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Strength,
];

const FAMILY_ABILITIES = [Abilities.Guts, Abilities.NoGuard];

export default function registerMachopSpecies(): void {
  registerSpecies(Species.Machop, {
    dexNumber: 66,
    evolvesInto: [
      {
        species: Species.Machoke,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Machop',
    category: 'Superpower Pokemon',
    height: 0.8,
    weight: 19.5,
    family: Families.Machop,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 80,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 35,
    },
    types: [Types.Fighting],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Steadfast],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 180,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.KarateChop],
        20: [Moves.LowKick],
        25: [Moves.Leer],
        32: [Moves.FocusEnergy],
        39: [Moves.SeismicToss],
        46: [Moves.Submission],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.LightScreen, Moves.Meditate, Moves.RollingKick],
    },
  });

  registerSpecies(Species.Machoke, {
    dexNumber: 67,
    evolvesInto: [
      {
        species: Species.Machamp,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Machoke',
    category: 'Superpower Pokemon',
    height: 1.5,
    weight: 70.5,
    family: Families.Machop,
    evolvesFrom: Species.Machop,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 100,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 45,
    },
    types: [Types.Fighting],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Steadfast],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 90,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.KarateChop, Moves.LowKick],
        20: [Moves.LowKick],
        25: [Moves.Leer],
        36: [Moves.FocusEnergy],
        44: [Moves.SeismicToss],
        52: [Moves.Submission],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Machamp, {
    dexNumber: 68,
    name: 'Machamp',
    category: 'Superpower Pokemon',
    height: 1.6,
    weight: 130,
    family: Families.Machop,
    evolvesFrom: Species.Machoke,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 130,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 55,
    },
    types: [Types.Fighting],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Steadfast, Abilities.IronFist],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.KarateChop, Moves.LowKick],
        20: [Moves.LowKick],
        25: [Moves.Leer],
        36: [Moves.FocusEnergy],
        44: [Moves.SeismicToss],
        52: [Moves.Submission],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
