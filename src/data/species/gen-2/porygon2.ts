import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerPorygon2Species(): void {
  registerSpecies(Species.Porygon2, {
    dexNumber: 233,
    evolvesInto: [
      {
        species: Species.PorygonZ,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.DubiousDisc,
      },
    ],
    name: 'Porygon2',
    category: 'Virtual Pokemon',
    height: 0.6,
    weight: 32.5,
    family: Families.Porygon,
    evolvesFrom: Species.Porygon,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 80,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 60,
    },
    types: [Types.Normal],
    abilities: [Abilities.Trace, Abilities.Download],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Conversion, Moves.Conversion2, Moves.Tackle],
        9: [Moves.Agility],
        12: [Moves.Psybeam],
        20: [Moves.Recover],
        23: [Moves.MagnetRise],
        24: [Moves.DefenseCurl],
        32: [Moves.LockOn],
        36: [Moves.TriAttack],
        40: [Moves.Discharge],
        44: [Moves.ZapCannon, Moves.Recycle],
      },
      teachable: [
        Moves.Blizzard,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Thunder,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZapCannon,

        Moves.AerialAce,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Mimic,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.ThunderWave,
        Moves.ChargeBeam,
        Moves.GigaImpact,
        Moves.Gravity,
        Moves.LastResort,
        Moves.NaturalGift,
        Moves.TrickRoom,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
