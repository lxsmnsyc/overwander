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
  Moves.WaterPulse,
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Flamethrower,
  Moves.FireBlast,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Rollout,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

// What the two above the base pick up: a whisper has nothing to swing
// them with, and the two that shout do
const GROWN_TEACHABLE = [
  Moves.Taunt,
  Moves.BrickBreak,
  Moves.Earthquake,
  Moves.RockTomb,
  Moves.Overheat,
  Moves.Torment,
  Moves.RockSlide,
  Moves.Strength,
  Moves.RockSmash,
];

export default function registerWhismurSpecies(): void {
  registerSpecies(Species.Whismur, {
    dexNumber: 293,
    evolvesInto: [
      {
        species: Species.Loudred,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Whismur',
    category: 'Whisper Pokemon',
    height: 0.6,
    weight: 16.3,
    family: Families.Whismur,
    stats: {
      [Stats.HP]: 64,
      [Stats.Attack]: 51,
      [Stats.Defense]: 23,
      [Stats.SpecialAttack]: 51,
      [Stats.SpecialDefense]: 23,
      [Stats.Speed]: 28,
    },
    types: [Types.Normal],
    abilities: [Abilities.Soundproof],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Badlands, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound],
        5: [Moves.Uproar],
        11: [Moves.Astonish],
        15: [Moves.Howl],
        21: [Moves.Supersonic],
        25: [Moves.Stomp],
        31: [Moves.Screech],
        35: [Moves.Roar],
        41: [Moves.Rest, Moves.SleepTalk],
        45: [Moves.HyperVoice],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.TakeDown, Moves.Extrasensory, Moves.SmellingSalts],
    },
  });

  registerSpecies(Species.Loudred, {
    dexNumber: 294,
    evolvesInto: [
      {
        species: Species.Exploud,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Loudred',
    category: 'Big Voice Pokemon',
    height: 1,
    weight: 40.5,
    family: Families.Whismur,
    evolvesFrom: Species.Whismur,
    stats: {
      [Stats.HP]: 84,
      [Stats.Attack]: 71,
      [Stats.Defense]: 43,
      [Stats.SpecialAttack]: 71,
      [Stats.SpecialDefense]: 43,
      [Stats.Speed]: 48,
    },
    types: [Types.Normal],
    abilities: [Abilities.Soundproof],
    hiddenAbilities: [Abilities.Scrappy],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Badlands, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Uproar, Moves.Astonish, Moves.Howl],
        23: [Moves.Supersonic],
        29: [Moves.Stomp],
        37: [Moves.Screech],
        43: [Moves.Roar],
        51: [Moves.Rest, Moves.SleepTalk],
        57: [Moves.HyperVoice],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Exploud, {
    dexNumber: 295,
    name: 'Exploud',
    category: 'Loud Noise Pokemon',
    height: 1.5,
    weight: 84,
    family: Families.Whismur,
    evolvesFrom: Species.Loudred,
    stats: {
      [Stats.HP]: 104,
      [Stats.Attack]: 91,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 91,
      [Stats.SpecialDefense]: 73,
      [Stats.Speed]: 68,
    },
    types: [Types.Normal],
    abilities: [Abilities.Soundproof],
    // Berserk is this registry's rather than the mainline's: it gets
    // louder the worse things go, and a final evolution is filled to
    // four
    hiddenAbilities: [Abilities.Scrappy, Abilities.Berserk],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Badlands, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Uproar, Moves.Astonish, Moves.Howl],
        23: [Moves.Supersonic],
        29: [Moves.Stomp],
        37: [Moves.Screech],
        40: [Moves.HyperBeam],
        45: [Moves.Roar],
        55: [Moves.Rest, Moves.SleepTalk],
        63: [Moves.HyperVoice],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE, Moves.HyperBeam],
    },
  });
}
