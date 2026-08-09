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
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

// Additional TM/HM moves for the fully evolved form
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.IceBeam,
  Moves.HyperBeam,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.FireBlast,
  Moves.RockSlide,
  Moves.Surf,
  Moves.Strength,
];

export default function registerNidoranFSpecies(): void {
  registerSpecies(Species.NidoranF, {
    dexNumber: 29,
    evolvesInto: [
      {
        species: Species.Nidorina,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Nidoran F',
    category: 'Poison Pin Pokemon',
    family: Families.NidoranF,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 47,
      [Stats.Defense]: 52,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 41,
    },
    types: [Types.Poison],
    abilities: [Abilities.Hustle, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 235,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle],
        8: [Moves.Scratch],
        14: [Moves.PoisonSting],
        21: [Moves.TailWhip],
        29: [Moves.Bite],
        36: [Moves.FurySwipes],
        43: [Moves.DoubleKick],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Nidorina, {
    dexNumber: 30,
    evolvesInto: [
      {
        species: Species.Nidoqueen,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Nidorina',
    category: 'Poison Pin Pokemon',
    family: Families.NidoranF,
    evolvesFrom: Species.NidoranF,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 62,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 56,
    },
    types: [Types.Poison],
    abilities: [Abilities.Hustle, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 120,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle, Moves.Scratch],
        8: [Moves.Scratch],
        14: [Moves.PoisonSting],
        23: [Moves.TailWhip],
        32: [Moves.Bite],
        41: [Moves.FurySwipes],
        50: [Moves.DoubleKick],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Nidoqueen, {
    dexNumber: 31,
    name: 'Nidoqueen',
    category: 'Drill Pokemon',
    family: Families.NidoranF,
    evolvesFrom: Species.Nidorina,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 92,
      [Stats.Defense]: 87,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 76,
    },
    types: [Types.Poison, Types.Ground],
    abilities: [Abilities.SheerForce, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Scratch, Moves.TailWhip],
        8: [Moves.Scratch],
        14: [Moves.PoisonSting],
        23: [Moves.BodySlam],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE],
    },
  });
}
