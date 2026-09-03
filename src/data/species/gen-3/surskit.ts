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
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Flash,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerSurskitSpecies(): void {
  registerSpecies(Species.Surskit, {
    dexNumber: 283,
    evolvesInto: [
      {
        species: Species.Masquerain,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Surskit',
    category: 'Pond Skater Pokemon',
    height: 0.5,
    weight: 1.7,
    family: Families.Surskit,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 30,
      [Stats.Defense]: 32,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 52,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug, Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.RainDish],
    eggGroups: [EggGroups.Water1, EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        7: [Moves.QuickAttack],
        13: [Moves.SweetScent],
        19: [Moves.WaterSport],
        25: [Moves.BubbleBeam],
        31: [Moves.Agility],
        37: [Moves.Haze, Moves.Mist],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Foresight, Moves.MindReader, Moves.Psybeam, Moves.MudShot, Moves.HydroPump],
    },
  });

  registerSpecies(Species.Masquerain, {
    dexNumber: 284,
    name: 'Masquerain',
    category: 'Eyeball Pokemon',
    height: 0.8,
    weight: 3.6,
    family: Families.Surskit,
    evolvesFrom: Species.Surskit,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 82,
      [Stats.Speed]: 80,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Intimidate],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Water1, EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.QuickAttack, Moves.SweetScent, Moves.WaterSport],
        26: [Moves.Gust],
        33: [Moves.ScaryFace],
        40: [Moves.StunSpore],
        47: [Moves.SilverWind],
        53: [Moves.Whirlwind],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.AerialAce, Moves.HyperBeam],
    },
  });
}
