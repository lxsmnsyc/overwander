import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.IcyWind,
  Moves.Earthquake,
  Moves.Strength,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Roar,
];

const FAMILY_ABILITIES = [Abilities.Oblivious, Abilities.SnowCloak];

export default function registerSwinubSpecies(): void {
  registerSpecies(Species.Swinub, {
    dexNumber: 220,
    evolvesInto: [
      {
        species: Species.Piloswine,
        method: EvolutionMethod.Level,
        level: 33,
      },
    ],
    name: 'Swinub',
    category: 'Pig Pokemon',
    height: 0.4,
    weight: 6.5,
    family: Families.Swinub,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 50,
    },
    types: [Types.Ice, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.ThickFat],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Tundra, Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        10: [Moves.PowderSnow],
        19: [Moves.Endure],
        28: [Moves.TakeDown],
        37: [Moves.Mist],
        46: [Moves.Blizzard],
        55: [Moves.Amnesia],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AncientPower, Moves.Bite, Moves.BodySlam, Moves.RockSlide],
    },
  });

  registerSpecies(Species.Piloswine, {
    dexNumber: 221,
    name: 'Piloswine',
    category: 'Swine Pokemon',
    height: 1.1,
    weight: 55.8,
    family: Families.Swinub,
    evolvesFrom: Species.Swinub,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 50,
    },
    types: [Types.Ice, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    // Nothing invented here: Piloswine gains Mamoswine in a later
    // generation, so it is not a final evolution to fill
    hiddenAbilities: [Abilities.ThickFat],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Tundra, Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.HornAttack, Moves.PowderSnow, Moves.Endure],
        28: [Moves.TakeDown],
        33: [Moves.FuryAttack],
        42: [Moves.Mist],
        56: [Moves.Blizzard],
        70: [Moves.Amnesia],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
