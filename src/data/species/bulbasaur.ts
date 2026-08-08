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
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
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

export function registerBulbasaurSpecies() {
  registerSpecies(Species.Bulbasaur, {
    dexNumber: 1,
    name: 'Bulbasaur',
    category: 'Seed Pokemon',
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 49,
      [Stats.Defense]: 49,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll, Abilities.Overgrow],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        20: [Moves.PoisonPowder],
        27: [Moves.RazorLeaf],
        34: [Moves.Growth],
        41: [Moves.SleepPowder],
        48: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Ivysaur, {
    dexNumber: 2,
    name: 'Ivysaur',
    category: 'Seed Pokemon',
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 62,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll, Abilities.Overgrow],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        22: [Moves.PoisonPowder],
        30: [Moves.RazorLeaf],
        38: [Moves.Growth],
        46: [Moves.SleepPowder],
        54: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Venusaur, {
    dexNumber: 3,
    name: 'Venusaur',
    category: 'Seed Pokemon',
    family: Families.Bulbasaur,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 82,
      [Stats.Defense]: 83,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.Chlorophyll, Abilities.Overgrow],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.LeechSeed, Moves.VineWhip],
        7: [Moves.LeechSeed],
        13: [Moves.VineWhip],
        22: [Moves.PoisonPowder],
        30: [Moves.RazorLeaf],
        43: [Moves.Growth],
        55: [Moves.SleepPowder],
        65: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
