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
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

export default function registerVulpixSpecies(): void {
  registerSpecies(Species.Vulpix, {
    dexNumber: 37,
    evolvesInto: [
      {
        species: Species.Ninetales,
        method: EvolutionMethod.UsedItem,
        item: Items.FireStone,
      },
    ],
    name: 'Vulpix',
    category: 'Fox Pokemon',
    family: Families.Vulpix,
    stats: {
      [Stats.HP]: 38,
      [Stats.Attack]: 41,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.Drought, Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.TailWhip],
        16: [Moves.QuickAttack],
        21: [Moves.Roar],
        28: [Moves.ConfuseRay],
        35: [Moves.Flamethrower],
        42: [Moves.FireSpin],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Ninetales, {
    dexNumber: 38,
    name: 'Ninetales',
    category: 'Fox Pokemon',
    family: Families.Vulpix,
    evolvesFrom: Species.Vulpix,
    stats: {
      [Stats.HP]: 73,
      [Stats.Attack]: 76,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 81,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Fire],
    abilities: [Abilities.Drought, Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.TailWhip, Moves.QuickAttack, Moves.Roar],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
