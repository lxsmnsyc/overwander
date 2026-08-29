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
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.HornDrill,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

const FAMILY_ABILITIES = [Abilities.SwiftSwim, Abilities.WaterVeil];

export default function registerGoldeenSpecies(): void {
  registerSpecies(Species.Goldeen, {
    dexNumber: 118,
    evolvesInto: [
      {
        species: Species.Seaking,
        method: EvolutionMethod.Level,
        level: 33,
      },
    ],
    name: 'Goldeen',
    category: 'Goldfish Pokemon',
    height: 0.6,
    weight: 15,
    family: Families.Goldeen,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 67,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 63,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.LightningRod],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Swamp, Biome.Beach],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.TailWhip],
        19: [Moves.Supersonic],
        24: [Moves.HornAttack],
        30: [Moves.FuryAttack],
        37: [Moves.Waterfall],
        45: [Moves.HornDrill],
        54: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Psybeam, Moves.Haze, Moves.HydroPump],
    },
  });

  registerSpecies(Species.Seaking, {
    dexNumber: 119,
    name: 'Seaking',
    category: 'Goldfish Pokemon',
    height: 1.3,
    weight: 39,
    family: Families.Goldeen,
    evolvesFrom: Species.Goldeen,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 92,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 68,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.LightningRod, Abilities.MoldBreaker],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Swamp, Biome.Beach],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.TailWhip, Moves.Supersonic],
        19: [Moves.Supersonic],
        24: [Moves.HornAttack],
        30: [Moves.FuryAttack],
        39: [Moves.Waterfall],
        48: [Moves.HornDrill],
        54: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
