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
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.PayDay,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

export default function registerMeowthSpecies(): void {
  registerSpecies(Species.Meowth, {
    dexNumber: 52,
    name: 'Meowth',
    category: 'Scratch Cat Pokemon',
    family: Families.Meowth,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.Unnerve, Abilities.Pickup, Abilities.Technician],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl],
        12: [Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        33: [Moves.FurySwipes],
        44: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Persian, {
    dexNumber: 53,
    name: 'Persian',
    category: 'Classy Cat Pokemon',
    family: Families.Meowth,
    evolvesFrom: Species.Meowth,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 70,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 115,
    },
    types: [Types.Normal],
    abilities: [Abilities.Unnerve, Abilities.Limber, Abilities.Technician],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl],
        12: [Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        37: [Moves.FurySwipes],
        51: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
