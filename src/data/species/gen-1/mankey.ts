import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
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
  Moves.PayDay,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Metronome,
  Moves.SkullBash,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Strength,
];

export default function registerMankeySpecies(): void {
  registerSpecies(Species.Mankey, {
    dexNumber: 56,
    evolvesInto: [
      {
        species: Species.Primeape,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Mankey',
    category: 'Pig Monkey Pokemon',
    family: Families.Mankey,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 80,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 70,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Defiant, Abilities.VitalSpirit, Abilities.AngerPoint],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer],
        15: [Moves.KarateChop],
        21: [Moves.FurySwipes],
        27: [Moves.FocusEnergy],
        33: [Moves.SeismicToss],
        39: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Primeape, {
    dexNumber: 57,
    name: 'Primeape',
    category: 'Pig Monkey Pokemon',
    family: Families.Mankey,
    evolvesFrom: Species.Mankey,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 105,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 95,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Defiant, Abilities.VitalSpirit, Abilities.AngerPoint],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer, Moves.KarateChop],
        15: [Moves.KarateChop],
        21: [Moves.FurySwipes],
        27: [Moves.FocusEnergy],
        37: [Moves.SeismicToss],
        46: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
