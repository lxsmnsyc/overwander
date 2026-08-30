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
  Moves.Headbutt,
  Moves.Swift,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.RockSmash,
];

export default function registerTyrogueSpecies(): void {
  registerSpecies(Species.Hitmonlee, {
    dexNumber: 106,
    name: 'Hitmonlee',
    category: 'Kicking Pokemon',
    height: 1.5,
    weight: 49.8,
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
    abilities: [Abilities.Limber, Abilities.Reckless],
    hiddenAbilities: [Abilities.Unburden],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.DoubleKick, Moves.Meditate],
        11: [Moves.RollingKick],
        16: [Moves.JumpKick],
        21: [Moves.FocusEnergy],
        26: [Moves.HiJumpKick],
        31: [Moves.MindReader],
        36: [Moves.Foresight],
        41: [Moves.Endure],
        46: [Moves.MegaKick],
        51: [Moves.Reversal],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Hitmonchan, {
    dexNumber: 107,
    name: 'Hitmonchan',
    category: 'Punching Pokemon',
    height: 1.4,
    weight: 50.2,
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
    abilities: [Abilities.KeenEye, Abilities.IronFist],
    hiddenAbilities: [Abilities.InnerFocus],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.CometPunch, Moves.Agility],
        13: [Moves.Pursuit],
        26: [Moves.FirePunch, Moves.IcePunch, Moves.ThunderPunch],
        32: [Moves.MachPunch],
        38: [Moves.MegaPunch],
        44: [Moves.Detect],
        50: [Moves.Counter],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.FirePunch, Moves.IcePunch, Moves.ThunderPunch],
    },
  });
}
