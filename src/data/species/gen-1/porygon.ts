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

export default function registerPorygonSpecies(): void {
  registerSpecies(Species.Porygon, {
    dexNumber: 137,
    evolvesInto: [
      {
        species: Species.Porygon2,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.UpGrade,
      },
    ],
    name: 'Porygon',
    category: 'Virtual Pokemon',
    height: 0.8,
    weight: 36.5,
    family: Families.Porygon,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 60,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
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
        1: [Moves.Tackle, Moves.Sharpen, Moves.Conversion, Moves.Conversion2],
        9: [Moves.Agility],
        12: [Moves.Psybeam],
        20: [Moves.Recover],
        32: [Moves.LockOn],
        36: [Moves.TriAttack],
        44: [Moves.ZapCannon, Moves.Recycle],
      },
      teachable: [
        Moves.Toxic,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Swift,
        Moves.SkullBash,
        Moves.Rest,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.TriAttack,
        Moves.Substitute,
        Moves.Flash,
        Moves.DreamEater,
        Moves.Thief,
        Moves.Nightmare,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.ZapCannon,
        Moves.IcyWind,
        Moves.Endure,
        Moves.Swagger,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.IronTail,
        Moves.HiddenPower,
        Moves.RainDance,
        Moves.SunnyDay,
        Moves.PsychUp,

        Moves.AerialAce,
        Moves.Facade,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SolarBeam,
      ],
    },
  });
}
