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
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Metronome,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Flash,
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.Headbutt,
  Moves.DreamEater,
  Moves.Nightmare,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.ZapCannon,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
  Moves.PsychUp,
  Moves.ShadowBall,
  Moves.BrickBreak,
  Moves.CalmMind,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SkillSwap,
  Moves.Snatch,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
];

const FAMILY_ABILITIES = [Abilities.Insomnia, Abilities.Forewarn];

export default function registerDrowzeeSpecies(): void {
  registerSpecies(Species.Drowzee, {
    dexNumber: 96,
    evolvesInto: [
      {
        species: Species.Hypno,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Drowzee',
    category: 'Hypnosis Pokemon',
    height: 1,
    weight: 32.4,
    family: Families.Drowzee,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 48,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 43,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 42,
    },
    types: [Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.InnerFocus],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Hypnosis],
        10: [Moves.Disable],
        17: [Moves.Confusion],
        24: [Moves.Headbutt],
        29: [Moves.PoisonGas],
        32: [Moves.Psychic],
        36: [Moves.Meditate],
        43: [Moves.PsychUp],
        45: [Moves.FutureSight],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Barrier, Moves.LightScreen, Moves.Assist, Moves.RolePlay],
    },
  });

  registerSpecies(Species.Hypno, {
    dexNumber: 97,
    name: 'Hypno',
    category: 'Hypnosis Pokemon',
    height: 1.6,
    weight: 75.6,
    family: Families.Drowzee,
    evolvesFrom: Species.Drowzee,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 73,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 73,
      [Stats.SpecialDefense]: 115,
      [Stats.Speed]: 67,
    },
    types: [Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.InnerFocus, Abilities.BadDreams],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Hypnosis, Moves.Disable, Moves.Confusion],
        24: [Moves.Headbutt],
        33: [Moves.PoisonGas],
        37: [Moves.Psychic],
        40: [Moves.Meditate],
        55: [Moves.PsychUp],
        60: [Moves.FutureSight],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.LightScreen],
    },
  });
}
