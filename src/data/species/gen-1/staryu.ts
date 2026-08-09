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
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.TriAttack,
  Moves.Substitute,
  Moves.Surf,
  Moves.Flash,
];

const FAMILY_ABILITIES = [Abilities.Analytic, Abilities.Illuminate, Abilities.NaturalCure];

export default function registerStaryuSpecies(): void {
  registerSpecies(Species.Staryu, {
    dexNumber: 120,
    evolvesInto: [
      {
        species: Species.Starmie,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Staryu',
    category: 'Star Shape Pokemon',
    family: Families.Staryu,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 45,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: undefined,
    catchRate: 225,
    biomes: [Biome.Beach, Biome.CoralReef],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        17: [Moves.WaterGun],
        22: [Moves.Harden],
        27: [Moves.Recover],
        32: [Moves.Swift],
        37: [Moves.Minimize],
        42: [Moves.LightScreen],
        47: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Starmie, {
    dexNumber: 121,
    name: 'Starmie',
    category: 'Mysterious Pokemon',
    family: Families.Staryu,
    evolvesFrom: Species.Staryu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 115,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Beach, Biome.CoralReef],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.WaterGun, Moves.Harden],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
