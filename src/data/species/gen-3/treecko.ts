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
  Moves.FocusPunch,
  Moves.Toxic,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.IronTail,
  Moves.Return,
  Moves.Dig,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.Strength,
  Moves.Flash,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.SwordsDance,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.ThunderPunch,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerTreeckoSpecies(): void {
  registerSpecies(Species.Treecko, {
    dexNumber: 252,
    evolvesInto: [
      {
        species: Species.Grovyle,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Treecko',
    category: 'Wood Gecko Pokemon',
    height: 0.5,
    weight: 5,
    family: Families.Treecko,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 70,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.Unburden],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer],
        6: [Moves.Absorb],
        11: [Moves.QuickAttack],
        16: [Moves.Pursuit],
        21: [Moves.Screech],
        26: [Moves.MegaDrain],
        31: [Moves.Agility],
        36: [Moves.Slam],
        41: [Moves.Detect],
        46: [Moves.GigaDrain],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.LeechSeed,
        Moves.Crunch,
        Moves.MudSport,
        Moves.DragonBreath,
        Moves.Endeavor,
        Moves.CrushClaw,
      ],
    },
  });

  registerSpecies(Species.Grovyle, {
    dexNumber: 253,
    evolvesInto: [
      {
        species: Species.Sceptile,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Grovyle',
    category: 'Wood Gecko Pokemon',
    height: 0.9,
    weight: 21.6,
    family: Families.Treecko,
    evolvesFrom: Species.Treecko,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 95,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.Unburden],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer, Moves.Absorb, Moves.QuickAttack],
        16: [Moves.FuryCutter],
        17: [Moves.Pursuit],
        23: [Moves.Screech],
        29: [Moves.LeafBlade],
        35: [Moves.Agility],
        41: [Moves.Slam],
        47: [Moves.Detect],
        53: [Moves.FalseSwipe],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Sceptile, {
    dexNumber: 254,
    name: 'Sceptile',
    category: 'Forest Pokemon',
    height: 1.7,
    weight: 52.2,
    family: Families.Treecko,
    evolvesFrom: Species.Grovyle,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 85,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 120,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    // Chlorophyll and Leaf Guard are this registry's rather than the
    // mainline's: the line's own machines are Sunny Day and Solar
    // Beam, and a final evolution is filled to four
    hiddenAbilities: [Abilities.Unburden, Abilities.Chlorophyll, Abilities.LeafGuard],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer, Moves.Absorb, Moves.QuickAttack],
        16: [Moves.FuryCutter],
        17: [Moves.Pursuit],
        23: [Moves.Screech],
        29: [Moves.LeafBlade],
        35: [Moves.Agility],
        43: [Moves.Slam],
        51: [Moves.Detect],
        59: [Moves.FalseSwipe],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DragonClaw,
        Moves.Roar,
        Moves.HyperBeam,
        Moves.Earthquake,
      ],
    },
  });
}
