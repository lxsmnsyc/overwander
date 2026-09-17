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
  Moves.AerialAce,
  Moves.AquaTail,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.Captivate,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.Flash,
  Moves.Fling,
  Moves.Frustration,
  Moves.FuryCutter,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snore,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.XScissor,
];

/**
 * The one that waits under the sand: a Skorupi holds still until
 * something walks over it, and a Drapion holds whatever it caught
 */
export default function registerSkorupiSpecies(): void {
  registerSpecies(Species.Skorupi, {
    dexNumber: 451,
    evolvesInto: [
      {
        species: Species.Drapion,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Skorupi',
    category: 'Scorpion Pokemon',
    height: 0.8,
    weight: 12.0,
    family: Families.Skorupi,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 50,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 65,
    },
    types: [Types.Poison, Types.Bug],
    abilities: [Abilities.BattleArmor, Abilities.Sniper],
    hiddenAbilities: [Abilities.KeenEye],
    eggGroups: [EggGroups.Bug, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Desert, Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer, Moves.PoisonSting],
        6: [Moves.KnockOff],
        12: [Moves.PinMissile],
        17: [Moves.Acupressure],
        23: [Moves.ScaryFace],
        28: [Moves.ToxicSpikes],
        34: [Moves.BugBite],
        39: [Moves.PoisonFang],
        45: [Moves.Crunch],
        50: [Moves.CrossPoison],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Agility,
        Moves.ConfuseRay,
        Moves.FeintAttack,
        Moves.NightSlash,
        Moves.Pursuit,
        Moves.SandAttack,
        Moves.Screech,
        Moves.Slash,
        Moves.Whirlwind,
      ],
    },
  });
  registerSpecies(Species.Drapion, {
    dexNumber: 452,
    name: 'Drapion',
    category: 'Ogre Scorpion Pokemon',
    height: 1.3,
    weight: 61.5,
    family: Families.Skorupi,
    evolvesFrom: Species.Skorupi,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 90,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 95,
    },
    types: [Types.Poison, Types.Dark],
    abilities: [Abilities.BattleArmor, Abilities.Sniper],
    // Merciless is this registry's rather than the mainline's: the
    // sting is what the pincers are waiting on, and Sniper already
    // says what a critical is worth to this line
    hiddenAbilities: [Abilities.KeenEye, Abilities.Merciless],
    eggGroups: [EggGroups.Bug, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Desert, Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Bite,
          Moves.FireFang,
          Moves.IceFang,
          Moves.KnockOff,
          Moves.Leer,
          Moves.PoisonSting,
          Moves.ThunderFang,
        ],
        6: [Moves.KnockOff],
        12: [Moves.PinMissile],
        17: [Moves.Acupressure],
        23: [Moves.ScaryFace],
        28: [Moves.ToxicSpikes],
        34: [Moves.BugBite],
        39: [Moves.PoisonFang],
        49: [Moves.Crunch],
        58: [Moves.CrossPoison],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Roar,
        Moves.RockClimb,
        Moves.RockSlide,
      ],
    },
  });
}
