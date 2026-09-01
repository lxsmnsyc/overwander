import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Earthquake,
  Moves.Dig,
  Moves.Cut,
  Moves.Strength,
  Moves.SunnyDay,
  Moves.ZapCannon,
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.DynamicPunch,
  Moves.FuryCutter,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Roar,
  Moves.Swift,
];

// Both learn the same list, only later once it has grown
const FAMILY_LEVEL = {
  8: [Moves.Lick],
  15: [Moves.FurySwipes],
  22: [Moves.FeintAttack],
  29: [Moves.Rest],
};

export default function registerTeddiursaSpecies(): void {
  registerSpecies(Species.Teddiursa, {
    dexNumber: 216,
    evolvesInto: [
      {
        species: Species.Ursaring,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Teddiursa',
    category: 'Little Bear Pokemon',
    height: 0.6,
    weight: 8.8,
    family: Families.Teddiursa,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 80,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 40,
    },
    types: [Types.Normal],
    abilities: [Abilities.Pickup, Abilities.QuickFeet],
    hiddenAbilities: [Abilities.HoneyGather],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Taiga, Biome.MontaneForest, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Scratch],
        ...FAMILY_LEVEL,
        36: [Moves.Slash],
        43: [Moves.Snore],
        50: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Counter,
        Moves.Crunch,
        Moves.FocusEnergy,
        Moves.MetalClaw,
        Moves.SeismicToss,
        Moves.TakeDown,
      ],
    },
  });

  registerSpecies(Species.Ursaring, {
    dexNumber: 217,
    name: 'Ursaring',
    category: 'Hibernator Pokemon',
    height: 1.8,
    weight: 125.8,
    family: Families.Teddiursa,
    evolvesFrom: Species.Teddiursa,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 130,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 55,
    },
    types: [Types.Normal],
    abilities: [Abilities.Guts, Abilities.QuickFeet],
    // Nothing invented here: Teddiursa's Pickup and Honey Gather walk
    // up to meet its own three, and Ursaluna lands above it later
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Taiga, Biome.MontaneForest, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Scratch, Moves.Lick, Moves.FurySwipes],
        22: [Moves.FeintAttack],
        29: [Moves.Rest],
        39: [Moves.Slash],
        49: [Moves.Snore],
        59: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
