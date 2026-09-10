import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AncientPower,
  Moves.Attract,
  Moves.Blizzard,
  Moves.Captivate,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.IronTail,
  Moves.MagnetRise,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Thunder,
  Moves.Thunderbolt,
  Moves.Torment,
  Moves.Toxic,
];

/**
 * Sinnoh's armor fossil, and the other answer to the same question:
 * the face is a wall, and everything behind it is spent holding
 */
export default function registerShieldonSpecies(): void {
  registerSpecies(Species.Shieldon, {
    dexNumber: 410,
    evolvesInto: [
      {
        species: Species.Bastiodon,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Shieldon',
    category: 'Shield Pokemon',
    height: 0.5,
    weight: 57.0,
    family: Families.Shieldon,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 42,
      [Stats.Defense]: 118,
      [Stats.SpecialAttack]: 42,
      [Stats.SpecialDefense]: 88,
      [Stats.Speed]: 30,
    },
    types: [Types.Rock, Types.Steel],
    abilities: [Abilities.Sturdy],
    hiddenAbilities: [Abilities.Soundproof],
    eggGroups: [EggGroups.Monster],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Protect, Moves.Tackle],
        6: [Moves.Taunt],
        10: [Moves.MetalSound],
        15: [Moves.TakeDown],
        19: [Moves.IronDefense],
        24: [Moves.Swagger],
        28: [Moves.AncientPower],
        33: [Moves.Endure],
        37: [Moves.MetalBurst],
        43: [Moves.IronHead],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BodySlam,
        Moves.Counter,
        Moves.Curse,
        Moves.DoubleEdge,
        Moves.Fissure,
        Moves.FocusEnergy,
        Moves.Headbutt,
        Moves.RockBlast,
        Moves.ScaryFace,
        Moves.Screech,
      ],
    },
  });
  registerSpecies(Species.Bastiodon, {
    dexNumber: 411,
    name: 'Bastiodon',
    category: 'Shield Pokemon',
    height: 1.3,
    weight: 149.5,
    family: Families.Shieldon,
    evolvesFrom: Species.Shieldon,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 52,
      [Stats.Defense]: 168,
      [Stats.SpecialAttack]: 47,
      [Stats.SpecialDefense]: 138,
      [Stats.Speed]: 30,
    },
    types: [Types.Rock, Types.Steel],
    abilities: [Abilities.Sturdy],
    // Filter and Heavy Metal are this registry's rather than the
    // mainline's: the wall answers the 4x it is built against, and
    // what holds a line that hard is what it weighs
    hiddenAbilities: [Abilities.Soundproof, Abilities.Filter, Abilities.HeavyMetal],
    eggGroups: [EggGroups.Monster],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MetalSound, Moves.Protect, Moves.Tackle, Moves.Taunt],
        6: [Moves.Taunt],
        10: [Moves.MetalSound],
        15: [Moves.TakeDown],
        19: [Moves.IronDefense],
        24: [Moves.Swagger],
        28: [Moves.AncientPower],
        30: [Moves.Block],
        36: [Moves.Endure],
        43: [Moves.MetalBurst],
        52: [Moves.IronHead],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Avalanche,
        Moves.Block,
        Moves.GigaImpact,
        Moves.Headbutt,
        Moves.HyperBeam,
        Moves.MagicCoat,
        Moves.Outrage,
      ],
    },
  });
}
