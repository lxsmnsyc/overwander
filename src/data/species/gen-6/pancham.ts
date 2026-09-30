import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.Attract,
  Moves.Block,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.Covet,
  Moves.Crunch,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.DualChop,
  Moves.EchoedVoice,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.FirePunch,
  Moves.Fling,
  Moves.FocusPunch,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.GunkShot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IcePunch,
  Moves.IronHead,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Payback,
  Moves.PowerUpPunch,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Roar,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snatch,
  Moves.Snore,
  Moves.Spite,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Surf,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Taunt,
  Moves.ThunderPunch,
  Moves.Torment,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
];

// The bamboo both shapes chew on
const FAMILY_BIOMES = [Biome.TropicalSeasonalForest, Biome.Woodland];

// What the panda knows at either size
const FAMILY_LEVEL = {
  12: [Moves.CircleThrow, Moves.KarateChop],
  15: [Moves.CometPunch],
  20: [Moves.Slash],
  27: [Moves.VitalThrow],
};

/**
 * The panda with a leaf in its teeth and the brawler it grows into.
 * Pangoro takes anything mended on the other side personally, which
 * is what its signature counts
 */
export default function registerPanchamSpecies(): void {
  registerSpecies(Species.Pancham, {
    dexNumber: 674,
    evolvesInto: [
      {
        // The mainline also asks for a Dark type in the party, which
        // nothing here can measure yet
        species: Species.Pangoro,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Pancham',
    category: 'Playful Pokemon',
    height: 0.6,
    weight: 8.0,
    family: Families.Pancham,
    stats: {
      [Stats.HP]: 67,
      [Stats.Attack]: 82,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 46,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 43,
    },
    types: [Types.Fighting],
    abilities: [Abilities.IronFist, Abilities.MoldBreaker],
    hiddenAbilities: [Abilities.Scrappy],
    eggGroups: [EggGroups.Field, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 220,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Leer],
        4: [Moves.ArmThrust],
        8: [Moves.Taunt],
        10: [Moves.WorkUp],
        ...FAMILY_LEVEL,
        16: [Moves.LowSweep],
        33: [Moves.BodySlam, Moves.Crunch],
        40: [Moves.PartingShot],
        42: [Moves.Entrainment],
        48: [Moves.SkyUppercut],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.FoulPlay,
        Moves.MeFirst,
        Moves.Quash,
        Moves.QuickGuard,
        Moves.SeismicToss,
        Moves.StormThrow,
      ],
    },
  });
  registerSpecies(Species.Pangoro, {
    dexNumber: 675,
    name: 'Pangoro',
    category: 'Daunting Pokemon',
    height: 2.1,
    weight: 136.0,
    family: Families.Pancham,
    evolvesFrom: Species.Pancham,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 124,
      [Stats.Defense]: 78,
      [Stats.SpecialAttack]: 69,
      [Stats.SpecialDefense]: 71,
      [Stats.Speed]: 58,
    },
    types: [Types.Fighting, Types.Dark],
    abilities: [Abilities.IronFist, Abilities.MoldBreaker],
    // Guts is this line's invented filler: the mainline gives the
    // panda Iron Fist, Mold Breaker and Scrappy and nothing else
    hiddenAbilities: [Abilities.Scrappy, Abilities.Guts],
    eggGroups: [EggGroups.Field, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 65,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Leer,
          Moves.ArmThrust,
          Moves.Taunt,
          Moves.WorkUp,
          Moves.LowSweep,
          Moves.Entrainment,
          Moves.HammerArm,
          Moves.BulletPunch,
          Moves.NightSlash,
        ],
        ...FAMILY_LEVEL,
        35: [Moves.BodySlam, Moves.Crunch],
        46: [Moves.PartingShot],
        52: [Moves.SkyUppercut],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BeatUp,
        Moves.CloseCombat,
        Moves.DragonClaw,
        Moves.Earthquake,
        Moves.Embargo,
        Moves.FocusBlast,
        Moves.FocusEnergy,
        Moves.GigaImpact,
        Moves.HoneClaws,
        Moves.HyperBeam,
        Moves.Infestation,
        Moves.Outrage,
        Moves.PoisonJab,
        Moves.Quash,
        Moves.Revenge,
        Moves.Reversal,
        Moves.ScaryFace,
        Moves.Snarl,
        Moves.Thief,
        Moves.XScissor,
      ],
    },
  });
}
