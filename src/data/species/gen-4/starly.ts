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
  Moves.AirCutter,
  Moves.Attract,
  Moves.Captivate,
  Moves.Defog,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.Fly,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.OminousWind,
  Moves.Pluck,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roost,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SteelWing,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.Thief,
  Moves.Toxic,
  Moves.Twister,
  Moves.UTurn,
];

/**
 * Sinnoh's first bird, and the one that never flies alone: a flock of
 * Starly is loud enough to be heard from the next route over
 */
export default function registerStarlySpecies(): void {
  registerSpecies(Species.Starly, {
    dexNumber: 396,
    evolvesInto: [
      {
        species: Species.Staravia,
        method: EvolutionMethod.Level,
        level: 14,
      },
    ],
    name: 'Starly',
    category: 'Starling Pokemon',
    height: 0.3,
    weight: 2.0,
    family: Families.Starly,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 55,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 60,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye],
    hiddenAbilities: [Abilities.Reckless],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle],
        5: [Moves.QuickAttack],
        9: [Moves.WingAttack],
        13: [Moves.DoubleTeam],
        17: [Moves.Endeavor],
        21: [Moves.Whirlwind],
        25: [Moves.AerialAce],
        29: [Moves.TakeDown],
        33: [Moves.Agility],
        37: [Moves.BraveBird],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Astonish,
        Moves.DoubleEdge,
        Moves.FeatherDance,
        Moves.Foresight,
        Moves.FuryAttack,
        Moves.Pursuit,
        Moves.SandAttack,
      ],
    },
  });
  registerSpecies(Species.Staravia, {
    dexNumber: 397,
    evolvesInto: [
      {
        species: Species.Staraptor,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Staravia',
    category: 'Starling Pokemon',
    height: 0.6,
    weight: 15.5,
    family: Families.Starly,
    evolvesFrom: Species.Starly,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 75,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 80,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Intimidate],
    hiddenAbilities: [Abilities.Reckless],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.QuickAttack, Moves.Tackle],
        5: [Moves.QuickAttack],
        9: [Moves.WingAttack],
        13: [Moves.DoubleTeam],
        18: [Moves.Endeavor],
        23: [Moves.Whirlwind],
        28: [Moves.AerialAce],
        33: [Moves.TakeDown],
        38: [Moves.Agility],
        43: [Moves.BraveBird],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Staraptor, {
    dexNumber: 398,
    name: 'Staraptor',
    category: 'Predator Pokemon',
    height: 1.2,
    weight: 24.9,
    family: Families.Starly,
    evolvesFrom: Species.Staravia,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 120,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Intimidate],
    // Gale Wings is this registry's rather than the mainline's: the
    // flock leaves the flock behind, and it gets there first
    hiddenAbilities: [Abilities.Reckless, Abilities.GaleWings],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.QuickAttack, Moves.Tackle, Moves.WingAttack],
        5: [Moves.QuickAttack],
        9: [Moves.WingAttack],
        13: [Moves.DoubleTeam],
        18: [Moves.Endeavor],
        23: [Moves.Whirlwind],
        28: [Moves.AerialAce],
        33: [Moves.TakeDown],
        34: [Moves.CloseCombat],
        41: [Moves.Agility],
        49: [Moves.BraveBird],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam, Moves.SkyAttack],
    },
  });
}
