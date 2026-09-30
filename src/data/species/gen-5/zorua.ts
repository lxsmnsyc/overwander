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
  Moves.Agility,
  Moves.Assurance,
  Moves.Attract,
  Moves.Bounce,
  Moves.CalmMind,
  Moves.ConfuseRay,
  Moves.Covet,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Embargo,
  Moves.Encore,
  Moves.Endure,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Fling,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.HyperVoice,
  Moves.Imprison,
  Moves.Incinerate,
  Moves.KnockOff,
  Moves.NastyPlot,
  Moves.NightShade,
  Moves.PainSplit,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Revenge,
  Moves.Roar,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snarl,
  Moves.Snatch,
  Moves.Snore,
  Moves.Spite,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.SwordsDance,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.Trick,
  Moves.UTurn,
  Moves.Uproar,
  Moves.Confide,
];

// What the fox learns whichever size it is pretending to be
const FAMILY_LEVEL = {
  12: [Moves.FurySwipes],
  16: [Moves.ScaryFace],
  17: [Moves.FeintAttack],
  20: [Moves.Taunt],
  24: [Moves.KnockOff],
  29: [Moves.FoulPlay],
};

/**
 * The tricksters: neither of them is ever what it looks like, and a
 * Zoroark will keep a whole wood looking like somewhere else to keep
 * people away from its den
 */
export default function registerZoruaSpecies(): void {
  registerSpecies(Species.Zorua, {
    dexNumber: 570,
    evolvesInto: [
      {
        species: Species.Zoroark,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Zorua',
    category: 'Tricky Fox Pokemon',
    height: 0.7,
    weight: 12.5,
    family: Families.Zorua,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 65,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 65,
    },
    types: [Types.Dark],
    abilities: [Abilities.Illusion],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Field],
    // Seven males to every female
    genderRatio: [7, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer],
        4: [Moves.Torment],
        5: [Moves.Pursuit],
        8: [Moves.HoneClaws],
        9: [Moves.FakeTears],
        ...FAMILY_LEVEL,
        32: [Moves.Agility],
        36: [Moves.Imprison],
        40: [Moves.NightDaze],
        41: [Moves.Embargo],
        44: [Moves.NastyPlot],
        45: [Moves.Punishment],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Captivate,
        Moves.Copycat,
        Moves.Counter,
        Moves.DarkPulse,
        Moves.Detect,
        Moves.Extrasensory,
        Moves.Memento,
        Moves.Snatch,
        Moves.SuckerPunch,
      ],
    },
  });
  registerSpecies(Species.Zoroark, {
    dexNumber: 571,
    name: 'Zoroark',
    category: 'Illusion Fox Pokemon',
    height: 1.6,
    weight: 81.1,
    family: Families.Zorua,
    evolvesFrom: Species.Zorua,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 105,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 105,
    },
    types: [Types.Dark],
    abilities: [Abilities.Illusion],
    // The line reaches only Illusion, so three of the four are
    // invented: a fox that goes through your bag, gets there before you
    // have understood it, and does not stop at copying the shape
    hiddenAbilities: [Abilities.Pickpocket, Abilities.Prankster, Abilities.Trace],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Scratch,
          Moves.Leer,
          Moves.Pursuit,
          Moves.Torment,
          Moves.Imprison,
          Moves.UTurn,
          Moves.HoneClaws,
          Moves.NightDaze,
          Moves.NightSlash,
        ],
        ...FAMILY_LEVEL,
        28: [Moves.FakeTears],
        34: [Moves.Agility],
        44: [Moves.Embargo],
        49: [Moves.Punishment],
        52: [Moves.NastyPlot],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BodySlam,
        Moves.BrickBreak,
        Moves.Crunch,
        Moves.Flamethrower,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LowKick,
        Moves.LowSweep,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.Psychic,
        Moves.RockSmash,
        Moves.LaserFocus,
        Moves.ThroatChop,
      ],
    },
  });
}
