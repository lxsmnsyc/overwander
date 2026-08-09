import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

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
  Moves.Reflect,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.Rest,
  Moves.Explosion,
  Moves.Substitute,
  Moves.Surf,
];

const FAMILY_ABILITIES = [Abilities.Overcoat, Abilities.ShellArmor, Abilities.SkillLink];

export default function registerShellderSpecies(): void {
  registerSpecies(Species.Shellder, {
    dexNumber: 90,
    evolvesInto: [
      {
        species: Species.Cloyster,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Shellder',
    category: 'Bivalve Pokemon',
    family: Families.Shellder,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 65,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 40,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Withdraw],
        18: [Moves.Supersonic],
        23: [Moves.Clamp],
        30: [Moves.AuroraBeam],
        39: [Moves.Leer],
        50: [Moves.IceBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Cloyster, {
    dexNumber: 91,
    name: 'Cloyster',
    category: 'Bivalve Pokemon',
    family: Families.Shellder,
    evolvesFrom: Species.Shellder,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 95,
      [Stats.Defense]: 180,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Ice],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 60,
    learnSet: {
      level: {
        1: [Moves.Withdraw, Moves.Supersonic, Moves.Clamp, Moves.AuroraBeam],
        50: [Moves.SpikeCannon],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
