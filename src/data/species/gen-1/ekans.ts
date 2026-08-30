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
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Strength,
  Moves.Headbutt,
  Moves.Thief,
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
  Moves.HiddenPower,
  Moves.SunnyDay,
];

export default function registerEkansSpecies(): void {
  registerSpecies(Species.Ekans, {
    dexNumber: 23,
    evolvesInto: [
      {
        species: Species.Arbok,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Ekans',
    category: 'Snake Pokemon',
    height: 2,
    weight: 6.9,
    family: Families.Ekans,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 60,
      [Stats.Defense]: 44,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 54,
      [Stats.Speed]: 55,
    },
    types: [Types.Poison],
    abilities: [Abilities.Intimidate, Abilities.ShedSkin],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Field, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer],
        9: [Moves.PoisonSting],
        15: [Moves.Bite],
        23: [Moves.Glare],
        29: [Moves.Screech],
        37: [Moves.Acid],
        43: [Moves.Haze],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Slam, Moves.Spite, Moves.Pursuit, Moves.Crunch, Moves.BeatUp],
    },
  });

  registerSpecies(Species.Arbok, {
    dexNumber: 24,
    name: 'Arbok',
    category: 'Cobra Pokemon',
    height: 3.5,
    weight: 65,
    family: Families.Ekans,
    evolvesFrom: Species.Ekans,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 95,
      [Stats.Defense]: 69,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 79,
      [Stats.Speed]: 80,
    },
    types: [Types.Poison],
    abilities: [Abilities.Intimidate, Abilities.ShedSkin],
    hiddenAbilities: [Abilities.Unnerve, Abilities.PoisonTouch],
    eggGroups: [EggGroups.Field, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer, Moves.PoisonSting, Moves.Bite],
        25: [Moves.Glare],
        33: [Moves.Screech],
        43: [Moves.Acid],
        51: [Moves.Haze],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
