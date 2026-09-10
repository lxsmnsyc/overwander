import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.Captivate,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Toxic,
  Moves.WaterPulse,
];

/**
 * The desert's own weather: a Hippopotas carries sand in its hide and
 * shakes it out, and a Hippowdon never stops shaking it out
 */
export default function registerHippopotasSpecies(): void {
  registerSpecies(Species.Hippopotas, {
    dexNumber: 449,
    evolvesInto: [
      {
        species: Species.Hippowdon,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Hippopotas',
    category: 'Hippo Pokemon',
    height: 0.8,
    weight: 49.5,
    family: Families.Hippopotas,
    stats: {
      [Stats.HP]: 68,
      [Stats.Attack]: 72,
      [Stats.Defense]: 78,
      [Stats.SpecialAttack]: 38,
      [Stats.SpecialDefense]: 42,
      [Stats.Speed]: 32,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandStream],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 140,
    biomes: [Biome.Desert, Biome.Badlands, Biome.Savanna],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.SandAttack, Moves.Tackle],
        7: [Moves.Bite],
        13: [Moves.Yawn],
        19: [Moves.TakeDown],
        25: [Moves.SandTomb],
        31: [Moves.Crunch],
        37: [Moves.Earthquake],
        44: [Moves.DoubleEdge],
        50: [Moves.Fissure],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BodySlam,
        Moves.Curse,
        Moves.SandTomb,
        Moves.SlackOff,
        Moves.SpitUp,
        Moves.Stockpile,
        Moves.Swallow,
      ],
    },
  });
  registerSpecies(Species.Hippowdon, {
    dexNumber: 450,
    name: 'Hippowdon',
    category: 'Heavyweight Pokemon',
    height: 2.0,
    weight: 300.0,
    family: Families.Hippopotas,
    evolvesFrom: Species.Hippopotas,
    stats: {
      [Stats.HP]: 108,
      [Stats.Attack]: 112,
      [Stats.Defense]: 118,
      [Stats.SpecialAttack]: 68,
      [Stats.SpecialDefense]: 72,
      [Stats.Speed]: 47,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandStream],
    // Thick Fat and Solid Rock are this registry's rather than the
    // mainline's: the line has two abilities and needs four, and a hide
    // packed with fat and sand is what it is made of
    hiddenAbilities: [Abilities.SandForce, Abilities.ThickFat, Abilities.SolidRock],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Desert, Biome.Badlands, Biome.Savanna],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Bite,
          Moves.FireFang,
          Moves.IceFang,
          Moves.SandAttack,
          Moves.Tackle,
          Moves.ThunderFang,
          Moves.Yawn,
        ],
        7: [Moves.Bite],
        13: [Moves.Yawn],
        19: [Moves.TakeDown],
        25: [Moves.SandTomb],
        31: [Moves.Crunch],
        40: [Moves.Earthquake],
        50: [Moves.DoubleEdge],
        60: [Moves.Fissure],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.StoneEdge,
      ],
    },
  });
}
