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
  Moves.DreamEater,
  Moves.Flash,
  Moves.Thief,
  Moves.Nightmare,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.PsychUp,
];

const FAMILY_ABILITIES = [Abilities.Chlorophyll];

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
    height: 0.4,
    weight: 2.5,
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
    hiddenAbilities: [Abilities.Harvest],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Barrage, Moves.Hypnosis],
        7: [Moves.Reflect],
        13: [Moves.LeechSeed],
        19: [Moves.Confusion],
        25: [Moves.StunSpore],
        31: [Moves.PoisonPowder],
        37: [Moves.SleepPowder],
        42: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Strength],
      egg: [Moves.Reflect, Moves.MegaDrain, Moves.Synthesis, Moves.Moonlight, Moves.AncientPower],
    },
  });

  registerSpecies(Species.Exeggutor, {
    dexNumber: 103,
    name: 'Exeggutor',
    category: 'Coconut Pokemon',
    height: 2,
    weight: 120,
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
    hiddenAbilities: [Abilities.Harvest, Abilities.SolarPower, Abilities.Forewarn],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Barrage, Moves.Hypnosis, Moves.Confusion],
        19: [Moves.Stomp],
        31: [Moves.EggBomb],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength, Moves.Headbutt],
    },
  });
}
