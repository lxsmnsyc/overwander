import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.FireBlast,
  Moves.Swift,
  Moves.Rest,
  Moves.Cut,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
];

// What the two above the base pick up: the machines that ask for a
// grown pokemon to swing them
const GROWN_TEACHABLE = [Moves.Roar, Moves.Strength, Moves.FuryCutter, Moves.RockSmash];

export default function registerCyndaquilSpecies(): void {
  registerSpecies(Species.Cyndaquil, {
    dexNumber: 155,
    evolvesInto: [
      {
        species: Species.Quilava,
        method: EvolutionMethod.Level,
        level: 14,
      },
    ],
    name: 'Cyndaquil',
    category: 'Fire Mouse Pokemon',
    height: 0.5,
    weight: 7.9,
    family: Families.Cyndaquil,
    stats: {
      [Stats.HP]: 39,
      [Stats.Attack]: 52,
      [Stats.Defense]: 43,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.Blaze],
    hiddenAbilities: [Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Leer],
        6: [Moves.SmokeScreen],
        12: [Moves.Ember],
        19: [Moves.QuickAttack],
        27: [Moves.FlameWheel],
        36: [Moves.Swift],
        46: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Thrash, Moves.FurySwipes, Moves.Reversal, Moves.Foresight],
    },
  });

  registerSpecies(Species.Quilava, {
    dexNumber: 156,
    evolvesInto: [
      {
        species: Species.Typhlosion,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Quilava',
    category: 'Volcano Pokemon',
    height: 0.9,
    weight: 19,
    family: Families.Cyndaquil,
    evolvesFrom: Species.Cyndaquil,
    stats: {
      [Stats.HP]: 58,
      [Stats.Attack]: 64,
      [Stats.Defense]: 58,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 80,
    },
    types: [Types.Fire],
    abilities: [Abilities.Blaze],
    hiddenAbilities: [Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Leer, Moves.SmokeScreen],
        12: [Moves.Ember],
        21: [Moves.QuickAttack],
        31: [Moves.FlameWheel],
        42: [Moves.Swift],
        54: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Typhlosion, {
    dexNumber: 157,
    name: 'Typhlosion',
    category: 'Volcano Pokemon',
    height: 1.7,
    weight: 79.5,
    family: Families.Cyndaquil,
    evolvesFrom: Species.Quilava,
    stats: {
      [Stats.HP]: 78,
      [Stats.Attack]: 84,
      [Stats.Defense]: 78,
      [Stats.SpecialAttack]: 109,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 100,
    },
    types: [Types.Fire],
    abilities: [Abilities.Blaze],
    // Flame Body and Berserk are this registry's rather than the
    // mainline's, filling a final evolution to four: the neck vents
    // burn what touches them, and the flames go up when it is cornered
    hiddenAbilities: [Abilities.FlashFire, Abilities.FlameBody, Abilities.Berserk],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Leer, Moves.Ember, Moves.SmokeScreen],
        21: [Moves.QuickAttack],
        31: [Moves.FlameWheel],
        45: [Moves.Swift],
        60: [Moves.Flamethrower],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...GROWN_TEACHABLE,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.FirePunch,
        Moves.ThunderPunch,
        Moves.DynamicPunch,
      ],
    },
  });
}
