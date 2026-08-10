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
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
];

export default function registerBulbasaurSpecies(): void {
  registerSpecies(Species.Bulbasaur, {
    dexNumber: 1,
    evolvesInto: [
      {
        species: Species.Ivysaur,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Bulbasaur',
    category: 'Seed Pokemon',
    height: 0.7,
    weight: 6.9,
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 49,
      [Stats.Defense]: 49,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbility: Abilities.Chlorophyll,
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        20: [Moves.PoisonPowder],
        27: [Moves.RazorLeaf],
        34: [Moves.Growth],
        41: [Moves.SleepPowder],
        48: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.LightScreen, Moves.SkullBash, Moves.PetalDance],
    },
  });

  registerSpecies(Species.Ivysaur, {
    dexNumber: 2,
    evolvesInto: [
      {
        species: Species.Venusaur,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Ivysaur',
    category: 'Seed Pokemon',
    height: 1,
    weight: 13,
    family: Families.Bulbasaur,
    evolvesFrom: Species.Bulbasaur,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 62,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbility: Abilities.Chlorophyll,
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        22: [Moves.PoisonPowder],
        30: [Moves.RazorLeaf],
        38: [Moves.Growth],
        46: [Moves.SleepPowder],
        54: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Venusaur, {
    dexNumber: 3,
    name: 'Venusaur',
    category: 'Seed Pokemon',
    height: 2,
    weight: 100,
    family: Families.Bulbasaur,
    evolvesFrom: Species.Ivysaur,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 82,
      [Stats.Defense]: 83,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Overgrow],
    hiddenAbility: Abilities.Chlorophyll,
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed, Moves.VineWhip],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        22: [Moves.PoisonPowder],
        30: [Moves.RazorLeaf],
        43: [Moves.Growth],
        55: [Moves.SleepPowder],
        65: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
