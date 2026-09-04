import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The eon pair: one sister, one brother, and nothing else of either.
 * Each is single-gendered, so the pair is only ever met as a pair,
 * and the mainline gives both of them one ability and nothing more
 */

// TM, HM and tutor moves both share, which is nearly everything
const EON_TEACHABLE = [
  Moves.DragonClaw,
  Moves.WaterPulse,
  Moves.CalmMind,
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.HyperBeam,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Earthquake,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.ShockWave,
  Moves.Sandstorm,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.SteelWing,
  Moves.Cut,
  Moves.Fly,
  Moves.Surf,
  Moves.Flash,
  Moves.Waterfall,
  Moves.Dive,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerEonDuoSpecies(): void {
  registerSpecies(Species.Latias, {
    dexNumber: 380,
    name: 'Latias',
    category: 'Eon Pokemon',
    height: 1.4,
    weight: 40,
    family: Families.Latias,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 80,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 130,
      [Stats.Speed]: 110,
    },
    types: [Types.Dragon, Types.Psychic],
    abilities: [Abilities.Levitate],
    // All three are this registry's: the sister is the one that
    // shields, unmarked while it is whole and faster the longer it
    // stays in the air
    hiddenAbilities: [Abilities.Healer, Abilities.Multiscale, Abilities.SpeedBoost],
    eggGroups: [EggGroups.NoEggsDiscovered],
    // Always the sister of the two
    genderRatio: [0, 1],
    catchRate: 3,
    biomes: [Biome.Ocean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Psywave],
        5: [Moves.Wish],
        10: [Moves.HelpingHand],
        15: [Moves.Safeguard],
        20: [Moves.DragonBreath],
        25: [Moves.WaterSport],
        30: [Moves.Refresh],
        35: [Moves.MistBall],
        40: [Moves.Psychic],
        45: [Moves.Recover],
        50: [Moves.Charm],
      },
      teachable: [...EON_TEACHABLE],
    },
  });

  registerSpecies(Species.Latios, {
    dexNumber: 381,
    name: 'Latios',
    category: 'Eon Pokemon',
    height: 2,
    weight: 60,
    family: Families.Latios,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 90,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 110,
    },
    types: [Types.Dragon, Types.Psychic],
    abilities: [Abilities.Levitate],
    // All three are this registry's: the brother turns a status move
    // back on whoever cast it, and is the same untouched-and-climbing
    // flier his sister is
    hiddenAbilities: [Abilities.MagicBounce, Abilities.Multiscale, Abilities.SpeedBoost],
    eggGroups: [EggGroups.NoEggsDiscovered],
    // Always the brother of the two
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [Biome.Ocean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Psywave],
        5: [Moves.Memento],
        10: [Moves.HelpingHand],
        15: [Moves.Safeguard],
        20: [Moves.DragonBreath],
        25: [Moves.Protect],
        30: [Moves.Refresh],
        35: [Moves.LusterPurge],
        40: [Moves.Psychic],
        45: [Moves.Recover],
        50: [Moves.DragonDance],
      },
      teachable: [...EON_TEACHABLE],
    },
  });
}
