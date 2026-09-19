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
 * The song and the step: one pokemon in two shapes, singing with its
 * special half and dancing with its physical one. Relic Song is what
 * turns it over, so the dancer is worn for a fight rather than caught
 */

/** The levels both shapes share, since the song is the same song */
const MELOETTA_LEVELS = {
  1: [Moves.Sing, Moves.Confusion, Moves.QuickAttack, Moves.Round],
  21: [Moves.TeeterDance],
  26: [Moves.Acrobatics],
  31: [Moves.Psybeam],
  36: [Moves.EchoedVoice],
  43: [Moves.UTurn],
  50: [Moves.WakeUpSlap, Moves.RelicSong],
  57: [Moves.Psychic],
  64: [Moves.HyperVoice],
  71: [Moves.RolePlay],
  78: [Moves.CloseCombat],
  85: [Moves.PerishSong],
};

/** What both shapes are taught */
const MELOETTA_TEACHABLE = [
  Moves.Acrobatics,
  Moves.AllySwitch,
  Moves.BatonPass,
  Moves.BrickBreak,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Charm,
  Moves.CloseCombat,
  Moves.Covet,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.DreamEater,
  Moves.DualChop,
  Moves.EchoedVoice,
  Moves.Embargo,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FakeTears,
  Moves.FirePunch,
  Moves.Flash,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.Gravity,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.HyperBeam,
  Moves.HyperVoice,
  Moves.IcePunch,
  Moves.KnockOff,
  Moves.LastResort,
  Moves.LightScreen,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MagicCoat,
  Moves.MagicRoom,
  Moves.Metronome,
  Moves.Payback,
  Moves.Protect,
  Moves.Psybeam,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Recycle,
  Moves.RelicSong,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Reversal,
  Moves.RockSmash,
  Moves.RolePlay,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.SwordsDance,
  Moves.Telekinesis,
  Moves.Thunder,
  Moves.ThunderPunch,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WonderRoom,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
  Moves.Confide,
  Moves.DazzlingGleam,
  Moves.PowerUpPunch,
];

export default function registerMeloettaSpecies(): void {
  registerSpecies(Species.Meloetta, {
    dexNumber: 648,
    name: 'Meloetta',
    category: 'Melody Pokemon',
    height: 0.6,
    weight: 6.5,
    family: Families.Meloetta,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 77,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 128,
      [Stats.SpecialDefense]: 128,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal, Types.Psychic],
    abilities: [Abilities.SereneGrace],
    // Soundproof, Healer and Dancer are this registry's rather than
    // the mainline's: a singer is not sung at, its songs mend what
    // hears them, and it cannot watch a dance without joining it
    hiddenAbilities: [Abilities.Soundproof, Abilities.Healer, Abilities.Dancer],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: { ...MELOETTA_LEVELS },
      teachable: [...MELOETTA_TEACHABLE],
    },
  });
  registerSpecies(Species.MeloettaPirouette, {
    dexNumber: 648,
    name: 'Meloetta Pirouette',
    baseForm: false,
    // Worn rather than met: Relic Song is what turns it over, so the
    // dex fills the step in the day the song is
    worn: true,
    category: 'Melody Pokemon',
    height: 0.6,
    weight: 6.5,
    family: Families.Meloetta,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 128,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 77,
      [Stats.SpecialDefense]: 77,
      [Stats.Speed]: 128,
    },
    types: [Types.Normal, Types.Fighting],
    abilities: [Abilities.SereneGrace],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    // Worn rather than met, so no pool stages one
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: { ...MELOETTA_LEVELS },
      teachable: [...MELOETTA_TEACHABLE],
    },
  });
}
