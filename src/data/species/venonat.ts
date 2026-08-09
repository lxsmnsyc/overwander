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
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Psychic,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Psywave,
  Moves.Substitute,
];

export default function registerVenonatSpecies(): void {
  registerSpecies(Species.Venonat, {
    dexNumber: 48,
    name: 'Venonat',
    category: 'Insect Pokemon',
    family: Families.Venonat,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 55,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 45,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.RunAway, Abilities.CompoundEyes, Abilities.TintedLens],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Disable],
        24: [Moves.PoisonPowder],
        27: [Moves.LeechLife],
        30: [Moves.StunSpore],
        35: [Moves.Psybeam],
        38: [Moves.SleepPowder],
        43: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Venomoth, {
    dexNumber: 49,
    name: 'Venomoth',
    category: 'Poison Moth Pokemon',
    family: Families.Venonat,
    evolvesFrom: Species.Venonat,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 65,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 90,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.WonderSkin, Abilities.ShieldDust, Abilities.TintedLens],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Disable, Moves.PoisonPowder],
        27: [Moves.LeechLife],
        30: [Moves.StunSpore],
        38: [Moves.Psybeam],
        43: [Moves.SleepPowder],
        50: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
