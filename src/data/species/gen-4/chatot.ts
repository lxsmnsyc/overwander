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
 * The bird that keeps whatever it was told. Every note it makes is
 * somebody else's, and it says them back louder
 */
export default function registerChatotSpecies(): void {
  registerSpecies(Species.Chatot, {
    dexNumber: 441,
    name: 'Chatot',
    category: 'Music Note Pokemon',
    height: 0.5,
    weight: 1.9,
    family: Families.Chatot,
    stats: {
      [Stats.HP]: 76,
      [Stats.Attack]: 65,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 92,
      [Stats.SpecialDefense]: 42,
      [Stats.Speed]: 91,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.TangledFeet],
    // Big Pecks is the mainline's hidden one; the deafness is this
    // registry's, and it is the other half of what an ear is for
    hiddenAbilities: [Abilities.BigPecks, Abilities.Soundproof],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.TropicalSeasonalForest, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck],
        5: [Moves.Growl],
        9: [Moves.MirrorMove],
        13: [Moves.Sing],
        17: [Moves.FuryAttack],
        21: [Moves.Chatter],
        25: [Moves.Taunt],
        29: [Moves.Mimic],
        33: [Moves.Roost],
        37: [Moves.Uproar],
        41: [Moves.FeatherDance],
        45: [Moves.HyperVoice],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AirCutter,
        Moves.Attract,
        Moves.Captivate,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Fly,
        Moves.Frustration,
        Moves.HeatWave,
        Moves.HiddenPower,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Pluck,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roost,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SteelWing,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Taunt,
        Moves.Thief,
        Moves.Torment,
        Moves.Toxic,
        Moves.Twister,
        Moves.UTurn,
        Moves.Uproar,
      ],
    },
  });
}
