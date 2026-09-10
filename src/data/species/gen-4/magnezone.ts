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
 * Three magnets that agreed to be one thing: a Magnezone puts out a
 * field strong enough to pull the ground up around it
 */
export default function registerMagnezoneSpecies(): void {
  registerSpecies(Species.Magnezone, {
    dexNumber: 462,
    name: 'Magnezone',
    category: 'Magnet Area Pokemon',
    height: 1.2,
    weight: 180.0,
    family: Families.Magnemite,
    evolvesFrom: Species.Magneton,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 70,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 60,
    },
    types: [Types.Electric, Types.Steel],
    abilities: [Abilities.MagnetPull, Abilities.Sturdy],
    // Levitate is this registry's rather than the mainline's: it
    // hangs in the air in every picture of it, and Electric with Steel
    // takes Ground at 4x
    hiddenAbilities: [Abilities.Analytic, Abilities.Levitate],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 30,
    biomes: [Biome.Mountain, Biome.Badlands, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Barrier,
          Moves.MetalSound,
          Moves.MirrorCoat,
          Moves.Supersonic,
          Moves.Tackle,
          Moves.ThunderShock,
        ],
        6: [Moves.ThunderShock],
        11: [Moves.Supersonic],
        14: [Moves.SonicBoom],
        17: [Moves.ThunderWave],
        22: [Moves.Spark],
        27: [Moves.LockOn],
        30: [Moves.MagnetBomb],
        34: [Moves.Screech],
        40: [Moves.Discharge],
        46: [Moves.MirrorShot],
        50: [Moves.MagnetRise],
        54: [Moves.GyroBall],
        60: [Moves.ZapCannon],
      },
      teachable: [
        Moves.ChargeBeam,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.Flash,
        Moves.FlashCannon,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.GyroBall,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.LightScreen,
        Moves.MagnetRise,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
      ],
    },
  });
}
