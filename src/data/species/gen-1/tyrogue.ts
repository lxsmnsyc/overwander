import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Metronome,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Strength,
];

export default function registerTyrogueSpecies(): void {
  registerSpecies(Species.Hitmonlee, {
    dexNumber: 106,
    name: 'Hitmonlee',
    category: 'Kicking Pokemon',
    family: Families.Tyrogue,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 120,
      [Stats.Defense]: 53,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 87,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Unburden, Abilities.Limber, Abilities.Reckless],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.DoubleKick, Moves.Meditate],
        33: [Moves.RollingKick],
        38: [Moves.JumpKick],
        43: [Moves.FocusEnergy],
        48: [Moves.HiJumpKick],
        53: [Moves.MegaKick],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Hitmonchan, {
    dexNumber: 107,
    name: 'Hitmonchan',
    category: 'Punching Pokemon',
    family: Families.Tyrogue,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 105,
      [Stats.Defense]: 79,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 76,
    },
    types: [Types.Fighting],
    abilities: [Abilities.InnerFocus, Abilities.KeenEye, Abilities.IronFist],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.CometPunch, Moves.Agility],
        33: [Moves.FirePunch],
        38: [Moves.IcePunch],
        43: [Moves.ThunderPunch],
        48: [Moves.MegaPunch],
        53: [Moves.Counter],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
}
