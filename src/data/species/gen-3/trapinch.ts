import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.HyperBeam,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Earthquake,
  Moves.Return,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Sandstorm,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Strength,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
];

// What the two above the base pick up: a pit in the sand has no
// wings, and the two that fly do
const GROWN_TEACHABLE = [Moves.Fly, Moves.SteelWing, Moves.Swift];

export default function registerTrapinchSpecies(): void {
  registerSpecies(Species.Trapinch, {
    dexNumber: 328,
    evolvesInto: [
      {
        species: Species.Vibrava,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Trapinch',
    category: 'Ant Pit Pokemon',
    height: 0.7,
    weight: 15,
    family: Families.Trapinch,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 100,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 10,
    },
    types: [Types.Ground],
    abilities: [Abilities.HyperCutter, Abilities.ArenaTrap],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Bug, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite],
        9: [Moves.SandAttack],
        17: [Moves.FeintAttack],
        25: [Moves.SandTomb],
        33: [Moves.Crunch],
        41: [Moves.Dig],
        49: [Moves.Sandstorm],
        57: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.FocusEnergy, Moves.QuickAttack, Moves.Gust],
    },
  });

  registerSpecies(Species.Vibrava, {
    dexNumber: 329,
    evolvesInto: [
      {
        species: Species.Flygon,
        method: EvolutionMethod.Level,
        level: 45,
      },
    ],
    name: 'Vibrava',
    category: 'Vibration Pokemon',
    height: 1.1,
    weight: 15.3,
    family: Families.Trapinch,
    evolvesFrom: Species.Trapinch,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 70,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 70,
    },
    types: [Types.Ground, Types.Dragon],
    abilities: [Abilities.Levitate],
    eggGroups: [EggGroups.Bug, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.SandAttack, Moves.FeintAttack, Moves.SandTomb],
        33: [Moves.Crunch],
        35: [Moves.DragonBreath],
        41: [Moves.Screech],
        49: [Moves.Sandstorm],
        57: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Flygon, {
    dexNumber: 330,
    name: 'Flygon',
    category: 'Mystic Pokemon',
    height: 2,
    weight: 82,
    family: Families.Trapinch,
    evolvesFrom: Species.Vibrava,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 100,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 100,
    },
    types: [Types.Ground, Types.Dragon],
    abilities: [Abilities.Levitate],
    eggGroups: [EggGroups.Bug, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.SandAttack, Moves.FeintAttack, Moves.SandTomb],
        33: [Moves.Crunch],
        35: [Moves.DragonBreath],
        41: [Moves.Screech],
        53: [Moves.Sandstorm],
        65: [Moves.HyperBeam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...GROWN_TEACHABLE,
        Moves.DragonClaw,
        Moves.Flamethrower,
        Moves.FireBlast,
        Moves.IronTail,
        Moves.FuryCutter,
        Moves.FirePunch,
      ],
    },
  });
}
