import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
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
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.Headbutt,
  Moves.FireBlast,
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
  Moves.Flamethrower,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.RockTomb,
  Moves.SecretPower,
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
        1: [Moves.KarateChop, Moves.LowKick, Moves.Leer],
        7: [Moves.FocusEnergy],
        19: [Moves.SeismicToss],
        25: [Moves.Foresight, Moves.Revenge],
        31: [Moves.VitalThrow],
        37: [Moves.CrossChop],
        43: [Moves.ScaryFace],
        46: [Moves.Submission],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.LightScreen,
        Moves.Meditate,
        Moves.RollingKick,
        Moves.Encore,
        Moves.SmellingSalts,
      ],
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
        1: [Moves.KarateChop, Moves.LowKick, Moves.Leer, Moves.FocusEnergy],
        19: [Moves.SeismicToss],
        25: [Moves.Foresight, Moves.Revenge],
        34: [Moves.VitalThrow],
        43: [Moves.CrossChop],
        52: [Moves.Submission, Moves.ScaryFace],
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
        1: [Moves.KarateChop, Moves.LowKick, Moves.Leer, Moves.FocusEnergy],
        19: [Moves.SeismicToss],
        25: [Moves.Foresight, Moves.Revenge],
        34: [Moves.VitalThrow],
        43: [Moves.CrossChop],
        52: [Moves.Submission, Moves.ScaryFace],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
