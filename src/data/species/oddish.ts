import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Items } from '../ids/items';
import { Moves } from '../ids/moves';
import { EvolutionMethod, Species } from '../ids/species';
import { registerSpecies } from './__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
];

export default function registerOddishSpecies(): void {
  registerSpecies(Species.Oddish, {
    dexNumber: 43,
    evolvesInto: [
      {
        species: Species.Gloom,
        method: EvolutionMethod.Level,
        level: 21,
      },
    ],
    name: 'Oddish',
    category: 'Weed Pokemon',
    family: Families.Oddish,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 50,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.RunAway, Abilities.Chlorophyll],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        15: [Moves.PoisonPowder],
        17: [Moves.StunSpore],
        19: [Moves.SleepPowder],
        24: [Moves.Acid],
        33: [Moves.PetalDance],
        46: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Gloom, {
    dexNumber: 44,
    evolvesInto: [
      {
        species: Species.Vileplume,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
    ],
    name: 'Gloom',
    category: 'Weed Pokemon',
    family: Families.Oddish,
    evolvesFrom: Species.Oddish,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 65,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Stench, Abilities.Chlorophyll],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.PoisonPowder, Moves.StunSpore],
        19: [Moves.SleepPowder],
        28: [Moves.Acid],
        38: [Moves.PetalDance],
        52: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Vileplume, {
    dexNumber: 45,
    name: 'Vileplume',
    category: 'Flower Pokemon',
    family: Families.Oddish,
    evolvesFrom: Species.Gloom,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 50,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.EffectSpore, Abilities.Chlorophyll],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.PoisonPowder, Moves.PetalDance],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
