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
  // What a Kadabra comes out of the evolution knowing, taken across
  // both halves of the generation: Red and Blue start it with
  // Teleport, Confusion and Disable, and Yellow drops the latter two
  // from the first level and starts it with Kinesis instead — the
  // spoon-bending it is named for, which nothing at all could learn
  // in Red and Blue. There is one Kadabra here rather than two, so it
  // knows what a Gen 1 Kadabra could know
  1: [Moves.Teleport, Moves.Kinesis, Moves.Confusion, Moves.Disable],
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
    height: 0.9,
    weight: 19.5,
    family: Families.Abra,
    stats: ABRA_STATS,
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize, Abilities.InnerFocus],
    hiddenAbilities: [Abilities.MagicGuard],
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
      egg: [Moves.Barrier, Moves.FirePunch, Moves.IcePunch, Moves.ThunderPunch],
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
    height: 1.3,
    weight: 56.5,
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
    hiddenAbilities: [Abilities.MagicGuard],
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
    height: 1.5,
    weight: 48,
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
    hiddenAbilities: [Abilities.MagicGuard, Abilities.Forewarn],
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
