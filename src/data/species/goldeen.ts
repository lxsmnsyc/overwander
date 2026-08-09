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
  Moves.HornDrill,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

const FAMILY_ABILITIES = [Abilities.LightningRod, Abilities.SwiftSwim, Abilities.WaterVeil];

export default function registerGoldeenSpecies(): void {
  registerSpecies(Species.Goldeen, {
    dexNumber: 118,
    name: 'Goldeen',
    category: 'Goldfish Pokemon',
    family: Families.Goldeen,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 67,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 63,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 225,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.TailWhip],
        19: [Moves.Supersonic],
        24: [Moves.HornAttack],
        30: [Moves.FuryAttack],
        37: [Moves.Waterfall],
        45: [Moves.HornDrill],
        54: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Seaking, {
    dexNumber: 119,
    name: 'Seaking',
    category: 'Goldfish Pokemon',
    family: Families.Goldeen,
    evolvesFrom: Species.Goldeen,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 92,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 68,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 60,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.TailWhip, Moves.Supersonic],
        19: [Moves.Supersonic],
        24: [Moves.HornAttack],
        30: [Moves.FuryAttack],
        39: [Moves.Waterfall],
        48: [Moves.HornDrill],
        54: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
