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
  Moves.MegaPunch,
  Moves.SwordsDance,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.DragonRage,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Strength,
];

export default function registerCharmanderSpecies(): void {
  registerSpecies(Species.Charmander, {
    dexNumber: 4,
    evolvesInto: [
      {
        species: Species.Charmeleon,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Charmander',
    category: 'Lizard Pokemon',
    family: Families.Charmander,
    stats: {
      [Stats.HP]: 39,
      [Stats.Attack]: 52,
      [Stats.Defense]: 43,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.SolarPower, Abilities.Blaze],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl],
        9: [Moves.Ember],
        15: [Moves.Leer],
        22: [Moves.Rage],
        30: [Moves.Slash],
        38: [Moves.Flamethrower],
        46: [Moves.FireSpin],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Charmeleon, {
    dexNumber: 5,
    evolvesInto: [
      {
        species: Species.Charizard,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Charmeleon',
    category: 'Flame Pokemon',
    family: Families.Charmander,
    evolvesFrom: Species.Charmander,
    stats: {
      [Stats.HP]: 58,
      [Stats.Attack]: 64,
      [Stats.Defense]: 58,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 80,
    },
    types: [Types.Fire],
    abilities: [Abilities.SolarPower, Abilities.Blaze],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.Ember],
        9: [Moves.Ember],
        15: [Moves.Leer],
        24: [Moves.Rage],
        33: [Moves.Slash],
        42: [Moves.Flamethrower],
        56: [Moves.FireSpin],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Charizard, {
    dexNumber: 6,
    name: 'Charizard',
    category: 'Flame Pokemon',
    family: Families.Charmander,
    evolvesFrom: Species.Charmeleon,
    stats: {
      [Stats.HP]: 78,
      [Stats.Attack]: 84,
      [Stats.Defense]: 78,
      [Stats.SpecialAttack]: 109,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 100,
    },
    types: [Types.Fire, Types.Flying],
    abilities: [Abilities.SolarPower, Abilities.Blaze],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.Ember, Moves.Leer],
        9: [Moves.Ember],
        15: [Moves.Leer],
        24: [Moves.Rage],
        36: [Moves.Slash],
        46: [Moves.Flamethrower],
        55: [Moves.FireSpin],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Earthquake, Moves.Fissure, Moves.Fly],
    },
  });
}
