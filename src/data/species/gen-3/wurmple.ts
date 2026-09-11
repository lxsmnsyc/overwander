import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Genders, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The caterpillar and its two cocoons learn nothing but what they
 * level into, so only the two that come out with wings have a list
 */
const WINGED_TEACHABLE = [
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.HyperBeam,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Flash,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerWurmpleSpecies(): void {
  registerSpecies(Species.Wurmple, {
    dexNumber: 265,
    // The mainline reads a hidden number nobody is shown; here the
    // split follows what it was born as, which the catch sheet says
    evolvesInto: [
      {
        species: Species.Silcoon,
        method: EvolutionMethod.Level | EvolutionMethod.Gender,
        level: 7,
        gender: Genders.Male,
      },
      {
        species: Species.Cascoon,
        method: EvolutionMethod.Level | EvolutionMethod.Gender,
        level: 7,
        gender: Genders.Female,
      },
    ],
    name: 'Wurmple',
    category: 'Worm Pokemon',
    height: 0.3,
    weight: 3.6,
    family: Families.Wurmple,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 45,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 20,
    },
    types: [Types.Bug],
    abilities: [Abilities.ShieldDust],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.StringShot],
        5: [Moves.PoisonSting],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Silcoon, {
    dexNumber: 266,
    evolvesInto: [
      {
        species: Species.Beautifly,
        method: EvolutionMethod.Level,
        level: 10,
      },
    ],
    name: 'Silcoon',
    category: 'Cocoon Pokemon',
    height: 0.6,
    weight: 10,
    family: Families.Wurmple,
    evolvesFrom: Species.Wurmple,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 35,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 15,
    },
    types: [Types.Bug],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Harden],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Beautifly, {
    dexNumber: 267,
    name: 'Beautifly',
    category: 'Butterfly Pokemon',
    height: 1,
    weight: 28.4,
    family: Families.Wurmple,
    evolvesFrom: Species.Silcoon,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 70,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Swarm],
    hiddenAbilities: [Abilities.Rivalry],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        13: [Moves.Gust],
        17: [Moves.StunSpore],
        20: [Moves.MorningSun],
        24: [Moves.MegaDrain],
        27: [Moves.Whirlwind],
        31: [Moves.Attract],
        34: [Moves.SilverWind],
        38: [Moves.GigaDrain],
      },
      teachable: [...WINGED_TEACHABLE, Moves.Safeguard],
    },
  });

  registerSpecies(Species.Cascoon, {
    dexNumber: 268,
    evolvesInto: [
      {
        species: Species.Dustox,
        method: EvolutionMethod.Level,
        level: 10,
      },
    ],
    name: 'Cascoon',
    category: 'Cocoon Pokemon',
    height: 0.7,
    weight: 11.5,
    family: Families.Wurmple,
    evolvesFrom: Species.Wurmple,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 35,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 15,
    },
    types: [Types.Bug],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Harden],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Dustox, {
    dexNumber: 269,
    name: 'Dustox',
    category: 'Poison Moth Pokemon',
    height: 1.2,
    weight: 31.6,
    family: Families.Wurmple,
    evolvesFrom: Species.Cascoon,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.ShieldDust],
    hiddenAbilities: [Abilities.CompoundEyes],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Confusion],
        13: [Moves.Gust],
        17: [Moves.Protect],
        20: [Moves.Moonlight],
        24: [Moves.Psybeam],
        27: [Moves.Whirlwind],
        31: [Moves.LightScreen],
        34: [Moves.SilverWind],
        38: [Moves.Toxic],
      },
      teachable: [...WINGED_TEACHABLE, Moves.LightScreen, Moves.SludgeBomb],
    },
  });
}
