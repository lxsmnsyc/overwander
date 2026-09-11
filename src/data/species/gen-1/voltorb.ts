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
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.Swift,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Explosion,
  Moves.Substitute,
  Moves.Flash,
  Moves.Headbutt,
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
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
];

const FAMILY_ABILITIES = [Abilities.Soundproof, Abilities.Static];

export default function registerVoltorbSpecies(): void {
  registerSpecies(Species.Voltorb, {
    dexNumber: 100,
    evolvesInto: [
      {
        species: Species.Electrode,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Voltorb',
    category: 'Ball Pokemon',
    height: 0.5,
    weight: 10.4,
    family: Families.Voltorb,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 30,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 100,
    },
    types: [Types.Electric],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Aftermath],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech, Moves.Charge],
        17: [Moves.SonicBoom],
        21: [Moves.Spark],
        22: [Moves.SelfDestruct],
        29: [Moves.LightScreen, Moves.Rollout],
        36: [Moves.Swift],
        39: [Moves.Explosion],
        41: [Moves.MirrorCoat],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Electrode, {
    dexNumber: 101,
    name: 'Electrode',
    category: 'Ball Pokemon',
    height: 1.2,
    weight: 66.6,
    family: Families.Voltorb,
    evolvesFrom: Species.Voltorb,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 150,
    },
    types: [Types.Electric],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Aftermath, Abilities.Levitate],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech, Moves.SonicBoom, Moves.SelfDestruct, Moves.Charge],
        21: [Moves.Spark],
        29: [Moves.Rollout],
        31: [Moves.LightScreen],
        40: [Moves.Swift],
        44: [Moves.Explosion],
        48: [Moves.MirrorCoat],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
