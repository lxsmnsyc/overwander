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
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.PayDay,
  Moves.Rage,
  Moves.Dig,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Surf,
  Moves.Strength,
  Moves.Flash,
];

// Slowbro's claws open up the fighting-style TMs
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
];

const FAMILY_ABILITIES = [Abilities.Oblivious, Abilities.OwnTempo];

export default function registerSlowpokeSpecies(): void {
  registerSpecies(Species.Slowpoke, {
    dexNumber: 79,
    evolvesInto: [
      {
        species: Species.Slowbro,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Slowpoke',
    category: 'Dopey Pokemon',
    height: 1.2,
    weight: 36,
    family: Families.Slowpoke,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 15,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Regenerator],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Confusion],
        18: [Moves.Disable],
        22: [Moves.Headbutt],
        27: [Moves.Growl],
        33: [Moves.WaterGun],
        40: [Moves.Amnesia],
        48: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Slowbro, {
    dexNumber: 80,
    name: 'Slowbro',
    category: 'Hermit Crab Pokemon',
    height: 1.6,
    weight: 78.5,
    family: Families.Slowpoke,
    evolvesFrom: Species.Slowpoke,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 75,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 30,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Regenerator, Abilities.Unaware],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Disable, Moves.Headbutt],
        18: [Moves.Disable],
        22: [Moves.Headbutt],
        27: [Moves.Growl],
        33: [Moves.WaterGun],
        37: [Moves.Withdraw],
        44: [Moves.Amnesia],
        55: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE, Moves.HyperBeam],
    },
  });
}
