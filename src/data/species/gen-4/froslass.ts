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
 * The other way a Snorunt can go, and only a female one: a Froslass
 * freezes what it likes the look of and keeps it
 */
export default function registerFroslassSpecies(): void {
  registerSpecies(Species.Froslass, {
    dexNumber: 478,
    name: 'Froslass',
    category: 'Snow Land Pokemon',
    height: 1.3,
    weight: 26.6,
    family: Families.Snorunt,
    evolvesFrom: Species.Snorunt,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 80,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 110,
    },
    types: [Types.Ice, Types.Ghost],
    abilities: [Abilities.SnowCloak],
    hiddenAbilities: [Abilities.CursedBody],
    eggGroups: [EggGroups.Fairy, EggGroups.Mineral],
    genderRatio: [0, 1],
    catchRate: 75,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.DoubleTeam, Moves.Leer, Moves.PowderSnow],
        4: [Moves.DoubleTeam],
        10: [Moves.Astonish],
        13: [Moves.IcyWind],
        19: [Moves.ConfuseRay],
        22: [Moves.OminousWind],
        28: [Moves.WakeUpSlap],
        31: [Moves.Captivate],
        37: [Moves.IceShard],
        40: [Moves.Hail],
        51: [Moves.Blizzard],
        59: [Moves.DestinyBond],
      },
      teachable: [
        Moves.Attract,
        Moves.Avalanche,
        Moves.Blizzard,
        Moves.Captivate,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Embargo,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.LightScreen,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Payback,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Spite,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
        Moves.Trick,
        Moves.WaterPulse,
      ],
    },
  });
}
