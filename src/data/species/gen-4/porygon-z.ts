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
 * A Porygon2 somebody patched badly: a Porygon-Z moves in ways nobody
 * wrote down and is faster for it
 */
export default function registerPorygonZSpecies(): void {
  registerSpecies(Species.PorygonZ, {
    dexNumber: 474,
    name: 'PorygonZ',
    category: 'Virtual Pokemon',
    height: 0.9,
    weight: 34.0,
    family: Families.Porygon,
    evolvesFrom: Species.Porygon2,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 80,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 135,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.Adaptability, Abilities.Download],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 30,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Conversion, Moves.Conversion2, Moves.NastyPlot, Moves.Tackle, Moves.TrickRoom],
        7: [Moves.Psybeam],
        12: [Moves.Agility],
        18: [Moves.Recover],
        23: [Moves.MagnetRise],
        29: [Moves.SignalBeam],
        34: [Moves.Embargo],
        40: [Moves.Discharge],
        45: [Moves.LockOn],
        51: [Moves.TriAttack],
        56: [Moves.MagicCoat],
        62: [Moves.ZapCannon],
        67: [Moves.HyperBeam],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Blizzard,
        Moves.ChargeBeam,
        Moves.DarkPulse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Embargo,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.LastResort,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Rest,
        Moves.Return,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.Trick,
        Moves.TrickRoom,
        Moves.Uproar,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
