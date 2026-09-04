import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Cut,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.IcyWind,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
];

const FAMILY_ABILITIES = [Abilities.ClearBody, Abilities.LiquidOoze];

export default function registerTentacoolSpecies(): void {
  registerSpecies(Species.Tentacool, {
    dexNumber: 72,
    evolvesInto: [
      {
        species: Species.Tentacruel,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Tentacool',
    category: 'Jellyfish Pokemon',
    height: 0.9,
    weight: 45.5,
    family: Families.Tentacool,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 40,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.RainDish],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.DeepOcean, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Acid, Moves.PoisonSting],
        6: [Moves.Supersonic],
        12: [Moves.Constrict],
        13: [Moves.Wrap],
        22: [Moves.WaterGun],
        25: [Moves.BubbleBeam],
        33: [Moves.Barrier],
        40: [Moves.Screech],
        48: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AuroraBeam,
        Moves.Haze,
        Moves.ConfuseRay,
        Moves.Safeguard,
        Moves.RapidSpin,
        Moves.MirrorCoat,
      ],
    },
  });

  registerSpecies(Species.Tentacruel, {
    dexNumber: 73,
    name: 'Tentacruel',
    category: 'Jellyfish Pokemon',
    height: 1.6,
    weight: 55,
    family: Families.Tentacool,
    evolvesFrom: Species.Tentacool,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 70,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 100,
    },
    types: [Types.Water, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.RainDish, Abilities.PoisonTouch],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Ocean, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Acid, Moves.Supersonic, Moves.Wrap, Moves.PoisonSting, Moves.Constrict],
        22: [Moves.WaterGun],
        25: [Moves.BubbleBeam],
        35: [Moves.Barrier],
        43: [Moves.Screech],
        50: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
