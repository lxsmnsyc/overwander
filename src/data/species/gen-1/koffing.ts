import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.FireBlast,
  Moves.Rest,
  Moves.Explosion,
  Moves.Substitute,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.ZapCannon,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Flamethrower,
];

const FAMILY_ABILITIES = [Abilities.Levitate, Abilities.NeutralizingGas];

export default function registerKoffingSpecies(): void {
  registerSpecies(Species.Koffing, {
    dexNumber: 109,
    evolvesInto: [
      {
        species: Species.Weezing,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Koffing',
    category: 'Poison Gas Pokemon',
    height: 0.6,
    weight: 1,
    family: Families.Koffing,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 65,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Stench],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Swamp],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Smog, Moves.PoisonGas],
        17: [Moves.SelfDestruct],
        21: [Moves.Sludge],
        25: [Moves.SmokeScreen],
        33: [Moves.Haze],
        41: [Moves.Explosion],
        45: [Moves.DestinyBond],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Psywave, Moves.Screech, Moves.Psybeam, Moves.DestinyBond, Moves.PainSplit],
    },
  });

  registerSpecies(Species.Weezing, {
    dexNumber: 110,
    name: 'Weezing',
    category: 'Poison Gas Pokemon',
    height: 1.2,
    weight: 9.5,
    family: Families.Koffing,
    evolvesFrom: Species.Koffing,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 60,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Stench, Abilities.Aftermath],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Swamp],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Smog, Moves.Sludge, Moves.SelfDestruct, Moves.PoisonGas],
        25: [Moves.SmokeScreen],
        33: [Moves.Haze],
        44: [Moves.Explosion],
        51: [Moves.DestinyBond],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
