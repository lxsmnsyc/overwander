import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The two halves of one moon, met on two islands off the same coast:
 * the crescent that hands out a good night's sleep, and the shadow
 * that takes it away again
 */

// The TM and tutor moves both halves are taught
const MOON_TEACHABLE = [
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.ThunderWave,
  Moves.Toxic,
  Moves.Trick,
];

export default function registerMoonDuoSpecies(): void {
  registerSpecies(Species.Cresselia, {
    dexNumber: 488,
    name: 'Cresselia',
    category: 'Lunar Pokemon',
    height: 1.5,
    weight: 85.6,
    family: Families.Cresselia,
    stats: {
      [Stats.HP]: 120,
      [Stats.Attack]: 70,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 85,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    // The other three are this registry's: what it does for a sleeper
    // it does awake as well, and the crescent it trails is a light
    // nobody dims
    hiddenAbilities: [Abilities.Healer, Abilities.Illuminate, Abilities.AromaVeil],
    eggGroups: [EggGroups.NoEggsDiscovered],
    // Always the sister of the two
    genderRatio: [0, 1],
    catchRate: 3,
    biomes: [Biome.Ocean],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.DoubleTeam],
        11: [Moves.Safeguard],
        20: [Moves.Mist],
        29: [Moves.AuroraBeam],
        38: [Moves.FutureSight],
        47: [Moves.Slash],
        57: [Moves.Moonlight],
        66: [Moves.PsychoCut],
        75: [Moves.PsychoShift],
        84: [Moves.LunarDance],
        93: [Moves.Psychic],
      },
      teachable: [
        ...MOON_TEACHABLE,
        Moves.Attract,
        Moves.Captivate,
        Moves.EnergyBall,
        Moves.FuryCutter,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.LightScreen,
        Moves.Recycle,
        Moves.Reflect,
        Moves.Safeguard,
        Moves.SignalBeam,
        Moves.SkillSwap,
        Moves.SolarBeam,
        Moves.TrickRoom,
        Moves.ZenHeadbutt,
      ],
    },
  });
  registerSpecies(Species.Darkrai, {
    dexNumber: 491,
    name: 'Darkrai',
    category: 'Pitch-Black Pokemon',
    height: 1.5,
    weight: 50.5,
    family: Families.Darkrai,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 90,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 135,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 125,
    },
    types: [Types.Dark],
    abilities: [Abilities.BadDreams],
    // The other three are this registry's: nothing rests near it, it
    // is under before anybody saw it coming, and no screen was ever
    // in its way
    hiddenAbilities: [Abilities.Unnerve, Abilities.Prankster, Abilities.Infiltrator],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Ocean],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Disable, Moves.OminousWind],
        11: [Moves.QuickAttack],
        20: [Moves.Hypnosis],
        29: [Moves.FeintAttack],
        38: [Moves.Nightmare],
        47: [Moves.DoubleTeam],
        57: [Moves.Haze],
        66: [Moves.DarkVoid],
        75: [Moves.NastyPlot],
        84: [Moves.DreamEater],
        93: [Moves.DarkPulse],
      },
      teachable: [
        ...MOON_TEACHABLE,
        Moves.AerialAce,
        Moves.Blizzard,
        Moves.BrickBreak,
        Moves.Cut,
        Moves.DarkPulse,
        Moves.DrainPunch,
        Moves.Embargo,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.KnockOff,
        Moves.LastResort,
        Moves.OminousWind,
        Moves.Payback,
        Moves.PoisonJab,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.ShadowClaw,
        Moves.ShockWave,
        Moves.SludgeBomb,
        Moves.Snatch,
        Moves.Spite,
        Moves.Strength,
        Moves.SuckerPunch,
        Moves.SwordsDance,
        Moves.Taunt,
        Moves.Thief,
        Moves.Thunder,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.WillOWisp,
        Moves.XScissor,
      ],
    },
  });
}
