import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.IceBeam,
  Moves.Surf,
  Moves.Earthquake,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.Sandstorm,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.IcePunch,
  Moves.DynamicPunch,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Blizzard,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.Mimic,
  Moves.SecretPower,
  Moves.Substitute,
  Moves.WaterPulse,
  Moves.Waterfall,
];

const FAMILY_ABILITIES = [Abilities.Damp, Abilities.WaterAbsorb];

export default function registerWooperSpecies(): void {
  registerSpecies(Species.Wooper, {
    dexNumber: 194,
    evolvesInto: [
      {
        species: Species.Quagsire,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Wooper',
    category: 'Water Fish Pokemon',
    height: 0.4,
    weight: 8.5,
    family: Families.Wooper,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 45,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 15,
    },
    types: [Types.Water, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Unaware],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Swamp, Biome.Bog, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        16: [Moves.MudShot],
        1: [Moves.TailWhip, Moves.WaterGun],
        11: [Moves.Slam],
        21: [Moves.Amnesia],
        31: [Moves.Earthquake, Moves.Yawn],
        41: [Moves.RainDance],
        51: [Moves.Haze, Moves.Mist],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AncientPower,
        Moves.BodySlam,
        Moves.Safeguard,
        Moves.MudSport,
        Moves.SpitUp,
        Moves.Stockpile,
        Moves.Swallow,
      ],
    },
  });

  registerSpecies(Species.Quagsire, {
    dexNumber: 195,
    name: 'Quagsire',
    category: 'Water Fish Pokemon',
    height: 1.4,
    weight: 75,
    family: Families.Wooper,
    evolvesFrom: Species.Wooper,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 85,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 35,
    },
    types: [Types.Water, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    // Oblivious is this registry's rather than the mainline's,
    // filling a final evolution to four: nothing it is told and
    // nothing aimed at it gets through to it
    hiddenAbilities: [Abilities.Unaware, Abilities.Oblivious],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Swamp, Biome.Bog, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        16: [Moves.MudShot],
        1: [Moves.TailWhip, Moves.WaterGun],
        11: [Moves.Slam],
        23: [Moves.Amnesia],
        35: [Moves.Earthquake, Moves.Yawn],
        47: [Moves.RainDance],
        59: [Moves.Haze, Moves.Mist],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Strength,
        Moves.HyperBeam,
        Moves.BodySlam,
        Moves.BrickBreak,
        Moves.Counter,
        Moves.FocusPunch,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.RockTomb,
        Moves.SeismicToss,
      ],
    },
  });
}
