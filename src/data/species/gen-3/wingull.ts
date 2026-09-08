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
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SteelWing,
  Moves.Fly,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerWingullSpecies(): void {
  registerSpecies(Species.Wingull, {
    dexNumber: 278,
    evolvesInto: [
      {
        species: Species.Pelipper,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Wingull',
    category: 'Seagull Pokemon',
    height: 0.6,
    weight: 9.5,
    family: Families.Wingull,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 30,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 85,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.Hydration],
    hiddenAbilities: [Abilities.RainDish],
    eggGroups: [EggGroups.Water1, EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.RockyCoast],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.WaterGun],
        7: [Moves.Supersonic],
        13: [Moves.WingAttack],
        21: [Moves.Mist],
        31: [Moves.QuickAttack],
        43: [Moves.Pursuit],
        55: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Gust, Moves.WaterSport, Moves.Twister],
    },
  });

  registerSpecies(Species.Pelipper, {
    dexNumber: 279,
    name: 'Pelipper',
    category: 'Water Bird Pokemon',
    height: 1.2,
    weight: 28,
    family: Families.Wingull,
    evolvesFrom: Species.Wingull,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 65,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.Drizzle],
    hiddenAbilities: [Abilities.RainDish],
    eggGroups: [EggGroups.Water1, EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Beach, Biome.RockyCoast],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.WaterGun, Moves.WaterSport, Moves.WingAttack],
        7: [Moves.Supersonic],
        21: [Moves.Mist],
        25: [Moves.Protect],
        33: [Moves.Stockpile, Moves.Swallow],
        47: [Moves.SpitUp],
        61: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Surf, Moves.HyperBeam],
    },
  });
}
