import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both halves of the dojo are taught
const PAIR_TEACHABLE = [
  Moves.Attract,
  Moves.Block,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Bulldoze,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.FirePunch,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusEnergy,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IcePunch,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.PainSplit,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Reversal,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Taunt,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
  Moves.Confide,
  Moves.PowerUpPunch,
];

/**
 * The two halves of one dojo: Throh throws whoever comes at it and
 * Sawk strikes before they can. Neither is ever female, and neither
 * evolves, so what they are at level 1 is what they stay
 */
export default function registerBeltPairSpecies(): void {
  registerSpecies(Species.Throh, {
    dexNumber: 538,
    name: 'Throh',
    category: 'Judo Pokemon',
    height: 1.3,
    weight: 55.5,
    family: Families.Throh,
    stats: {
      [Stats.HP]: 120,
      [Stats.Attack]: 100,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 45,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Guts, Abilities.InnerFocus],
    // Stamina is the invented fourth: the line reaches three, and a
    // judoka on 120 HP wins by being the one still standing
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.Stamina],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bind, Moves.Leer, Moves.FocusEnergy, Moves.Bide],
        5: [Moves.SeismicToss],
        9: [Moves.VitalThrow],
        10: [Moves.CircleThrow],
        13: [Moves.Revenge],
        15: [Moves.WideGuard],
        17: [Moves.StormThrow],
        21: [Moves.BodySlam],
        25: [Moves.BulkUp],
        33: [Moves.Endure],
        41: [Moves.Superpower],
        45: [Moves.Reversal],
      },
      teachable: [...PAIR_TEACHABLE, Moves.Bind, Moves.BodySlam, Moves.Revenge],
    },
  });
  registerSpecies(Species.Sawk, {
    dexNumber: 539,
    name: 'Sawk',
    category: 'Karate Pokemon',
    height: 1.4,
    weight: 51,
    family: Families.Sawk,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 125,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 85,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Sturdy, Abilities.InnerFocus],
    // Scrappy is the invented fourth: the line reaches three, and a
    // karateka breaking through what should not be hittable is the
    // same idea as the Mold Breaker it already has
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.Scrappy],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.FocusEnergy, Moves.Bide, Moves.RockSmash],
        5: [Moves.DoubleKick],
        9: [Moves.LowSweep],
        13: [Moves.Counter],
        15: [Moves.QuickGuard],
        17: [Moves.KarateChop],
        21: [Moves.BrickBreak],
        25: [Moves.BulkUp],
        29: [Moves.Retaliate],
        33: [Moves.Endure],
        41: [Moves.CloseCombat],
        45: [Moves.Reversal],
      },
      teachable: [...PAIR_TEACHABLE, Moves.CloseCombat, Moves.DualChop, Moves.Revenge],
    },
  });
}
