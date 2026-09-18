import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.AirCutter,
  Moves.AirSlash,
  Moves.Attract,
  Moves.BraveBird,
  Moves.Defog,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.FeatherDance,
  Moves.Fly,
  Moves.Frustration,
  Moves.Hail,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.Hurricane,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.Pluck,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roost,
  Moves.Round,
  Moves.Scald,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SteelWing,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WaterPulse,
  Moves.Whirlpool,
];

/**
 * The water birds: a Ducklett dives rather than runs, and a Swanna
 * puts on a display at dusk that the rest of the flock follows
 */
export default function registerDucklettSpecies(): void {
  registerSpecies(Species.Ducklett, {
    dexNumber: 580,
    evolvesInto: [
      {
        species: Species.Swanna,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Ducklett',
    category: 'Water Bird Pokemon',
    height: 0.5,
    weight: 5.5,
    family: Families.Ducklett,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 44,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 44,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 55,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.BigPecks],
    hiddenAbilities: [Abilities.Hydration],
    eggGroups: [EggGroups.Water1, EggGroups.Flying],
    habitat: Habitat.Amphibious,
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Bog, Biome.Swamp],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.WaterGun],
        3: [Moves.WaterSport],
        6: [Moves.Defog],
        9: [Moves.WingAttack],
        13: [Moves.WaterPulse],
        15: [Moves.AerialAce],
        19: [Moves.BubbleBeam],
        21: [Moves.FeatherDance],
        24: [Moves.AquaRing],
        27: [Moves.AirSlash],
        30: [Moves.Roost],
        34: [Moves.RainDance],
        37: [Moves.Tailwind],
        41: [Moves.BraveBird],
        46: [Moves.Hurricane],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AirCutter,
        Moves.AquaJet,
        Moves.Brine,
        Moves.Dive,
        Moves.Endeavor,
        Moves.Gust,
        Moves.LuckyChant,
        Moves.MeFirst,
        Moves.MirrorMove,
        Moves.MudSport,
        Moves.SteelWing,
      ],
    },
  });
  registerSpecies(Species.Swanna, {
    dexNumber: 581,
    name: 'Swanna',
    category: 'White Bird Pokemon',
    height: 1.3,
    weight: 24.2,
    family: Families.Ducklett,
    evolvesFrom: Species.Ducklett,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 87,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 87,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 98,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.BigPecks],
    // Rain Dish is the invented fourth: the line reaches three, and it
    // sits beside the Hydration it already has rather than repeating it
    hiddenAbilities: [Abilities.Hydration, Abilities.RainDish],
    eggGroups: [EggGroups.Water1, EggGroups.Flying],
    habitat: Habitat.Amphibious,
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Bog, Biome.Swamp],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.WaterGun,
          Moves.WaterSport,
          Moves.Defog,
          Moves.WingAttack,
          Moves.WaterPulse,
          Moves.AerialAce,
        ],
        19: [Moves.BubbleBeam],
        21: [Moves.FeatherDance],
        24: [Moves.AquaRing],
        27: [Moves.AirSlash],
        30: [Moves.Roost],
        34: [Moves.RainDance],
        37: [Moves.Tailwind],
        44: [Moves.BraveBird],
        52: [Moves.Hurricane],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
