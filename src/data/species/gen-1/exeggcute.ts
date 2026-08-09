import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.SolarBeam,
  Moves.MegaDrain,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.EggBomb,
  Moves.SelfDestruct,
  Moves.Rest,
  Moves.Psywave,
  Moves.Explosion,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.Harvest, Abilities.Chlorophyll];

export default function registerExeggcuteSpecies(): void {
  registerSpecies(Species.Exeggcute, {
    dexNumber: 102,
    evolvesInto: [
      {
        species: Species.Exeggutor,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
    ],
    name: 'Exeggcute',
    category: 'Egg Pokemon',
    family: Families.Exeggcute,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 40,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 40,
    },
    types: [Types.Grass, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Barrage, Moves.Hypnosis],
        25: [Moves.Reflect],
        28: [Moves.LeechSeed],
        32: [Moves.StunSpore],
        37: [Moves.PoisonPowder],
        42: [Moves.SolarBeam],
        48: [Moves.SleepPowder],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Exeggutor, {
    dexNumber: 103,
    name: 'Exeggutor',
    category: 'Coconut Pokemon',
    family: Families.Exeggcute,
    evolvesFrom: Species.Exeggcute,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 95,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 55,
    },
    types: [Types.Grass, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Barrage, Moves.Hypnosis],
        28: [Moves.Stomp],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength],
    },
  });
}
