import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AirCutter,
  Moves.AquaTail,
  Moves.Attract,
  Moves.Blizzard,
  Moves.Bounce,
  Moves.Brine,
  Moves.Captivate,
  Moves.Defog,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.NaturalGift,
  Moves.OminousWind,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SilverWind,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.Toxic,
  Moves.Twister,
  Moves.UTurn,
  Moves.WaterPulse,
  Moves.Waterfall,
];

/**
 * The fish that wears two false eyes: a Finneon hides behind the
 * pattern on its fins, and a Lumineon lights the deep water with it
 */
export default function registerFinneonSpecies(): void {
  registerSpecies(Species.Finneon, {
    dexNumber: 456,
    evolvesInto: [
      {
        species: Species.Lumineon,
        method: EvolutionMethod.Level,
        level: 31,
      },
    ],
    name: 'Finneon',
    category: 'Wing Fish Pokemon',
    height: 0.4,
    weight: 7.0,
    family: Families.Finneon,
    stats: {
      [Stats.HP]: 49,
      [Stats.Attack]: 49,
      [Stats.Defense]: 56,
      [Stats.SpecialAttack]: 49,
      [Stats.SpecialDefense]: 61,
      [Stats.Speed]: 66,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.StormDrain],
    hiddenAbilities: [Abilities.WaterVeil],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Pound],
        6: [Moves.WaterGun],
        10: [Moves.Attract],
        13: [Moves.RainDance],
        17: [Moves.Gust],
        22: [Moves.WaterPulse],
        26: [Moves.Captivate],
        29: [Moves.Safeguard],
        33: [Moves.AquaRing],
        38: [Moves.Whirlpool],
        42: [Moves.UTurn],
        45: [Moves.Bounce],
        49: [Moves.SilverWind],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Agility,
        Moves.AquaTail,
        Moves.Charm,
        Moves.Flail,
        Moves.Psybeam,
        Moves.Splash,
        Moves.SweetKiss,
        Moves.Tickle,
      ],
    },
  });
  registerSpecies(Species.Lumineon, {
    dexNumber: 457,
    name: 'Lumineon',
    category: 'Neon Pokemon',
    height: 1.2,
    weight: 24.0,
    family: Families.Finneon,
    evolvesFrom: Species.Finneon,
    stats: {
      [Stats.HP]: 69,
      [Stats.Attack]: 69,
      [Stats.Defense]: 76,
      [Stats.SpecialAttack]: 69,
      [Stats.SpecialDefense]: 86,
      [Stats.Speed]: 91,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.StormDrain],
    // Illuminate is this registry's rather than the mainline's: the
    // Neon Pokemon is named for the light its own dex entry describes
    hiddenAbilities: [Abilities.WaterVeil, Abilities.Illuminate],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Attract, Moves.Pound, Moves.WaterGun],
        6: [Moves.WaterGun],
        10: [Moves.Attract],
        13: [Moves.RainDance],
        17: [Moves.Gust],
        22: [Moves.WaterPulse],
        26: [Moves.Captivate],
        29: [Moves.Safeguard],
        35: [Moves.AquaRing],
        42: [Moves.Whirlpool],
        48: [Moves.UTurn],
        53: [Moves.Bounce],
        59: [Moves.SilverWind],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
