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
 * The one the flock answers to: a Honchkrow calls in the night and
 * Murkrow arrive from everywhere to see what it wants
 */
export default function registerHonchkrowSpecies(): void {
  registerSpecies(Species.Honchkrow, {
    dexNumber: 430,
    name: 'Honchkrow',
    category: 'Big Boss Pokemon',
    height: 0.9,
    weight: 27.3,
    family: Families.Murkrow,
    evolvesFrom: Species.Murkrow,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 125,
      [Stats.Defense]: 52,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 52,
      [Stats.Speed]: 71,
    },
    types: [Types.Dark, Types.Flying],
    abilities: [Abilities.Insomnia, Abilities.SuperLuck],
    hiddenAbilities: [Abilities.Moxie],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.Haze, Moves.Pursuit, Moves.WingAttack],
        25: [Moves.Swagger],
        35: [Moves.NastyPlot],
        45: [Moves.NightSlash],
        55: [Moves.DarkPulse],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AirCutter,
        Moves.Attract,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.DarkPulse,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Embargo,
        Moves.Endure,
        Moves.Facade,
        Moves.Fly,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HeatWave,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Payback,
        Moves.Pluck,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roost,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Spite,
        Moves.SteelWing,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.SunnyDay,
        Moves.Superpower,
        Moves.Swagger,
        Moves.Swift,
        Moves.Taunt,
        Moves.Thief,
        Moves.ThunderWave,
        Moves.Torment,
        Moves.Toxic,
        Moves.Twister,
        Moves.Uproar,
      ],
    },
  });
}
