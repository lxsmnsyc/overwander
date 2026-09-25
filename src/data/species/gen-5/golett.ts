import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AllySwitch,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.Bulldoze,
  Moves.ConfuseRay,
  Moves.Curse,
  Moves.Dig,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.FirePunch,
  Moves.Flash,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.Gravity,
  Moves.GyroBall,
  Moves.HeavySlam,
  Moves.HelpingHand,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcePunch,
  Moves.IcyWind,
  Moves.Imprison,
  Moves.IronDefense,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.MudSlap,
  Moves.NightShade,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.SelfDestruct,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.SmackDown,
  Moves.Snore,
  Moves.StealthRock,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.Confide,
  Moves.PowerUpPunch,
];

// The orders the clay was fired with, which neither size forgets
const FAMILY_LEVEL = {
  9: [Moves.Rollout],
  12: [Moves.ShadowPunch],
  16: [Moves.Curse],
  17: [Moves.IronDefense],
  20: [Moves.NightShade],
  21: [Moves.MegaPunch],
  25: [Moves.Magnitude],
  30: [Moves.DynamicPunch],
  36: [Moves.ShadowBall],
};

/**
 * The automatons: the clay was fired five thousand years ago and
 * whatever was put inside it is still following the order it was given
 */
export default function registerGolettSpecies(): void {
  registerSpecies(Species.Golett, {
    dexNumber: 622,
    evolvesInto: [
      {
        species: Species.Golurk,
        method: EvolutionMethod.Level,
        level: 43,
      },
    ],
    name: 'Golett',
    category: 'Automaton Pokemon',
    height: 1,
    weight: 92,
    family: Families.Golett,
    stats: {
      [Stats.HP]: 59,
      [Stats.Attack]: 74,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 35,
    },
    types: [Types.Ground, Types.Ghost],
    abilities: [Abilities.IronFist, Abilities.Klutz],
    hiddenAbilities: [Abilities.NoGuard],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 190,
    biomes: [Biome.Badlands, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.DefenseCurl, Moves.MudSlap, Moves.Astonish],
        ...FAMILY_LEVEL,
        21: [Moves.StompingTantrum],
        40: [Moves.HeavySlam],
        45: [Moves.Earthquake],
        48: [Moves.HammerArm],
        55: [Moves.FocusPunch],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Golurk, {
    dexNumber: 623,
    name: 'Golurk',
    category: 'Automaton Pokemon',
    height: 2.8,
    weight: 330,
    family: Families.Golett,
    evolvesFrom: Species.Golett,
    stats: {
      [Stats.HP]: 89,
      [Stats.Attack]: 124,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 55,
    },
    types: [Types.Ground, Types.Ghost],
    abilities: [Abilities.IronFist, Abilities.Klutz],
    // Stamina is the invented fourth: the line reaches three, and a
    // 55 Speed body that is going to be hit anyway should get
    // something back for it
    hiddenAbilities: [Abilities.NoGuard, Abilities.Stamina],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 90,
    biomes: [Biome.Badlands, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Pound,
          Moves.DefenseCurl,
          Moves.MudSlap,
          Moves.FocusPunch,
          Moves.Astonish,
          Moves.HeavySlam,
          Moves.HighHorsepower,
        ],
        ...FAMILY_LEVEL,
        21: [Moves.StompingTantrum],
        50: [Moves.Earthquake],
        52: [Moves.HammerArm],
        75: [Moves.PhantomForce],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.ChargeBeam,
        Moves.CloseCombat,
        Moves.FlashCannon,
        Moves.Fly,
        Moves.GigaImpact,
        Moves.HeatCrash,
        Moves.HyperBeam,
        Moves.SolarBeam,
        Moves.StoneEdge,
        Moves.Thunderbolt,
        Moves.Trick,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
