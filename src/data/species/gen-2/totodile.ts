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
  Moves.IcePunch,
  Moves.Toxic,
  Moves.Surf,
  Moves.Blizzard,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Cut,
  Moves.Headbutt,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.IcyWind,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
];

// What the two above the base pick up: the machines that ask for a
// grown pokemon to swing them
const GROWN_TEACHABLE = [Moves.Roar, Moves.Strength, Moves.FuryCutter, Moves.RockSmash];

export default function registerTotodileSpecies(): void {
  registerSpecies(Species.Totodile, {
    dexNumber: 158,
    evolvesInto: [
      {
        species: Species.Croconaw,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Totodile',
    category: 'Big Jaw Pokemon',
    height: 0.6,
    weight: 9.5,
    family: Families.Totodile,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 64,
      [Stats.SpecialAttack]: 44,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 43,
    },
    types: [Types.Water],
    abilities: [Abilities.Torrent],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer],
        7: [Moves.Rage],
        13: [Moves.WaterGun],
        20: [Moves.Bite],
        27: [Moves.ScaryFace],
        35: [Moves.Slash],
        43: [Moves.Screech],
        52: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.RazorWind, Moves.Thrash, Moves.RockSlide, Moves.Crunch, Moves.AncientPower],
    },
  });

  registerSpecies(Species.Croconaw, {
    dexNumber: 159,
    evolvesInto: [
      {
        species: Species.Feraligatr,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Croconaw',
    category: 'Big Jaw Pokemon',
    height: 1.1,
    weight: 25,
    family: Families.Totodile,
    evolvesFrom: Species.Totodile,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 80,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 59,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 58,
    },
    types: [Types.Water],
    abilities: [Abilities.Torrent],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer, Moves.Rage],
        13: [Moves.WaterGun],
        21: [Moves.Bite],
        28: [Moves.ScaryFace],
        37: [Moves.Slash],
        45: [Moves.Screech],
        55: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Feraligatr, {
    dexNumber: 160,
    name: 'Feraligatr',
    category: 'Big Jaw Pokemon',
    height: 2.3,
    weight: 88.8,
    family: Families.Totodile,
    evolvesFrom: Species.Croconaw,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 105,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 79,
      [Stats.SpecialDefense]: 83,
      [Stats.Speed]: 78,
    },
    types: [Types.Water],
    abilities: [Abilities.Torrent],
    // Strong Jaw and Moxie are this registry's rather than the
    // mainline's, filling a final evolution to four: Bite, Crunch and
    // Screech are what the Big Jaw Pokemon has always fought with, and
    // 105 Attack is what it fights with once something falls
    hiddenAbilities: [Abilities.SheerForce, Abilities.StrongJaw, Abilities.Moxie],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer, Moves.WaterGun, Moves.Rage],
        21: [Moves.Bite],
        28: [Moves.ScaryFace],
        38: [Moves.Slash],
        47: [Moves.Screech],
        58: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE, Moves.HyperBeam, Moves.Earthquake],
    },
  });
}
