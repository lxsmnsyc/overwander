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

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.Attract,
  Moves.BugBite,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.DoubleTeam,
  Moves.Electroweb,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.VoltSwitch,
  Moves.WildCharge,
  Moves.XScissor,
];

export default function registerGrubbinSpecies(): void {
  registerSpecies(Species.Grubbin, {
    dexNumber: 736,
    evolvesInto: [{ species: Species.Charjabug, method: EvolutionMethod.Level, level: 20 }],
    name: 'Grubbin',
    category: 'Larva Pokemon',
    height: 0.4,
    weight: 4.4,
    family: Families.Grubbin,
    stats: {
      [Stats.HP]: 47,
      [Stats.Attack]: 62,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 46,
    },
    types: [Types.Bug],
    abilities: [Abilities.Swarm],
    eggGroups: [EggGroups.Bug],
    genderRatio: [4, 4],
    catchRate: 255,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.ViceGrip],
        4: [Moves.StringShot],
        7: [Moves.MudSlap],
        10: [Moves.Bite],
        13: [Moves.BugBite],
        16: [Moves.Spark],
        19: [Moves.Acrobatics],
        22: [Moves.Crunch],
        25: [Moves.XScissor],
        28: [Moves.Dig],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Electroweb, Moves.Endure, Moves.Harden, Moves.MudShot],
    },
  });
  registerSpecies(Species.Charjabug, {
    dexNumber: 737,
    // A Thunder Stone rather than a magnetic field, the way Magneton and
    // Nosepass ask for one: nowhere here is a place with a field in it
    evolvesInto: [
      { species: Species.Vikavolt, method: EvolutionMethod.UsedItem, item: Items.ThunderStone },
    ],
    name: 'Charjabug',
    category: 'Battery Pokemon',
    height: 0.5,
    weight: 10.5,
    family: Families.Grubbin,
    evolvesFrom: Species.Grubbin,
    stats: {
      [Stats.HP]: 57,
      [Stats.Attack]: 82,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 36,
    },
    types: [Types.Bug, Types.Electric],
    abilities: [Abilities.Battery],
    eggGroups: [EggGroups.Bug],
    genderRatio: [4, 4],
    catchRate: 120,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Charge, Moves.MudSlap, Moves.StringShot, Moves.ViceGrip],
        13: [Moves.BugBite],
        16: [Moves.Spark],
        19: [Moves.Acrobatics],
        25: [Moves.Crunch],
        31: [Moves.XScissor],
        37: [Moves.Dig],
        43: [Moves.Discharge],
        49: [Moves.IronDefense],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.IronDefense],
    },
  });
  registerSpecies(Species.Vikavolt, {
    dexNumber: 738,
    name: 'Vikavolt',
    category: 'Stag Beetle Pokemon',
    height: 1.5,
    weight: 45,
    family: Families.Grubbin,
    evolvesFrom: Species.Charjabug,
    stats: {
      [Stats.HP]: 77,
      [Stats.Attack]: 70,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 145,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 43,
    },
    types: [Types.Bug, Types.Electric],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [Abilities.CompoundEyes],
    eggGroups: [EggGroups.Bug],
    genderRatio: [4, 4],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.AirSlash,
          Moves.Bite,
          Moves.Charge,
          Moves.MudSlap,
          Moves.StringShot,
          Moves.Thunderbolt,
          Moves.ViceGrip,
        ],
        13: [Moves.BugBite],
        16: [Moves.Spark],
        19: [Moves.Acrobatics],
        25: [Moves.Guillotine],
        31: [Moves.BugBuzz],
        37: [Moves.Dig],
        41: [Moves.ZapCannon],
        49: [Moves.Agility],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.EnergyBall,
        Moves.FlashCannon,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronDefense,
        Moves.LaserFocus,
        Moves.Roost,
        Moves.SignalBeam,
        Moves.SkyDrop,
        Moves.SolarBeam,
        Moves.Thunder,
      ],
    },
  });
}
