import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Flash,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
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
  Moves.RockSmash,
];

export default function registerParasSpecies(): void {
  registerSpecies(Species.Paras, {
    dexNumber: 46,
    evolvesInto: [
      {
        species: Species.Parasect,
        method: EvolutionMethod.Level,
        level: 24,
      },
    ],
    name: 'Paras',
    category: 'Mushroom Pokemon',
    height: 0.3,
    weight: 5.4,
    family: Families.Paras,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 70,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 25,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.EffectSpore, Abilities.DrySkin],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Bug, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.MontaneForest, Biome.Taiga],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        7: [Moves.StunSpore],
        13: [Moves.PoisonPowder],
        19: [Moves.LeechLife],
        25: [Moves.Spore],
        31: [Moves.Slash],
        37: [Moves.Growth],
        43: [Moves.GigaDrain],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Screech,
        Moves.Counter,
        Moves.Psybeam,
        Moves.LightScreen,
        Moves.Flail,
        Moves.FalseSwipe,
        Moves.Pursuit,
        Moves.SweetScent,
      ],
    },
  });

  registerSpecies(Species.Parasect, {
    dexNumber: 47,
    name: 'Parasect',
    category: 'Mushroom Pokemon',
    height: 1,
    weight: 29.5,
    family: Families.Paras,
    evolvesFrom: Species.Paras,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 95,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 30,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.EffectSpore, Abilities.DrySkin],
    hiddenAbilities: [Abilities.Damp, Abilities.Technician],
    eggGroups: [EggGroups.Bug, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.MontaneForest, Biome.Taiga],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.StunSpore, Moves.LeechLife, Moves.PoisonPowder],
        28: [Moves.Spore],
        37: [Moves.Slash],
        46: [Moves.Growth],
        55: [Moves.GigaDrain],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
