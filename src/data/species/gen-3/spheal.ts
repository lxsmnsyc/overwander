import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves the whole line shares
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
  Moves.IronTail,
  Moves.Earthquake,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Strength,
  Moves.RockSmash,
  Moves.Waterfall,
  Moves.Dive,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Rollout,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerSphealSpecies(): void {
  registerSpecies(Species.Spheal, {
    dexNumber: 363,
    evolvesInto: [
      {
        species: Species.Sealeo,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Spheal',
    category: 'Clap Pokemon',
    height: 0.8,
    weight: 39.5,
    family: Families.Spheal,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 40,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 25,
    },
    types: [Types.Ice, Types.Water],
    abilities: [Abilities.ThickFat, Abilities.IceBody],
    hiddenAbilities: [Abilities.Oblivious],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Glacier, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.WaterGun, Moves.PowderSnow],
        7: [Moves.Encore],
        13: [Moves.IceBall],
        19: [Moves.BodySlam],
        25: [Moves.AuroraBeam],
        31: [Moves.Hail],
        37: [Moves.Rest, Moves.Snore],
        43: [Moves.Blizzard],
        49: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Curse,
        Moves.Fissure,
        Moves.SpitUp,
        Moves.Stockpile,
        Moves.Swallow,
        Moves.WaterSport,
        Moves.Yawn,
      ],
    },
  });

  registerSpecies(Species.Sealeo, {
    dexNumber: 364,
    evolvesInto: [
      {
        species: Species.Walrein,
        method: EvolutionMethod.Level,
        level: 44,
      },
    ],
    name: 'Sealeo',
    category: 'Ball Roll Pokemon',
    height: 1.1,
    weight: 87.6,
    family: Families.Spheal,
    evolvesFrom: Species.Spheal,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 60,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 45,
    },
    types: [Types.Ice, Types.Water],
    abilities: [Abilities.ThickFat, Abilities.IceBody],
    hiddenAbilities: [Abilities.Oblivious],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Glacier, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.WaterGun, Moves.PowderSnow, Moves.Encore],
        13: [Moves.IceBall],
        19: [Moves.BodySlam],
        25: [Moves.AuroraBeam],
        31: [Moves.Hail],
        39: [Moves.Rest, Moves.Snore],
        47: [Moves.Blizzard],
        55: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Roar],
    },
  });

  registerSpecies(Species.Walrein, {
    dexNumber: 365,
    name: 'Walrein',
    category: 'Ice Break Pokemon',
    height: 1.4,
    weight: 150.6,
    family: Families.Spheal,
    evolvesFrom: Species.Sealeo,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 80,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 65,
    },
    types: [Types.Ice, Types.Water],
    abilities: [Abilities.ThickFat, Abilities.IceBody],
    // One the mainline never gave it: the sky its line already feeds
    // on is one a bulk that size can move through
    hiddenAbilities: [Abilities.Oblivious, Abilities.SlushRush],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Glacier, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.WaterGun, Moves.PowderSnow, Moves.Encore],
        13: [Moves.IceBall],
        19: [Moves.BodySlam],
        25: [Moves.AuroraBeam],
        31: [Moves.Hail],
        39: [Moves.Rest, Moves.Snore],
        50: [Moves.Blizzard],
        61: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Roar, Moves.HyperBeam],
    },
  });
}
