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
  Moves.AirCutter,
  Moves.AirSlash,
  Moves.Assurance,
  Moves.Attract,
  Moves.BraveBird,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.Embargo,
  Moves.Endure,
  Moves.Facade,
  Moves.FakeTears,
  Moves.FeatherDance,
  Moves.Fly,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.Incinerate,
  Moves.IronDefense,
  Moves.KnockOff,
  Moves.NastyPlot,
  Moves.Payback,
  Moves.Pluck,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Roost,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.Snarl,
  Moves.Snore,
  Moves.Spite,
  Moves.SteelWing,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.Confide,
];

// What the vulture works out how to do, at either size
const FAMILY_LEVEL = {
  14: [Moves.NastyPlot],
  18: [Moves.Tailwind],
  23: [Moves.FeintAttack],
  24: [Moves.KnockOff],
  28: [Moves.Punishment],
  30: [Moves.IronDefense],
  32: [Moves.Defog],
  41: [Moves.AirSlash],
  46: [Moves.DarkPulse],
  50: [Moves.Embargo],
};

/**
 * The vulture: every Vullaby is female, and the bone it wears is not
 * armour it grew but armour it found and liked the fit of
 */
export default function registerVullabySpecies(): void {
  registerSpecies(Species.Vullaby, {
    dexNumber: 629,
    evolvesInto: [
      {
        species: Species.Mandibuzz,
        method: EvolutionMethod.Level,
        level: 54,
      },
    ],
    name: 'Vullaby',
    category: 'Diapered Pokemon',
    height: 0.5,
    weight: 9,
    family: Families.Vullaby,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 55,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 60,
    },
    types: [Types.Dark, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.Overcoat],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Flying],
    // Female only, the way its counterpart on the far side of the ridge
    // is male only
    genderRatio: [0, 1],
    catchRate: 190,
    biomes: [Biome.Badlands, Biome.Desert],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Gust, Moves.Leer],
        5: [Moves.FuryAttack],
        6: [Moves.Flatter],
        10: [Moves.Pluck],
        ...FAMILY_LEVEL,
        36: [Moves.Whirlwind],
        59: [Moves.BraveBird],
        64: [Moves.MirrorMove],
        66: [Moves.Attract],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.FakeTears,
        Moves.FoulPlay,
        Moves.KnockOff,
        Moves.MeanLook,
        Moves.Roost,
        Moves.ScaryFace,
        Moves.SteelWing,
        Moves.Toxic,
      ],
    },
  });
  registerSpecies(Species.Mandibuzz, {
    dexNumber: 630,
    name: 'Mandibuzz',
    category: 'Bone Vulture Pokemon',
    height: 1.2,
    weight: 39.5,
    family: Families.Vullaby,
    evolvesFrom: Species.Vullaby,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 65,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 80,
    },
    types: [Types.Dark, Types.Flying],
    abilities: [Abilities.BigPecks, Abilities.Overcoat],
    // Guts is the invented fourth: the line reaches three, and a bird
    // that lives off what has already gone bad should be better for
    // carrying something rather than worse
    hiddenAbilities: [Abilities.WeakArmor, Abilities.Guts],
    eggGroups: [EggGroups.Flying],
    genderRatio: [0, 1],
    catchRate: 60,
    biomes: [Biome.Badlands, Biome.Desert],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Gust,
          Moves.Whirlwind,
          Moves.FuryAttack,
          Moves.Leer,
          Moves.Toxic,
          Moves.MirrorMove,
          Moves.SkyAttack,
          Moves.Flatter,
          Moves.Pluck,
          Moves.BraveBird,
          Moves.BoneRush,
        ],
        ...FAMILY_LEVEL,
        72: [Moves.Attract],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Acrobatics,
        Moves.GigaImpact,
        Moves.Hurricane,
        Moves.HyperBeam,
        Moves.Sandstorm,
      ],
    },
  });
}
