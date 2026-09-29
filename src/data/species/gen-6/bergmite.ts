import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.AfterYou,
  Moves.Attract,
  Moves.Avalanche,
  Moves.Blizzard,
  Moves.BodySlam,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.Crunch,
  Moves.Curse,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.FrostBreath,
  Moves.Frustration,
  Moves.GyroBall,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IceFang,
  Moves.IcicleSpear,
  Moves.IcyWind,
  Moves.IronDefense,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Toxic,
  Moves.WaterPulse,
];

// The ice both shapes grind across
const FAMILY_BIOMES = [Biome.Glacier, Biome.AlpineTundra];

// What the ice knows at either size
const FAMILY_LEVEL = {
  9: [Moves.Curse],
  10: [Moves.IcyWind],
  15: [Moves.Protect, Moves.TakeDown],
  18: [Moves.Avalanche],
  20: [Moves.Sharpen],
  24: [Moves.IceFang],
  30: [Moves.IceBall, Moves.Recover],
};

/**
 * The ice that grows a body. An Avalugg is a floe with a head on it,
 * and the wall it carries is what it hits with rather than anything
 * it swings
 */
export default function registerBergmiteSpecies(): void {
  registerSpecies(Species.Bergmite, {
    dexNumber: 712,
    evolvesInto: [
      {
        species: Species.Avalugg,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Bergmite',
    category: 'Ice Chunk Pokemon',
    height: 1.0,
    weight: 99.5,
    family: Families.Bergmite,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 69,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 32,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 28,
    },
    types: [Types.Ice],
    abilities: [Abilities.OwnTempo, Abilities.IceBody],
    hiddenAbilities: [Abilities.Sturdy],
    eggGroups: [EggGroups.Monster, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Harden, Moves.Bite, Moves.RapidSpin],
        5: [Moves.PowderSnow],
        ...FAMILY_LEVEL,
        9: [Moves.Curse, Moves.IceShard],
        21: [Moves.IronDefense],
        29: [Moves.Crunch],
        37: [Moves.Blizzard],
        42: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Barrier, Moves.MirrorCoat, Moves.Mist, Moves.Recover],
    },
  });
  registerSpecies(Species.Avalugg, {
    dexNumber: 713,
    name: 'Avalugg',
    category: 'Iceberg Pokemon',
    height: 2.0,
    weight: 505.0,
    family: Families.Bergmite,
    evolvesFrom: Species.Bergmite,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 117,
      [Stats.Defense]: 184,
      [Stats.SpecialAttack]: 44,
      [Stats.SpecialDefense]: 46,
      [Stats.Speed]: 28,
    },
    types: [Types.Ice],
    abilities: [Abilities.OwnTempo, Abilities.IceBody],
    // Snow Warning is this line's invented filler: the mainline gives
    // the floe Own Tempo, Ice Body and Sturdy, and Hisuian Avalugg's
    // Strong Jaw belongs to that form rather than to this one
    hiddenAbilities: [Abilities.Sturdy, Abilities.SnowWarning],
    eggGroups: [EggGroups.Monster, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 55,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Harden,
          Moves.Bite,
          Moves.RapidSpin,
          Moves.PowderSnow,
          Moves.Crunch,
          Moves.IronDefense,
          Moves.SkullBash,
          Moves.WideGuard,
          Moves.BodySlam,
        ],
        ...FAMILY_LEVEL,
        41: [Moves.Blizzard],
        46: [Moves.DoubleEdge],
        51: [Moves.IcicleCrash],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Block,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.HeavySlam,
        Moves.HydroPump,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.Roar,
        Moves.ScaryFace,
        Moves.Superpower,
      ],
    },
  });
}
