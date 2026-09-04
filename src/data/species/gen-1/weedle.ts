import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerWeedleSpecies(): void {
  registerSpecies(Species.Weedle, {
    dexNumber: 13,
    evolvesInto: [
      {
        species: Species.Kakuna,
        method: EvolutionMethod.Level,
        level: 7,
      },
    ],
    name: 'Weedle',
    category: 'Hairy Bug Pokemon',
    height: 0.3,
    weight: 3.2,
    family: Families.Weedle,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 35,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 50,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.ShieldDust],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.StringShot],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Kakuna, {
    dexNumber: 14,
    evolvesInto: [
      {
        species: Species.Beedrill,
        method: EvolutionMethod.Level,
        level: 10,
      },
    ],
    name: 'Kakuna',
    category: 'Cocoon Pokemon',
    height: 0.6,
    weight: 10,
    family: Families.Weedle,
    evolvesFrom: Species.Weedle,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 25,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 35,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Harden],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Beedrill, {
    dexNumber: 15,
    name: 'Beedrill',
    category: 'Poison Bee Pokemon',
    height: 1,
    weight: 29.5,
    family: Families.Weedle,
    evolvesFrom: Species.Kakuna,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 75,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.Swarm],
    hiddenAbilities: [Abilities.Sniper],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.FuryAttack],
        15: [Moves.FocusEnergy],
        20: [Moves.Twineedle],
        25: [Moves.Rage],
        30: [Moves.PinMissile, Moves.Pursuit],
        35: [Moves.Agility],
      },
      teachable: [
        Moves.SwordsDance,
        Moves.Toxic,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.MegaDrain,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Swift,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.SludgeBomb,
        Moves.GigaDrain,
        Moves.Endure,
        Moves.Swagger,
        Moves.FuryCutter,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.SweetScent,
        Moves.HiddenPower,
        Moves.SunnyDay,
      ],
    },
  });
}
