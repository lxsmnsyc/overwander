import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
];

const FAMILY_ABILITIES = [Abilities.Gluttony, Abilities.Chlorophyll];

export default function registerBellsproutSpecies(): void {
  registerSpecies(Species.Bellsprout, {
    dexNumber: 69,
    evolvesInto: [
      {
        species: Species.Weepinbell,
        method: EvolutionMethod.Level,
        level: 21,
      },
    ],
    name: 'Bellsprout',
    category: 'Flower Pokemon',
    family: Families.Bellsprout,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 75,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 40,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TemperateForest, Biome.TropicalSeasonalForest, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.VineWhip, Moves.Growth],
        13: [Moves.Wrap],
        15: [Moves.PoisonPowder],
        18: [Moves.SleepPowder],
        21: [Moves.StunSpore],
        26: [Moves.Acid],
        33: [Moves.RazorLeaf],
        42: [Moves.Slam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Weepinbell, {
    dexNumber: 70,
    evolvesInto: [
      {
        species: Species.Victreebel,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
    ],
    name: 'Weepinbell',
    category: 'Flycatcher Pokemon',
    family: Families.Bellsprout,
    evolvesFrom: Species.Bellsprout,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 55,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TemperateForest, Biome.TropicalSeasonalForest, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.VineWhip, Moves.Growth, Moves.Wrap],
        13: [Moves.Wrap],
        15: [Moves.PoisonPowder],
        18: [Moves.SleepPowder],
        23: [Moves.StunSpore],
        29: [Moves.Acid],
        38: [Moves.RazorLeaf],
        49: [Moves.Slam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Victreebel, {
    dexNumber: 71,
    name: 'Victreebel',
    category: 'Flycatcher Pokemon',
    family: Families.Bellsprout,
    evolvesFrom: Species.Weepinbell,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 105,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.TropicalSeasonalForest, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.SleepPowder, Moves.StunSpore, Moves.Acid, Moves.RazorLeaf],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
