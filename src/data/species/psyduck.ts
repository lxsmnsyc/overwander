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
  Moves.PayDay,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Strength,
];

export default function registerPsyduckSpecies(): void {
  registerSpecies(Species.Psyduck, {
    dexNumber: 54,
    name: 'Psyduck',
    category: 'Duck Pokemon',
    family: Families.Psyduck,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 52,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 55,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.Damp, Abilities.CloudNine],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        28: [Moves.TailWhip],
        31: [Moves.Disable],
        36: [Moves.Confusion],
        43: [Moves.FurySwipes],
        52: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Golduck, {
    dexNumber: 55,
    name: 'Golduck',
    category: 'Duck Pokemon',
    family: Families.Psyduck,
    evolvesFrom: Species.Psyduck,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 82,
      [Stats.Defense]: 78,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.Damp, Abilities.CloudNine],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.TailWhip, Moves.Disable],
        28: [Moves.TailWhip],
        31: [Moves.Disable],
        39: [Moves.Confusion],
        48: [Moves.FurySwipes],
        59: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
