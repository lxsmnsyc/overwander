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
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Metronome,
  Moves.SelfDestruct,
  Moves.FireBlast,
  Moves.RockSlide,
  Moves.Explosion,
  Moves.Rest,
  Moves.Substitute,
  Moves.Strength,
  Moves.FirePunch,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Sandstorm,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.RockSmash,
  Moves.Flamethrower,
];

const FAMILY_ABILITIES = [Abilities.RockHead, Abilities.Sturdy];

export default function registerGeodudeSpecies(): void {
  registerSpecies(Species.Geodude, {
    dexNumber: 74,
    evolvesInto: [
      {
        species: Species.Graveler,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Geodude',
    category: 'Rock Pokemon',
    height: 0.4,
    weight: 20,
    family: Families.Geodude,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 80,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 20,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SandVeil],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.ColdDesert, Biome.Volcano, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        6: [Moves.DefenseCurl],
        11: [Moves.RockThrow],
        16: [Moves.Magnitude],
        21: [Moves.SelfDestruct],
        26: [Moves.Harden],
        31: [Moves.Earthquake, Moves.Rollout],
        36: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.MegaPunch, Moves.RockSlide],
    },
  });

  registerSpecies(Species.Graveler, {
    dexNumber: 75,
    evolvesInto: [
      {
        species: Species.Golem,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Graveler',
    category: 'Rock Pokemon',
    height: 1,
    weight: 105,
    family: Families.Geodude,
    evolvesFrom: Species.Geodude,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 95,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SandVeil],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Mountain, Biome.ColdDesert, Biome.Volcano, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.DefenseCurl, Moves.RockThrow],
        16: [Moves.Magnitude],
        21: [Moves.SelfDestruct],
        27: [Moves.Harden],
        34: [Moves.Rollout],
        36: [Moves.Earthquake],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Golem, {
    dexNumber: 76,
    name: 'Golem',
    category: 'Megaton Pokemon',
    height: 1.4,
    weight: 300,
    family: Families.Geodude,
    evolvesFrom: Species.Graveler,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 120,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SandVeil, Abilities.SolidRock],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.ColdDesert, Biome.Volcano],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.DefenseCurl, Moves.RockThrow, Moves.Magnitude],
        21: [Moves.SelfDestruct],
        27: [Moves.Harden],
        34: [Moves.Rollout],
        36: [Moves.Earthquake],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Roar, Moves.FuryCutter],
    },
  });
}
