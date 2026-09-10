import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The three that were made when the world was: one to know, one to
 * feel, one to decide. They are built to the same plan, three tiny
 * bodies with the same nine moves at the same nine levels, and only
 * the mind inside each of them differs
 */

// TM and tutor moves all three share
const LAKE_TEACHABLE = [
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FirePunch,
  Moves.Flash,
  Moves.Fling,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IcePunch,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LightScreen,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Thunder,
  Moves.ThunderPunch,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.UTurn,
  Moves.WaterPulse,
  Moves.ZenHeadbutt,
];

export default function registerLakeTrioSpecies(): void {
  registerSpecies(Species.Uxie, {
    dexNumber: 480,
    name: 'Uxie',
    category: 'Knowledge Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Uxie,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 75,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 130,
      [Stats.Speed]: 95,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    // Levitate is all the mainline gives it, so the other three
    // are this registry's, each of them the thing it stands for
    hiddenAbilities: [Abilities.Anticipation, Abilities.Frisk, Abilities.Forewarn],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Rest],
        6: [Moves.Imprison],
        16: [Moves.Endure],
        21: [Moves.Swift],
        31: [Moves.Yawn],
        36: [Moves.FutureSight],
        46: [Moves.Amnesia],
        51: [Moves.Extrasensory],
        61: [Moves.Flail],
        66: [Moves.NaturalGift],
        76: [Moves.Memento],
      },
      teachable: [...LAKE_TEACHABLE, Moves.GigaDrain, Moves.SolarBeam],
    },
  });
  registerSpecies(Species.Mesprit, {
    dexNumber: 481,
    name: 'Mesprit',
    category: 'Emotion Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Mesprit,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 105,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 80,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    // Levitate is all the mainline gives it, so the other three
    // are this registry's, each of them the thing it stands for
    hiddenAbilities: [Abilities.Synchronize, Abilities.SereneGrace, Abilities.Healer],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Rest],
        6: [Moves.Imprison],
        16: [Moves.Protect],
        21: [Moves.Swift],
        31: [Moves.LuckyChant],
        36: [Moves.FutureSight],
        46: [Moves.Charm],
        51: [Moves.Extrasensory],
        61: [Moves.Copycat],
        66: [Moves.NaturalGift],
        76: [Moves.HealingWish],
      },
      teachable: [...LAKE_TEACHABLE, Moves.Blizzard, Moves.IceBeam],
    },
  });
  registerSpecies(Species.Azelf, {
    dexNumber: 482,
    name: 'Azelf',
    category: 'Willpower Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Azelf,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 125,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 115,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    // Levitate is all the mainline gives it, so the other three
    // are this registry's, each of them the thing it stands for
    hiddenAbilities: [Abilities.InnerFocus, Abilities.OwnTempo, Abilities.ClearBody],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Grassland, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Rest],
        6: [Moves.Imprison],
        16: [Moves.Detect],
        21: [Moves.Swift],
        31: [Moves.Uproar],
        36: [Moves.FutureSight],
        46: [Moves.NastyPlot],
        51: [Moves.Extrasensory],
        61: [Moves.LastResort],
        66: [Moves.NaturalGift],
        76: [Moves.Explosion],
      },
      teachable: [
        ...LAKE_TEACHABLE,
        Moves.Explosion,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.LastResort,
        Moves.Payback,
        Moves.Taunt,
        Moves.Torment,
        Moves.Uproar,
      ],
    },
  });
}
