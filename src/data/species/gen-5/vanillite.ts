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
  Moves.AllySwitch,
  Moves.Attract,
  Moves.Avalanche,
  Moves.Blizzard,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Explosion,
  Moves.Facade,
  Moves.FlashCannon,
  Moves.FrostBreath,
  Moves.Frustration,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.HyperVoice,
  Moves.IceBeam,
  Moves.IcicleSpear,
  Moves.IcyWind,
  Moves.Imprison,
  Moves.IronDefense,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.SecretPower,
  Moves.SelfDestruct,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WaterPulse,
];

// What the snow works out how to do, at whichever size
const FAMILY_LEVEL = {
  12: [Moves.IcyWind],
  16: [Moves.Avalanche],
  20: [Moves.Hail],
  26: [Moves.MirrorShot],
  31: [Moves.AcidArmor],
};

/**
 * The snow: a Vanillite is made out of an icicle that froze in the
 * morning, and a Vanilluxe has two heads that breathe the weather it
 * arrives in
 */
export default function registerVanilliteSpecies(): void {
  registerSpecies(Species.Vanillite, {
    dexNumber: 582,
    evolvesInto: [
      {
        species: Species.Vanillish,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Vanillite',
    category: 'Fresh Snow Pokemon',
    height: 0.4,
    weight: 5.7,
    family: Families.Vanillite,
    stats: {
      [Stats.HP]: 36,
      [Stats.Attack]: 50,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 44,
    },
    types: [Types.Ice],
    abilities: [Abilities.IceBody, Abilities.SnowCloak],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Tundra, Biome.Glacier],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Harden, Moves.Astonish, Moves.IcicleSpear],
        4: [Moves.Taunt],
        8: [Moves.Mist],
        10: [Moves.Uproar],
        ...FAMILY_LEVEL,
        35: [Moves.IceBeam],
        36: [Moves.MirrorCoat],
        44: [Moves.Blizzard],
        48: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Autotomize,
        Moves.Explosion,
        Moves.IceShard,
        Moves.IcicleCrash,
        Moves.Imprison,
        Moves.IronDefense,
        Moves.MagnetRise,
        Moves.NaturalGift,
        Moves.PowderSnow,
        Moves.WaterPulse,
      ],
    },
  });
  registerSpecies(Species.Vanillish, {
    dexNumber: 583,
    evolvesInto: [
      {
        species: Species.Vanilluxe,
        method: EvolutionMethod.Level,
        level: 47,
      },
    ],
    name: 'Vanillish',
    category: 'Icy Snow Pokemon',
    height: 1.1,
    weight: 41,
    family: Families.Vanillite,
    evolvesFrom: Species.Vanillite,
    stats: {
      [Stats.HP]: 51,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 59,
    },
    types: [Types.Ice],
    abilities: [Abilities.IceBody, Abilities.SnowCloak],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Tundra, Biome.Glacier],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Mist, Moves.Harden, Moves.Uproar, Moves.Taunt, Moves.Astonish, Moves.IcicleSpear],
        ...FAMILY_LEVEL,
        36: [Moves.IceBeam],
        38: [Moves.MirrorCoat],
        50: [Moves.Blizzard],
        56: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Vanilluxe, {
    dexNumber: 584,
    name: 'Vanilluxe',
    category: 'Snowstorm Pokemon',
    height: 1.3,
    weight: 57.5,
    family: Families.Vanillite,
    evolvesFrom: Species.Vanillish,
    stats: {
      [Stats.HP]: 71,
      [Stats.Attack]: 95,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 79,
    },
    types: [Types.Ice],
    // Snow Cloak walks up from the two stages below, so the line
    // reaches four without an invention
    abilities: [Abilities.IceBody, Abilities.SnowWarning],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Tundra, Biome.Glacier],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Mist, Moves.Harden, Moves.Uproar, Moves.Taunt, Moves.Astonish, Moves.IcicleSpear],
        ...FAMILY_LEVEL,
        36: [Moves.IceBeam],
        38: [Moves.MirrorCoat],
        50: [Moves.Blizzard],
        56: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
