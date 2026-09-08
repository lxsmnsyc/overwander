import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Earthquake,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Sandstorm,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Waterfall,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerBarboachSpecies(): void {
  registerSpecies(Species.Barboach, {
    dexNumber: 339,
    evolvesInto: [
      {
        species: Species.Whiscash,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Barboach',
    category: 'Whiskers Pokemon',
    height: 0.4,
    weight: 1.9,
    family: Families.Barboach,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 48,
      [Stats.Defense]: 43,
      [Stats.SpecialAttack]: 46,
      [Stats.SpecialDefense]: 41,
      [Stats.Speed]: 60,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.Oblivious, Abilities.Anticipation],
    hiddenAbilities: [Abilities.Hydration],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudSlap],
        6: [Moves.MudSport, Moves.WaterSport],
        11: [Moves.WaterGun],
        16: [Moves.Magnitude],
        21: [Moves.Amnesia],
        26: [Moves.Rest, Moves.Snore],
        31: [Moves.Earthquake],
        36: [Moves.FutureSight],
        41: [Moves.Fissure],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Spark, Moves.Thrash, Moves.Whirlpool],
    },
  });

  registerSpecies(Species.Whiscash, {
    dexNumber: 340,
    name: 'Whiscash',
    category: 'Whiskers Pokemon',
    height: 0.9,
    weight: 23.6,
    family: Families.Barboach,
    evolvesFrom: Species.Barboach,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 78,
      [Stats.Defense]: 73,
      [Stats.SpecialAttack]: 76,
      [Stats.SpecialDefense]: 71,
      [Stats.Speed]: 60,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.Oblivious, Abilities.Anticipation],
    // One the mainline never gave it: something that sits out an
    // earthquake under the mud is not taken down in one blow
    hiddenAbilities: [Abilities.Hydration, Abilities.Sturdy],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudSlap, Moves.MudSport, Moves.WaterSport, Moves.Tickle],
        11: [Moves.WaterGun],
        16: [Moves.Magnitude],
        21: [Moves.Amnesia],
        26: [Moves.Rest, Moves.Snore],
        36: [Moves.Earthquake],
        46: [Moves.FutureSight],
        56: [Moves.Fissure],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Strength,
        Moves.RockSmash,
        Moves.RockSlide,
      ],
    },
  });
}
