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
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

export default function registerHorseaSpecies(): void {
  registerSpecies(Species.Horsea, {
    dexNumber: 116,
    name: 'Horsea',
    category: 'Dragon Pokemon',
    family: Families.Horsea,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 40,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 60,
    },
    types: [Types.Water],
    abilities: [Abilities.Damp, Abilities.SwiftSwim, Abilities.Sniper],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 225,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        19: [Moves.SmokeScreen],
        24: [Moves.Leer],
        30: [Moves.WaterGun],
        37: [Moves.Agility],
        45: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Seadra, {
    dexNumber: 117,
    name: 'Seadra',
    category: 'Dragon Pokemon',
    family: Families.Horsea,
    evolvesFrom: Species.Horsea,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 65,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [Abilities.Damp, Abilities.PoisonPoint, Abilities.Sniper],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.SmokeScreen],
        19: [Moves.SmokeScreen],
        24: [Moves.Leer],
        30: [Moves.WaterGun],
        41: [Moves.Agility],
        52: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
