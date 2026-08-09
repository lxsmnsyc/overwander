import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Metronome,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Flash,
];

const ABRA_STATS = {
  [Stats.HP]: 25,
  [Stats.Attack]: 20,
  [Stats.Defense]: 15,
  [Stats.SpecialAttack]: 105,
  [Stats.SpecialDefense]: 55,
  [Stats.Speed]: 90,
};

const KADABRA_LEVEL_MOVES = {
  1: [Moves.Teleport, Moves.Confusion, Moves.Disable],
  16: [Moves.Confusion],
  20: [Moves.Disable],
  27: [Moves.Psybeam],
  31: [Moves.Recover],
  38: [Moves.Psychic],
  42: [Moves.Reflect],
};

export default function registerAbraSpecies(): void {
  registerSpecies(Species.Abra, {
    dexNumber: 63,
    evolvesInto: [
      {
        species: Species.Kadabra,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Abra',
    category: 'Psi Pokemon',
    family: Families.Abra,
    stats: ABRA_STATS,
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize, Abilities.InnerFocus],
    hiddenAbility: Abilities.MagicGuard,
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 200,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Teleport],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Kadabra, {
    dexNumber: 64,
    evolvesInto: [
      {
        species: Species.Alakazam,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Kadabra',
    category: 'Psi Pokemon',
    family: Families.Abra,
    evolvesFrom: Species.Abra,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 35,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 105,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize, Abilities.InnerFocus],
    hiddenAbility: Abilities.MagicGuard,
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 100,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: { ...KADABRA_LEVEL_MOVES },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Alakazam, {
    dexNumber: 65,
    name: 'Alakazam',
    category: 'Psi Pokemon',
    family: Families.Abra,
    evolvesFrom: Species.Kadabra,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 50,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 135,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 120,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize, Abilities.InnerFocus],
    hiddenAbility: Abilities.MagicGuard,
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 50,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: { ...KADABRA_LEVEL_MOVES },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
