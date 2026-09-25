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
  Moves.AerialAce,
  Moves.AirSlash,
  Moves.Assurance,
  Moves.Attract,
  Moves.BeatUp,
  Moves.BrickBreak,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Embargo,
  Moves.Endure,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.FlashCannon,
  Moves.Fling,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MetalClaw,
  Moves.MetalSound,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.PsychoCut,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Revenge,
  Moves.RockPolish,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.ScaryFace,
  Moves.Screech,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snarl,
  Moves.Snore,
  Moves.Spite,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Torment,
  Moves.Toxic,
  Moves.XScissor,
  Moves.Confide,
  Moves.PowerUpPunch,
];

// What the blades work out how to do, at either size
const FAMILY_LEVEL = {
  17: [Moves.FeintAttack],
  20: [Moves.ScaryFace],
  25: [Moves.Assurance],
  30: [Moves.Slash, Moves.MetalSound],
  40: [Moves.NightSlash],
  41: [Moves.Embargo],
  45: [Moves.IronDefense],
  50: [Moves.Retaliate],
};

/**
 * The blades: a troop of Pawniard corners what it hunts and the
 * Bisharp behind them never has to move until the end
 */
export default function registerPawniardSpecies(): void {
  registerSpecies(Species.Pawniard, {
    dexNumber: 624,
    evolvesInto: [
      {
        species: Species.Bisharp,
        method: EvolutionMethod.Level,
        level: 52,
      },
    ],
    name: 'Pawniard',
    category: 'Sharp Blade Pokemon',
    height: 0.5,
    weight: 10.2,
    family: Families.Pawniard,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 85,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 60,
    },
    types: [Types.Dark, Types.Steel],
    abilities: [Abilities.Defiant, Abilities.InnerFocus],
    hiddenAbilities: [Abilities.Pressure],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Badlands, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer],
        5: [Moves.FuryCutter],
        10: [Moves.MetalClaw],
        14: [Moves.Torment],
        ...FAMILY_LEVEL,
        54: [Moves.IronHead],
        57: [Moves.SwordsDance],
        62: [Moves.Guillotine],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Headbutt,
        Moves.MeanLook,
        Moves.PsychoCut,
        Moves.Pursuit,
        Moves.QuickGuard,
        Moves.Revenge,
        Moves.StealthRock,
        Moves.SuckerPunch,
      ],
    },
  });
  registerSpecies(Species.Bisharp, {
    dexNumber: 625,
    name: 'Bisharp',
    category: 'Sword Blade Pokemon',
    height: 1.6,
    weight: 70,
    family: Families.Pawniard,
    evolvesFrom: Species.Pawniard,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 125,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Dark, Types.Steel],
    abilities: [Abilities.Defiant, Abilities.InnerFocus],
    // Three, and it stays at three: Kingambit stands above this one in
    // a later generation, so anything invented here would be in a
    // Kingambit's reach the day it lands
    hiddenAbilities: [Abilities.Pressure],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Badlands, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Scratch,
          Moves.Guillotine,
          Moves.Leer,
          Moves.FuryCutter,
          Moves.MetalClaw,
          Moves.Torment,
          Moves.MetalBurst,
          Moves.IronHead,
        ],
        ...FAMILY_LEVEL,
        63: [Moves.SwordsDance],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Reversal,
        Moves.LaserFocus,
        Moves.ThroatChop,
      ],
    },
  });
}
