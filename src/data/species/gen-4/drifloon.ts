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
  Moves.AirCutter,
  Moves.Attract,
  Moves.CalmMind,
  Moves.Captivate,
  Moves.ChargeBeam,
  Moves.Cut,
  Moves.Defog,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Embargo,
  Moves.Endure,
  Moves.Explosion,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.IcyWind,
  Moves.KnockOff,
  Moves.MagicCoat,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.OminousWind,
  Moves.PainSplit,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Rest,
  Moves.Return,
  Moves.Rollout,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShockWave,
  Moves.SilverWind,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Spite,
  Moves.Substitute,
  Moves.SuckerPunch,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.Thief,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.WillOWisp,
];

/**
 * The balloon that waits about at dusk. What it is full of is not air,
 * and a Drifblim carries off whatever takes hold of its string
 */
export default function registerDrifloonSpecies(): void {
  registerSpecies(Species.Drifloon, {
    dexNumber: 425,
    evolvesInto: [
      {
        species: Species.Drifblim,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Drifloon',
    category: 'Balloon Pokemon',
    height: 0.4,
    weight: 1.2,
    family: Families.Drifloon,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 50,
      [Stats.Defense]: 34,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 44,
      [Stats.Speed]: 70,
    },
    types: [Types.Ghost, Types.Flying],
    abilities: [Abilities.Aftermath, Abilities.Unburden],
    hiddenAbilities: [Abilities.FlareBoost],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 125,
    biomes: [Biome.Bog, Biome.Woodland, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Constrict, Moves.Minimize],
        6: [Moves.Astonish],
        11: [Moves.Gust],
        14: [Moves.FocusEnergy],
        17: [Moves.Payback],
        22: [Moves.Stockpile],
        27: [Moves.SpitUp, Moves.Swallow],
        30: [Moves.OminousWind],
        33: [Moves.BatonPass],
        38: [Moves.ShadowBall],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BodySlam,
        Moves.DestinyBond,
        Moves.Disable,
        Moves.Haze,
        Moves.Hypnosis,
        Moves.Memento,
        Moves.WeatherBall,
      ],
    },
  });
  registerSpecies(Species.Drifblim, {
    dexNumber: 426,
    name: 'Drifblim',
    category: 'Blimp Pokemon',
    height: 1.2,
    weight: 15.0,
    family: Families.Drifloon,
    evolvesFrom: Species.Drifloon,
    stats: {
      [Stats.HP]: 150,
      [Stats.Attack]: 80,
      [Stats.Defense]: 44,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 54,
      [Stats.Speed]: 80,
    },
    types: [Types.Ghost, Types.Flying],
    abilities: [Abilities.Aftermath, Abilities.Unburden],
    // Multiscale is this registry's rather than the mainline's: a
    // balloon is whole until something puts a hole in it
    hiddenAbilities: [Abilities.FlareBoost, Abilities.Multiscale],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Bog, Biome.Woodland, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.Constrict, Moves.Gust, Moves.Minimize],
        6: [Moves.Astonish],
        11: [Moves.Gust],
        14: [Moves.FocusEnergy],
        17: [Moves.Payback],
        22: [Moves.Stockpile],
        27: [Moves.SpitUp, Moves.Swallow],
        32: [Moves.OminousWind],
        37: [Moves.BatonPass],
        44: [Moves.ShadowBall],
        51: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Fly, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
