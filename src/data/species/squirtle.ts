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
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Surf,
  Moves.Strength,
];

export default function registerSquirtleSpecies(): void {
  registerSpecies(Species.Squirtle, {
    dexNumber: 7,
    name: 'Squirtle',
    category: 'Tiny Turtle Pokemon',
    family: Families.Squirtle,
    stats: {
      [Stats.HP]: 44,
      [Stats.Attack]: 48,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 64,
      [Stats.Speed]: 43,
    },
    types: [Types.Water],
    abilities: [Abilities.RainDish, Abilities.Torrent],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip],
        8: [Moves.Bubble],
        15: [Moves.WaterGun],
        22: [Moves.Bite],
        28: [Moves.Withdraw],
        35: [Moves.SkullBash],
        42: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Wartortle, {
    dexNumber: 8,
    name: 'Wartortle',
    category: 'Turtle Pokemon',
    family: Families.Squirtle,
    stats: {
      [Stats.HP]: 59,
      [Stats.Attack]: 63,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 58,
    },
    types: [Types.Water],
    abilities: [Abilities.RainDish, Abilities.Torrent],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.Bubble],
        8: [Moves.Bubble],
        15: [Moves.WaterGun],
        24: [Moves.Bite],
        31: [Moves.Withdraw],
        39: [Moves.SkullBash],
        47: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Blastoise, {
    dexNumber: 9,
    name: 'Blastoise',
    category: 'Shellfish Pokemon',
    family: Families.Squirtle,
    stats: {
      [Stats.HP]: 79,
      [Stats.Attack]: 83,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 78,
    },
    types: [Types.Water],
    abilities: [Abilities.RainDish, Abilities.Torrent],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.Bubble, Moves.WaterGun],
        8: [Moves.Bubble],
        15: [Moves.WaterGun],
        24: [Moves.Bite],
        31: [Moves.Withdraw],
        42: [Moves.SkullBash],
        52: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Earthquake, Moves.Fissure],
    },
  });
}
