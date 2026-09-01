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
  Moves.Flash,
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
];

export default function registerOddishSpecies(): void {
  registerSpecies(Species.Oddish, {
    dexNumber: 43,
    evolvesInto: [
      {
        species: Species.Gloom,
        method: EvolutionMethod.Level,
        level: 21,
      },
    ],
    name: 'Oddish',
    category: 'Weed Pokemon',
    height: 0.5,
    weight: 5.4,
    family: Families.Oddish,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 50,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        7: [Moves.SweetScent],
        14: [Moves.PoisonPowder],
        16: [Moves.StunSpore],
        18: [Moves.SleepPowder],
        23: [Moves.Acid],
        32: [Moves.Moonlight],
        33: [Moves.PetalDance],
        46: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.SwordsDance, Moves.RazorLeaf, Moves.Flail, Moves.Charm, Moves.Synthesis],
    },
  });

  registerSpecies(Species.Gloom, {
    dexNumber: 44,
    evolvesInto: [
      {
        species: Species.Vileplume,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
      {
        species: Species.Bellossom,
        method: EvolutionMethod.UsedItem,
        item: Items.SunStone,
      },
    ],
    name: 'Gloom',
    category: 'Weed Pokemon',
    height: 0.8,
    weight: 8.6,
    family: Families.Oddish,
    evolvesFrom: Species.Oddish,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 65,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.Stench],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.PoisonPowder, Moves.StunSpore, Moves.SweetScent],
        18: [Moves.SleepPowder],
        24: [Moves.Acid],
        35: [Moves.Moonlight],
        38: [Moves.PetalDance],
        52: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Vileplume, {
    dexNumber: 45,
    name: 'Vileplume',
    category: 'Flower Pokemon',
    height: 1.2,
    weight: 18.6,
    family: Families.Oddish,
    evolvesFrom: Species.Gloom,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 50,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.EffectSpore],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.PoisonPowder, Moves.PetalDance, Moves.StunSpore, Moves.SweetScent],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
