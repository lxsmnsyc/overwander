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
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Flash,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.ZapCannon,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Facade,
  Moves.SecretPower,
  Moves.ShockWave,
];

const FAMILY_ABILITIES = [Abilities.MagnetPull, Abilities.Sturdy];

export default function registerMagnemiteSpecies(): void {
  registerSpecies(Species.Magnemite, {
    dexNumber: 81,
    evolvesInto: [
      {
        species: Species.Magneton,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Magnemite',
    category: 'Magnet Pokemon',
    height: 0.3,
    weight: 6,
    family: Families.Magnemite,
    stats: {
      [Stats.HP]: 25,
      [Stats.Attack]: 35,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 45,
    },
    types: [Types.Electric, Types.Steel],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.MetalSound],
        6: [Moves.ThunderShock],
        11: [Moves.Supersonic],
        16: [Moves.SonicBoom],
        21: [Moves.ThunderWave],
        26: [Moves.Spark],
        27: [Moves.LockOn],
        33: [Moves.Swift],
        39: [Moves.Screech],
        45: [Moves.ZapCannon],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Magneton, {
    dexNumber: 82,
    name: 'Magneton',
    category: 'Magnet Pokemon',
    height: 1,
    weight: 60,
    family: Families.Magnemite,
    evolvesFrom: Species.Magnemite,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 60,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Electric, Types.Steel],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SonicBoom, Moves.ThunderShock, Moves.Supersonic, Moves.MetalSound],
        21: [Moves.ThunderWave],
        26: [Moves.Spark],
        27: [Moves.LockOn],
        35: [Moves.Swift, Moves.TriAttack],
        43: [Moves.Screech],
        53: [Moves.ZapCannon],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
