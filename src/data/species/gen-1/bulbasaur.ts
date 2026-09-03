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
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Flash,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
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
  Moves.BulletSeed,
  Moves.Facade,
  Moves.RockSmash,
  Moves.SecretPower,
  Moves.SludgeBomb,
  Moves.Strength,
];

export default function registerBulbasaurSpecies(): void {
  registerSpecies(Species.Bulbasaur, {
    dexNumber: 1,
    evolvesInto: [
      {
        species: Species.Ivysaur,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Bulbasaur',
    category: 'Seed Pokemon',
    height: 0.7,
    weight: 6.9,
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 49,
      [Stats.Defense]: 49,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.Chlorophyll],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        7: [Moves.LeechSeed],
        10: [Moves.VineWhip],
        15: [Moves.PoisonPowder, Moves.SleepPowder],
        20: [Moves.RazorLeaf],
        25: [Moves.SweetScent],
        32: [Moves.Growth],
        39: [Moves.Synthesis],
        46: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.LightScreen,
        Moves.SkullBash,
        Moves.PetalDance,
        Moves.RazorWind,
        Moves.Charm,
        Moves.Safeguard,

        Moves.GrassWhistle,
        Moves.MagicalLeaf,
      ],
    },
  });

  registerSpecies(Species.Ivysaur, {
    dexNumber: 2,
    evolvesInto: [
      {
        species: Species.Venusaur,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Ivysaur',
    category: 'Seed Pokemon',
    height: 1,
    weight: 13,
    family: Families.Bulbasaur,
    evolvesFrom: Species.Bulbasaur,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 62,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.Chlorophyll],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed],
        10: [Moves.VineWhip],
        15: [Moves.PoisonPowder, Moves.SleepPowder],
        22: [Moves.RazorLeaf],
        29: [Moves.SweetScent],
        38: [Moves.Growth],
        47: [Moves.Synthesis],
        54: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Venusaur, {
    dexNumber: 3,
    name: 'Venusaur',
    category: 'Seed Pokemon',
    height: 2,
    weight: 100,
    family: Families.Bulbasaur,
    evolvesFrom: Species.Ivysaur,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 82,
      [Stats.Defense]: 83,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.Chlorophyll, Abilities.LeafGuard, Abilities.EffectSpore],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed, Moves.VineWhip],
        15: [Moves.PoisonPowder, Moves.SleepPowder],
        22: [Moves.RazorLeaf],
        29: [Moves.SweetScent],
        41: [Moves.Growth],
        53: [Moves.Synthesis],
        65: [Moves.SolarBeam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Roar,
        Moves.Earthquake,
        Moves.FrenzyPlant,
      ],
    },
  });
}
