import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { EvolutionMethod, Species } from '../ids/species';
import { registerSpecies } from './__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.FireBlast,
  Moves.Rest,
  Moves.Explosion,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.Stench, Abilities.Levitate, Abilities.NeutralizingGas];

export default function registerKoffingSpecies(): void {
  registerSpecies(Species.Koffing, {
    dexNumber: 109,
    evolvesInto: [
      {
        species: Species.Weezing,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Koffing',
    category: 'Poison Gas Pokemon',
    family: Families.Koffing,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 65,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Smog],
        32: [Moves.Sludge],
        37: [Moves.SmokeScreen],
        40: [Moves.SelfDestruct],
        45: [Moves.Haze],
        48: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Weezing, {
    dexNumber: 110,
    name: 'Weezing',
    category: 'Poison Gas Pokemon',
    family: Families.Koffing,
    evolvesFrom: Species.Koffing,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 60,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 60,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Smog, Moves.Sludge],
        39: [Moves.SmokeScreen],
        43: [Moves.SelfDestruct],
        49: [Moves.Haze],
        53: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
