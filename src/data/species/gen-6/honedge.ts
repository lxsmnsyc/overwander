import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.AfterYou,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.Confide,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Spite,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Toxic,
];

// The level-up moves the sword keeps through every shape
const FAMILY_LEVEL = {
  1: [Moves.SwordsDance, Moves.Tackle],
  5: [Moves.FuryCutter],
  8: [Moves.MetalSound],
  13: [Moves.Pursuit],
  18: [Moves.Autotomize],
  20: [Moves.ShadowSneak],
  22: [Moves.AerialAce],
  26: [Moves.Retaliate],
  29: [Moves.Slash],
  32: [Moves.IronDefense],
};

// Ruins and bare rock, where a sword is left lying
const FAMILY_BIOMES = [Biome.Badlands, Biome.Mountain];

// What the royal sword carries whichever way round it is standing
const AEGISLASH_SHARED = {
  dexNumber: 681,
  category: 'Royal Sword Pokemon',
  height: 1.7,
  weight: 53.0,
  family: Families.Honedge,
  evolvesFrom: Species.Doublade,
  types: [Types.Steel, Types.Ghost],
  eggGroups: [EggGroups.Mineral],
  genderRatio: [1, 1] as [number, number],
  catchRate: 45,
  learnSet: {
    level: {
      1: [
        Moves.SwordsDance,
        Moves.Slash,
        Moves.FuryCutter,
        Moves.Pursuit,
        Moves.AerialAce,
        Moves.IronDefense,
        Moves.PowerTrick,
        Moves.NightSlash,
        Moves.ShadowSneak,
        Moves.IronHead,
        Moves.HeadSmash,
        Moves.Autotomize,
        Moves.SacredSword,
        Moves.KingsShield,
      ],
    },
    teachable: [
      ...FAMILY_TEACHABLE,
      Moves.Block,
      Moves.GigaImpact,
      Moves.HyperBeam,
      Moves.Round,
      Moves.ShadowBall,
      Moves.SunnyDay,
    ],
  },
};

/**
 * The haunted sword. It is drawn as a shield until it swings, and
 * Stance Change is what turns it over mid-fight
 */
export default function registerHonedgeSpecies(): void {
  registerSpecies(Species.Honedge, {
    dexNumber: 679,
    evolvesInto: [
      {
        species: Species.Doublade,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Honedge',
    category: 'Sword Pokemon',
    height: 0.8,
    weight: 2.0,
    family: Families.Honedge,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 80,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 37,
      [Stats.Speed]: 28,
    },
    types: [Types.Steel, Types.Ghost],
    abilities: [Abilities.NoGuard],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 180,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        35: [Moves.NightSlash],
        39: [Moves.PowerTrick],
        42: [Moves.IronHead],
        47: [Moves.SacredSword],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.DestinyBond, Moves.MetalSound, Moves.ShadowSneak, Moves.WideGuard],
    },
  });
  registerSpecies(Species.Doublade, {
    dexNumber: 680,
    evolvesInto: [
      {
        species: Species.Aegislash,
        method: EvolutionMethod.UsedItem,
        item: Items.DuskStone,
      },
    ],
    name: 'Doublade',
    category: 'Sword Pokemon',
    height: 0.8,
    weight: 4.5,
    family: Families.Honedge,
    evolvesFrom: Species.Honedge,
    stats: {
      [Stats.HP]: 59,
      [Stats.Attack]: 110,
      [Stats.Defense]: 150,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 49,
      [Stats.Speed]: 35,
    },
    types: [Types.Steel, Types.Ghost],
    abilities: [Abilities.NoGuard],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        36: [Moves.NightSlash],
        41: [Moves.PowerTrick],
        45: [Moves.IronHead],
        51: [Moves.SacredSword],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Aegislash, {
    ...AEGISLASH_SHARED,
    name: 'Aegislash',
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 140,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 140,
      [Stats.Speed]: 60,
    },
    abilities: [Abilities.StanceChange],
    // Cursed Body, Clear Body and Justified are this line's invented
    // fillers: the mainline gives Aegislash the stance and nothing else
    hiddenAbilities: [Abilities.CursedBody, Abilities.ClearBody, Abilities.Justified],
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
  });
  registerSpecies(Species.AegislashBlade, {
    ...AEGISLASH_SHARED,
    name: 'Aegislash Blade',
    // Drawing the sword puts everything behind the edge and nothing
    // behind the shield
    baseForm: false,
    // A shape it only ever takes mid-fight, so nothing meets one
    biomes: [],
    activeTimes: AnyTimeOfDay,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 150,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 150,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 60,
    },
    abilities: [Abilities.StanceChange],
    hiddenAbilities: [Abilities.CursedBody, Abilities.ClearBody, Abilities.Justified],
  });
}
