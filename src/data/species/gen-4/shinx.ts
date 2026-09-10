import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.Captivate,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.FuryCutter,
  Moves.Headbutt,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Strength,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Swift,
  Moves.Thief,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
];

/**
 * The lion whose fur works like a circuit: the light in a Luxray's
 * eyes is the same current, and it sees through whatever it is aimed
 * at
 */
export default function registerShinxSpecies(): void {
  registerSpecies(Species.Shinx, {
    dexNumber: 403,
    evolvesInto: [
      {
        species: Species.Luxio,
        method: EvolutionMethod.Level,
        level: 15,
      },
    ],
    name: 'Shinx',
    category: 'Flash Pokemon',
    height: 0.5,
    weight: 9.5,
    family: Families.Shinx,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 65,
      [Stats.Defense]: 34,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 34,
      [Stats.Speed]: 45,
    },
    types: [Types.Electric],
    abilities: [Abilities.Rivalry, Abilities.Intimidate],
    hiddenAbilities: [Abilities.Guts],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 235,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Shrubland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        5: [Moves.Leer],
        9: [Moves.Charge],
        13: [Moves.Spark],
        17: [Moves.Bite],
        21: [Moves.Roar],
        25: [Moves.Swagger],
        29: [Moves.ThunderFang],
        33: [Moves.Crunch],
        37: [Moves.ScaryFace],
        41: [Moves.Discharge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.FireFang,
        Moves.Howl,
        Moves.IceFang,
        Moves.NightSlash,
        Moves.QuickAttack,
        Moves.TakeDown,
        Moves.ThunderFang,
      ],
    },
  });
  registerSpecies(Species.Luxio, {
    dexNumber: 404,
    evolvesInto: [
      {
        species: Species.Luxray,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Luxio',
    category: 'Spark Pokemon',
    height: 0.9,
    weight: 30.5,
    family: Families.Shinx,
    evolvesFrom: Species.Shinx,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 49,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 49,
      [Stats.Speed]: 60,
    },
    types: [Types.Electric],
    abilities: [Abilities.Rivalry, Abilities.Intimidate],
    hiddenAbilities: [Abilities.Guts],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Shrubland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Tackle],
        5: [Moves.Leer],
        9: [Moves.Charge],
        13: [Moves.Spark],
        18: [Moves.Bite],
        23: [Moves.Roar],
        28: [Moves.Swagger],
        33: [Moves.ThunderFang],
        38: [Moves.Crunch],
        43: [Moves.ScaryFace],
        48: [Moves.Discharge],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Luxray, {
    dexNumber: 405,
    name: 'Luxray',
    category: 'Gleam Eyes Pokemon',
    height: 1.4,
    weight: 42.0,
    family: Families.Shinx,
    evolvesFrom: Species.Luxio,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 120,
      [Stats.Defense]: 79,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 79,
      [Stats.Speed]: 70,
    },
    types: [Types.Electric],
    abilities: [Abilities.Rivalry, Abilities.Intimidate],
    // Strong Jaw is this registry's rather than the mainline's: the
    // line's whole finish is what it bites with
    hiddenAbilities: [Abilities.Guts, Abilities.StrongJaw],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Shrubland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Charge, Moves.Leer, Moves.Tackle],
        5: [Moves.Leer],
        9: [Moves.Charge],
        13: [Moves.Spark],
        18: [Moves.Bite],
        23: [Moves.Roar],
        28: [Moves.Swagger],
        35: [Moves.ThunderFang],
        42: [Moves.Crunch],
        49: [Moves.ScaryFace],
        56: [Moves.Discharge],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam, Moves.Superpower],
    },
  });
}
