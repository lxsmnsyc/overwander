import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
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
    hiddenAbility: Abilities.Aftermath,
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 190,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech],
        17: [Moves.SonicBoom],
        22: [Moves.SelfDestruct],
        29: [Moves.LightScreen],
        36: [Moves.Swift],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Electrode, {
    dexNumber: 101,
    name: 'Electrode',
    category: 'Ball Pokemon',
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
    hiddenAbility: Abilities.Aftermath,
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech, Moves.SonicBoom],
        17: [Moves.SonicBoom],
        22: [Moves.SelfDestruct],
        31: [Moves.LightScreen],
        40: [Moves.Swift],
        50: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
