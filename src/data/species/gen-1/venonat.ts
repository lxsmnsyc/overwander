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
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Psychic,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Swift,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.SweetScent,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Facade,
  Moves.SecretPower,
  Moves.SkillSwap,
];

export default function registerVenonatSpecies(): void {
  registerSpecies(Species.Venonat, {
    dexNumber: 48,
    evolvesInto: [
      {
        species: Species.Venomoth,
        method: EvolutionMethod.Level,
        level: 31,
      },
    ],
    name: 'Venonat',
    category: 'Insect Pokemon',
    height: 1,
    weight: 30,
    family: Families.Venonat,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 55,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 45,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.CompoundEyes, Abilities.TintedLens],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Disable, Moves.Foresight],
        9: [Moves.Supersonic],
        17: [Moves.Confusion],
        20: [Moves.PoisonPowder],
        25: [Moves.LeechLife],
        28: [Moves.StunSpore],
        33: [Moves.Psybeam],
        36: [Moves.SleepPowder],
        41: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Flash],
      egg: [Moves.Screech, Moves.GigaDrain, Moves.BatonPass, Moves.SignalBeam],
    },
  });

  registerSpecies(Species.Venomoth, {
    dexNumber: 49,
    name: 'Venomoth',
    category: 'Poison Moth Pokemon',
    height: 1.5,
    weight: 12.5,
    family: Families.Venonat,
    evolvesFrom: Species.Venonat,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 65,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 90,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.ShieldDust, Abilities.TintedLens],
    hiddenAbilities: [Abilities.WonderSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Disable,
          Moves.PoisonPowder,
          Moves.Supersonic,
          Moves.Foresight,
          Moves.SilverWind,
        ],
        17: [Moves.Confusion],
        25: [Moves.LeechLife],
        28: [Moves.StunSpore],
        31: [Moves.Gust],
        36: [Moves.Psybeam],
        42: [Moves.SleepPowder],
        50: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Flash, Moves.AerialAce],
    },
  });
}
