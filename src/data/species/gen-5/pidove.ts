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
  Moves.AerialAce,
  Moves.Attract,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Facade,
  Moves.Fly,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.Pluck,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roost,
  Moves.Round,
  Moves.SkyAttack,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Tailwind,
  Moves.Taunt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WorkUp,
];

/**
 * The pigeons: a Pidove is underfoot in every town, and an Unfezant
 * wears the crest of a bird that has decided it is better than you
 */
export default function registerPidoveSpecies(): void {
  registerSpecies(Species.Pidove, {
    dexNumber: 519,
    evolvesInto: [
      {
        species: Species.Tranquill,
        method: EvolutionMethod.Level,
        level: 21,
      },
    ],
    name: 'Pidove',
    category: 'Tiny Pigeon Pokemon',
    height: 0.3,
    weight: 2.1,
    family: Families.Pidove,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 55,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 36,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 43,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.SuperLuck],
    hiddenAbilities: [Abilities.Rivalry],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Gust],
        4: [Moves.Growl],
        8: [Moves.Leer],
        11: [Moves.QuickAttack],
        15: [Moves.AirCutter],
        18: [Moves.Roost],
        22: [Moves.Detect],
        25: [Moves.Taunt],
        29: [Moves.AirSlash],
        32: [Moves.RazorWind],
        36: [Moves.FeatherDance],
        39: [Moves.Swagger],
        43: [Moves.Facade],
        46: [Moves.Tailwind],
        50: [Moves.SkyAttack],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Bestow,
        Moves.Hypnosis,
        Moves.LuckyChant,
        Moves.MorningSun,
        Moves.SteelWing,
        Moves.Wish,
      ],
    },
  });
  registerSpecies(Species.Tranquill, {
    dexNumber: 520,
    evolvesInto: [
      {
        species: Species.Unfezant,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Tranquill',
    category: 'Wild Pigeon Pokemon',
    height: 0.6,
    weight: 15,
    family: Families.Pidove,
    evolvesFrom: Species.Pidove,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 77,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 42,
      [Stats.Speed]: 65,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.SuperLuck],
    hiddenAbilities: [Abilities.Rivalry],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Gust, Moves.Leer, Moves.QuickAttack],
        15: [Moves.AirCutter],
        18: [Moves.Roost],
        23: [Moves.Detect],
        27: [Moves.Taunt],
        32: [Moves.AirSlash],
        36: [Moves.RazorWind],
        41: [Moves.FeatherDance],
        45: [Moves.Swagger],
        50: [Moves.Facade],
        54: [Moves.Tailwind],
        59: [Moves.SkyAttack],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Unfezant, {
    dexNumber: 521,
    name: 'Unfezant',
    category: 'Proud Pokemon',
    height: 1.2,
    weight: 29,
    family: Families.Pidove,
    evolvesFrom: Species.Tranquill,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 115,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 93,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.SuperLuck],
    // Defiant is the invented fourth: the line reaches three, and a
    // bird this proud answers being belittled
    hiddenAbilities: [Abilities.Rivalry, Abilities.Defiant],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Gust, Moves.Leer, Moves.QuickAttack],
        15: [Moves.AirCutter],
        18: [Moves.Roost],
        23: [Moves.Detect],
        27: [Moves.Taunt],
        33: [Moves.AirSlash],
        38: [Moves.RazorWind],
        44: [Moves.FeatherDance],
        49: [Moves.Swagger],
        55: [Moves.Facade],
        60: [Moves.Tailwind],
        66: [Moves.SkyAttack],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam, Moves.PsychUp],
    },
  });
}
