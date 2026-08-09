import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

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
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Metronome,
  Moves.SelfDestruct,
  Moves.FireBlast,
  Moves.RockSlide,
  Moves.Explosion,
  Moves.Rest,
  Moves.Substitute,
  Moves.Strength,
];

const FAMILY_ABILITIES = [Abilities.SandVeil, Abilities.RockHead, Abilities.Sturdy];

export default function registerGeodudeSpecies(): void {
  registerSpecies(Species.Geodude, {
    dexNumber: 74,
    name: 'Geodude',
    category: 'Rock Pokemon',
    family: Families.Geodude,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 80,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 20,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        11: [Moves.DefenseCurl],
        16: [Moves.RockThrow],
        21: [Moves.SelfDestruct],
        26: [Moves.Harden],
        31: [Moves.Earthquake],
        36: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Graveler, {
    dexNumber: 75,
    name: 'Graveler',
    category: 'Rock Pokemon',
    family: Families.Geodude,
    evolvesFrom: Species.Geodude,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 95,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 120,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.DefenseCurl],
        16: [Moves.RockThrow],
        21: [Moves.SelfDestruct],
        29: [Moves.Harden],
        36: [Moves.Earthquake],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Golem, {
    dexNumber: 76,
    name: 'Golem',
    category: 'Megaton Pokemon',
    family: Families.Geodude,
    evolvesFrom: Species.Graveler,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 120,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.DefenseCurl],
        16: [Moves.RockThrow],
        21: [Moves.SelfDestruct],
        29: [Moves.Harden],
        36: [Moves.Earthquake],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
