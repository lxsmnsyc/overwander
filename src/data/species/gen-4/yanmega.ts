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
 * A Yanma grown past what its wings should carry: a Yanmega beats
 * them hard enough to knock the wind out of whatever it passes
 */
export default function registerYanmegaSpecies(): void {
  registerSpecies(Species.Yanmega, {
    dexNumber: 469,
    name: 'Yanmega',
    category: 'Ogre Darner Pokemon',
    height: 1.9,
    weight: 51.5,
    family: Families.Yanma,
    evolvesFrom: Species.Yanma,
    stats: {
      [Stats.HP]: 86,
      [Stats.Attack]: 76,
      [Stats.Defense]: 86,
      [Stats.SpecialAttack]: 116,
      [Stats.SpecialDefense]: 56,
      [Stats.Speed]: 95,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.SpeedBoost, Abilities.TintedLens],
    hiddenAbilities: [Abilities.Frisk],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.Bog, Biome.Swamp, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.BugBite,
          Moves.DoubleTeam,
          Moves.Foresight,
          Moves.NightSlash,
          Moves.QuickAttack,
          Moves.Tackle,
        ],
        6: [Moves.QuickAttack],
        11: [Moves.DoubleTeam],
        14: [Moves.SonicBoom],
        17: [Moves.Detect],
        22: [Moves.Supersonic],
        27: [Moves.Uproar],
        30: [Moves.Pursuit],
        33: [Moves.AncientPower],
        38: [Moves.Feint],
        43: [Moves.Slash],
        46: [Moves.Screech],
        49: [Moves.UTurn],
        54: [Moves.AirSlash],
        57: [Moves.BugBuzz],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AirCutter,
        Moves.AncientPower,
        Moves.Attract,
        Moves.Captivate,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.Rest,
        Moves.Return,
        Moves.Roost,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SignalBeam,
        Moves.SilverWind,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.SteelWing,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,
        Moves.UTurn,
        Moves.Uproar,
      ],
    },
  });
}
