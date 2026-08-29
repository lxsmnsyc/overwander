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
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Cut,
  Moves.Strength,
];

export default function registerSandshrewSpecies(): void {
  registerSpecies(Species.Sandshrew, {
    dexNumber: 27,
    evolvesInto: [
      {
        species: Species.Sandslash,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Sandshrew',
    category: 'Mouse Pokemon',
    height: 0.6,
    weight: 12,
    family: Families.Sandshrew,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 40,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandVeil],
    hiddenAbilities: [Abilities.SandRush],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Desert],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        10: [Moves.SandAttack],
        17: [Moves.Slash],
        24: [Moves.PoisonSting],
        31: [Moves.Swift],
        38: [Moves.FurySwipes],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Counter, Moves.Swift],
    },
  });

  registerSpecies(Species.Sandslash, {
    dexNumber: 28,
    name: 'Sandslash',
    category: 'Mouse Pokemon',
    height: 1,
    weight: 29.5,
    family: Families.Sandshrew,
    evolvesFrom: Species.Sandshrew,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 100,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 65,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandVeil],
    hiddenAbilities: [Abilities.SandRush, Abilities.SandForce, Abilities.RoughSkin],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Desert],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.SandAttack],
        10: [Moves.SandAttack],
        17: [Moves.Slash],
        27: [Moves.PoisonSting],
        36: [Moves.Swift],
        47: [Moves.FurySwipes],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
