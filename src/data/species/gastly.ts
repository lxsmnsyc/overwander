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
  Moves.Toxic,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Psychic,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.DreamEater,
  Moves.Rest,
  Moves.Explosion,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.Levitate];

const FAMILY_STATS = {
  gastly: {
    [Stats.HP]: 30,
    [Stats.Attack]: 35,
    [Stats.Defense]: 30,
    [Stats.SpecialAttack]: 100,
    [Stats.SpecialDefense]: 35,
    [Stats.Speed]: 80,
  },
  haunter: {
    [Stats.HP]: 45,
    [Stats.Attack]: 50,
    [Stats.Defense]: 45,
    [Stats.SpecialAttack]: 115,
    [Stats.SpecialDefense]: 55,
    [Stats.Speed]: 95,
  },
  gengar: {
    [Stats.HP]: 60,
    [Stats.Attack]: 65,
    [Stats.Defense]: 60,
    [Stats.SpecialAttack]: 130,
    [Stats.SpecialDefense]: 75,
    [Stats.Speed]: 110,
  },
};

export default function registerGastlySpecies(): void {
  registerSpecies(Species.Gastly, {
    dexNumber: 92,
    name: 'Gastly',
    category: 'Gas Pokemon',
    family: Families.Gastly,
    stats: FAMILY_STATS.gastly,
    types: [Types.Ghost, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Lick, Moves.ConfuseRay, Moves.NightShade],
        27: [Moves.Hypnosis],
        35: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Haunter, {
    dexNumber: 93,
    name: 'Haunter',
    category: 'Gas Pokemon',
    family: Families.Gastly,
    evolvesFrom: Species.Gastly,
    stats: FAMILY_STATS.haunter,
    types: [Types.Ghost, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 90,
    learnSet: {
      level: {
        1: [Moves.Lick, Moves.ConfuseRay, Moves.NightShade],
        29: [Moves.Hypnosis],
        38: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Gengar, {
    dexNumber: 94,
    name: 'Gengar',
    category: 'Shadow Pokemon',
    family: Families.Gastly,
    evolvesFrom: Species.Haunter,
    stats: FAMILY_STATS.gengar,
    types: [Types.Ghost, Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Lick, Moves.ConfuseRay, Moves.NightShade],
        29: [Moves.Hypnosis],
        38: [Moves.DreamEater],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.SeismicToss,
        Moves.Counter,
        Moves.HyperBeam,
        Moves.Strength,
      ],
    },
  });
}
