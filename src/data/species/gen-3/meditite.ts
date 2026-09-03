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
  Moves.FocusPunch,
  Moves.CalmMind,
  Moves.Toxic,
  Moves.BulkUp,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Flash,
  Moves.Strength,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.Metronome,
  Moves.DreamEater,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerMedititeSpecies(): void {
  registerSpecies(Species.Meditite, {
    dexNumber: 307,
    evolvesInto: [
      {
        species: Species.Medicham,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Meditite',
    category: 'Meditate Pokemon',
    height: 0.6,
    weight: 11.2,
    family: Families.Meditite,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 40,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 60,
    },
    types: [Types.Fighting, Types.Psychic],
    abilities: [Abilities.PurePower],
    hiddenAbilities: [Abilities.Telepathy],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 180,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bide],
        4: [Moves.Meditate],
        9: [Moves.Confusion],
        12: [Moves.Detect],
        18: [Moves.HiddenPower],
        22: [Moves.MindReader],
        28: [Moves.CalmMind],
        32: [Moves.HiJumpKick],
        38: [Moves.PsychUp],
        42: [Moves.Reversal],
        48: [Moves.Recover],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Foresight, Moves.FakeOut, Moves.BatonPass],
    },
  });

  registerSpecies(Species.Medicham, {
    dexNumber: 308,
    name: 'Medicham',
    category: 'Meditate Pokemon',
    height: 1.3,
    weight: 31.5,
    family: Families.Meditite,
    evolvesFrom: Species.Meditite,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 80,
    },
    types: [Types.Fighting, Types.Psychic],
    abilities: [Abilities.PurePower],
    // Inner Focus and Levitate are this registry's rather than the
    // mainline's: it meditates through anything, and off the floor
    // while it does, and a final evolution is filled to four
    hiddenAbilities: [Abilities.Telepathy, Abilities.InnerFocus, Abilities.Levitate],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Bide,
          Moves.Meditate,
          Moves.Confusion,
          Moves.Detect,
          Moves.FirePunch,
          Moves.IcePunch,
          Moves.ThunderPunch,
        ],
        18: [Moves.HiddenPower],
        22: [Moves.MindReader],
        28: [Moves.CalmMind],
        32: [Moves.HiJumpKick],
        40: [Moves.PsychUp],
        46: [Moves.Reversal],
        54: [Moves.Recover],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.RockSlide],
    },
  });
}
