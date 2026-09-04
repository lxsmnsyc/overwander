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
  Moves.Roar,
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
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Strength,
  Moves.RockSmash,
  Moves.Waterfall,
  Moves.Dive,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Rollout,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerWailmerSpecies(): void {
  registerSpecies(Species.Wailmer, {
    dexNumber: 320,
    evolvesInto: [
      {
        species: Species.Wailord,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Wailmer',
    category: 'Ball Whale Pokemon',
    height: 2,
    weight: 130,
    family: Families.Wailmer,
    stats: {
      [Stats.HP]: 130,
      [Stats.Attack]: 70,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 60,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterVeil, Abilities.Oblivious],
    hiddenAbilities: [Abilities.Pressure],
    eggGroups: [EggGroups.Field, EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 125,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Splash],
        5: [Moves.Growl],
        10: [Moves.WaterGun],
        14: [Moves.Rollout],
        19: [Moves.Whirlpool],
        23: [Moves.Astonish],
        28: [Moves.WaterPulse],
        32: [Moves.Mist],
        37: [Moves.Rest],
        41: [Moves.WaterSpout],
        46: [Moves.Amnesia],
        50: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Curse, Moves.Fissure, Moves.Thrash, Moves.Tickle],
    },
  });

  registerSpecies(Species.Wailord, {
    dexNumber: 321,
    name: 'Wailord',
    category: 'Float Whale Pokemon',
    height: 14.5,
    weight: 398,
    family: Families.Wailmer,
    evolvesFrom: Species.Wailmer,
    stats: {
      [Stats.HP]: 170,
      [Stats.Attack]: 90,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 60,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterVeil, Abilities.Oblivious],
    // One the mainline never gave it: nothing goes off with that much
    // water spouting over it
    hiddenAbilities: [Abilities.Pressure, Abilities.Damp],
    eggGroups: [EggGroups.Field, EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Splash, Moves.Growl, Moves.WaterGun, Moves.Rollout],
        19: [Moves.Whirlpool],
        23: [Moves.Astonish],
        28: [Moves.WaterPulse],
        32: [Moves.Mist],
        37: [Moves.Rest],
        44: [Moves.WaterSpout],
        52: [Moves.Amnesia],
        59: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
