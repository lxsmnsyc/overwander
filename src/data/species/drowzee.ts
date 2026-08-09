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
  Moves.MegaPunch,
  Moves.MegaKick,
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

const FAMILY_ABILITIES = [Abilities.InnerFocus, Abilities.Insomnia, Abilities.Forewarn];

export default function registerDrowzeeSpecies(): void {
  registerSpecies(Species.Drowzee, {
    dexNumber: 96,
    evolvesInto: [
      {
        species: Species.Hypno,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Drowzee',
    category: 'Hypnosis Pokemon',
    family: Families.Drowzee,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 48,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 43,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 42,
    },
    types: [Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Hypnosis],
        12: [Moves.Disable],
        17: [Moves.Confusion],
        24: [Moves.Headbutt],
        29: [Moves.PoisonGas],
        32: [Moves.Psychic],
        37: [Moves.Meditate],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Hypno, {
    dexNumber: 97,
    name: 'Hypno',
    category: 'Hypnosis Pokemon',
    family: Families.Drowzee,
    evolvesFrom: Species.Drowzee,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 73,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 73,
      [Stats.SpecialDefense]: 115,
      [Stats.Speed]: 67,
    },
    types: [Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Hypnosis],
        12: [Moves.Disable],
        17: [Moves.Confusion],
        24: [Moves.Headbutt],
        33: [Moves.PoisonGas],
        37: [Moves.Psychic],
        43: [Moves.Meditate],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
