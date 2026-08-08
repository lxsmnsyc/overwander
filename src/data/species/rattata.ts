import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import { Abilities } from '../ids/abilities';
import { EggGroups } from '../ids/egg-groups';
import { Families } from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

export function registerRattataSpecies() {
  registerSpecies(Species.Rattata, {
    dexNumber: 19,
    name: 'Rattata',
    category: 'Mouse Pokemon',
    family: Families.Rattata,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 56,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 72,
    },
    types: [Types.Normal],
    abilities: [Abilities.Hustle, Abilities.RunAway, Abilities.Guts],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip],
        7: [Moves.QuickAttack],
        14: [Moves.HyperFang],
        23: [Moves.FocusEnergy],
        34: [Moves.SuperFang],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Raticate, {
    dexNumber: 20,
    name: 'Raticate',
    category: 'Mouse Pokemon',
    family: Families.Rattata,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 81,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 97,
    },
    types: [Types.Normal],
    abilities: [Abilities.Hustle, Abilities.RunAway, Abilities.Guts],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 127,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.QuickAttack],
        7: [Moves.QuickAttack],
        14: [Moves.HyperFang],
        27: [Moves.FocusEnergy],
        41: [Moves.SuperFang],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.IceBeam, Moves.HyperBeam],
    },
  });
}
