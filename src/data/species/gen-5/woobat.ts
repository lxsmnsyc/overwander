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
  Moves.Acrobatics,
  Moves.AerialAce,
  Moves.AfterYou,
  Moves.Attract,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Embargo,
  Moves.Endeavor,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Fly,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GyroBall,
  Moves.HeatWave,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.KnockOff,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.Pluck,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Roost,
  Moves.Round,
  Moves.Safeguard,
  Moves.ShadowBall,
  Moves.SignalBeam,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SuperFang,
  Moves.Swagger,
  Moves.Tailwind,
  Moves.Taunt,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Torment,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.UTurn,
  Moves.Uproar,
  Moves.ZenHeadbutt,
  Moves.Confide,
];

/**
 * The bats of the passages: a Woobat leaves the mark of its nose on
 * whatever it takes a liking to, and a Swoobat courts on the wing
 */
export default function registerWoobatSpecies(): void {
  registerSpecies(Species.Woobat, {
    dexNumber: 527,
    evolvesInto: [
      {
        species: Species.Swoobat,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Woobat',
    category: 'Bat Pokemon',
    height: 0.4,
    weight: 2.1,
    family: Families.Woobat,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 45,
      [Stats.Defense]: 43,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 43,
      [Stats.Speed]: 72,
    },
    types: [Types.Psychic, Types.Flying],
    abilities: [Abilities.Unaware, Abilities.Klutz],
    hiddenAbilities: [Abilities.Simple],
    eggGroups: [EggGroups.Flying, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Confusion],
        4: [Moves.OdorSleuth],
        8: [Moves.Gust],
        12: [Moves.Assurance],
        15: [Moves.HeartStamp],
        19: [Moves.Imprison],
        21: [Moves.AirCutter],
        25: [Moves.Attract],
        29: [Moves.Amnesia, Moves.CalmMind],
        32: [Moves.AirSlash],
        36: [Moves.FutureSight],
        41: [Moves.Psychic],
        47: [Moves.Endeavor],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Charm,
        Moves.FakeTears,
        Moves.Flatter,
        Moves.StoredPower,
        Moves.Supersonic,
        Moves.Synchronoise,
        Moves.VenomDrench,
      ],
    },
  });
  registerSpecies(Species.Swoobat, {
    dexNumber: 528,
    name: 'Swoobat',
    category: 'Courting Pokemon',
    height: 0.9,
    weight: 10.5,
    family: Families.Woobat,
    evolvesFrom: Species.Woobat,
    stats: {
      [Stats.HP]: 67,
      [Stats.Attack]: 57,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 77,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 114,
    },
    types: [Types.Psychic, Types.Flying],
    abilities: [Abilities.Unaware, Abilities.Klutz],
    // Infiltrator is the invented fourth: the line reaches three, and
    // a bat this size gets in wherever it likes
    hiddenAbilities: [Abilities.Simple, Abilities.Infiltrator],
    eggGroups: [EggGroups.Flying, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Assurance, Moves.Confusion, Moves.Gust, Moves.OdorSleuth],
        15: [Moves.HeartStamp],
        19: [Moves.Imprison],
        21: [Moves.AirCutter],
        25: [Moves.Attract],
        29: [Moves.Amnesia, Moves.CalmMind],
        32: [Moves.AirSlash],
        36: [Moves.FutureSight],
        41: [Moves.Psychic],
        47: [Moves.Endeavor],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam, Moves.SkyAttack],
    },
  });
}
