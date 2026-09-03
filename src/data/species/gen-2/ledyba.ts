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
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.SolarBeam,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Swift,
  Moves.Flash,
  Moves.Rest,
  Moves.Headbutt,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.SweetScent,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.AerialAce,
  Moves.BrickBreak,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.MegaPunch,
  Moves.Mimic,
  Moves.SecretPower,
  Moves.Substitute,
  Moves.SwordsDance,
];

export default function registerLedybaSpecies(): void {
  registerSpecies(Species.Ledyba, {
    dexNumber: 165,
    evolvesInto: [
      {
        species: Species.Ledian,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Ledyba',
    category: 'Five Star Pokemon',
    height: 1,
    weight: 10.8,
    family: Families.Ledyba,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 20,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 55,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Swarm, Abilities.EarlyBird],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        8: [Moves.Supersonic],
        15: [Moves.CometPunch],
        22: [Moves.LightScreen, Moves.Reflect, Moves.Safeguard],
        29: [Moves.BatonPass],
        36: [Moves.Swift],
        43: [Moves.Agility],
        50: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Psybeam, Moves.Bide, Moves.SilverWind],
    },
  });

  registerSpecies(Species.Ledian, {
    dexNumber: 166,
    name: 'Ledian',
    category: 'Five Star Pokemon',
    height: 1.4,
    weight: 35.6,
    family: Families.Ledyba,
    evolvesFrom: Species.Ledyba,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 35,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 85,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Swarm, Abilities.EarlyBird],
    // The one of these four already carrying its fourth: Iron Fist is
    // its own, and Ledyba's Rattled walks up the line to meet it
    hiddenAbilities: [Abilities.IronFist],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Supersonic],
        15: [Moves.CometPunch],
        24: [Moves.LightScreen, Moves.Reflect, Moves.Safeguard],
        33: [Moves.BatonPass],
        42: [Moves.Swift],
        51: [Moves.Agility],
        60: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
