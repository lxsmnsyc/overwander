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
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Cut,
];

export default function registerDiglettSpecies(): void {
  registerSpecies(Species.Diglett, {
    dexNumber: 50,
    evolvesInto: [
      {
        species: Species.Dugtrio,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Diglett',
    category: 'Mole Pokemon',
    family: Families.Diglett,
    stats: {
      [Stats.HP]: 10,
      [Stats.Attack]: 55,
      [Stats.Defense]: 25,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 95,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandForce, Abilities.SandVeil, Abilities.ArenaTrap],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Desert, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        15: [Moves.Growl],
        19: [Moves.Dig],
        24: [Moves.SandAttack],
        31: [Moves.Slash],
        40: [Moves.Earthquake],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Dugtrio, {
    dexNumber: 51,
    name: 'Dugtrio',
    category: 'Mole Pokemon',
    family: Families.Diglett,
    evolvesFrom: Species.Diglett,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 100,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 120,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandForce, Abilities.SandVeil, Abilities.ArenaTrap],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 50,
    biomes: [Biome.Mountain, Biome.Desert, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.Dig],
        15: [Moves.Growl],
        19: [Moves.Dig],
        24: [Moves.SandAttack],
        35: [Moves.Slash],
        47: [Moves.Earthquake],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
