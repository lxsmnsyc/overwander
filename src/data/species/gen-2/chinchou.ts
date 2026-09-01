import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.IceBeam,
  Moves.Surf,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.ZapCannon,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.Waterfall,
];

const FAMILY_ABILITIES = [Abilities.VoltAbsorb, Abilities.Illuminate];

export default function registerChinchouSpecies(): void {
  registerSpecies(Species.Chinchou, {
    dexNumber: 170,
    evolvesInto: [
      {
        species: Species.Lanturn,
        method: EvolutionMethod.Level,
        level: 27,
      },
    ],
    name: 'Chinchou',
    category: 'Angler Pokemon',
    height: 0.5,
    weight: 12,
    family: Families.Chinchou,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 38,
      [Stats.Defense]: 38,
      [Stats.SpecialAttack]: 56,
      [Stats.SpecialDefense]: 56,
      [Stats.Speed]: 67,
    },
    types: [Types.Water, Types.Electric],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.WaterAbsorb],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.DeepOcean, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.ThunderWave],
        5: [Moves.Supersonic],
        13: [Moves.Flail],
        17: [Moves.WaterGun],
        25: [Moves.Spark],
        29: [Moves.ConfuseRay],
        37: [Moves.TakeDown],
        41: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Screech],
    },
  });

  registerSpecies(Species.Lanturn, {
    dexNumber: 171,
    name: 'Lanturn',
    category: 'Light Pokemon',
    height: 1.2,
    weight: 22.5,
    family: Families.Chinchou,
    evolvesFrom: Species.Chinchou,
    stats: {
      [Stats.HP]: 125,
      [Stats.Attack]: 58,
      [Stats.Defense]: 58,
      [Stats.SpecialAttack]: 76,
      [Stats.SpecialDefense]: 76,
      [Stats.Speed]: 67,
    },
    types: [Types.Water, Types.Electric],
    abilities: [...FAMILY_ABILITIES],
    // Hydration is this registry's rather than the mainline's,
    // filling a final evolution to four: the deep water it lives in
    // washes off whatever it picked up nearer the surface
    hiddenAbilities: [Abilities.WaterAbsorb, Abilities.Hydration],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.DeepOcean, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Supersonic, Moves.ThunderWave],
        13: [Moves.Flail],
        17: [Moves.WaterGun],
        25: [Moves.Spark],
        33: [Moves.ConfuseRay],
        45: [Moves.TakeDown],
        53: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
