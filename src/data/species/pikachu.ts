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
  Moves.PayDay,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Flash,
];

export default function registerPikachuSpecies(): void {
  registerSpecies(Species.Pikachu, {
    dexNumber: 25,
    name: 'Pikachu',
    category: 'Mouse Pokemon',
    family: Families.Pikachu,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 55,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 90,
    },
    types: [Types.Electric],
    abilities: [Abilities.LightningRod, Abilities.Static],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.ThunderShock, Moves.Growl],
        9: [Moves.ThunderWave],
        16: [Moves.QuickAttack],
        26: [Moves.Swift],
        33: [Moves.Agility],
        43: [Moves.Thunder],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Raichu, {
    dexNumber: 26,
    name: 'Raichu',
    category: 'Mouse Pokemon',
    family: Families.Pikachu,
    evolvesFrom: Species.Pikachu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 90,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 110,
    },
    types: [Types.Electric],
    abilities: [Abilities.LightningRod, Abilities.Static],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.ThunderShock, Moves.Growl, Moves.ThunderWave],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
