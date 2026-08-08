import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import { Abilities } from '../ids/abilities';
import { EggGroups } from '../ids/egg-groups';
import { Families } from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

export function registerWeedleSpecies() {
  registerSpecies(Species.Weedle, {
    dexNumber: 13,
    name: 'Weedle',
    category: 'Hairy Bug Pokemon',
    family: Families.Weedle,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 35,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 50,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.RunAway, Abilities.ShieldDust],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.StringShot],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Kakuna, {
    dexNumber: 14,
    name: 'Kakuna',
    category: 'Cocoon Pokemon',
    family: Families.Weedle,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 25,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 35,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    learnSet: {
      level: {
        1: [Moves.Harden],
        7: [Moves.Harden],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Beedrill, {
    dexNumber: 15,
    name: 'Beedrill',
    category: 'Poison Bee Pokemon',
    family: Families.Weedle,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 75,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.Sniper, Abilities.Swarm],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.FuryAttack],
        12: [Moves.FuryAttack],
        16: [Moves.FocusEnergy],
        20: [Moves.Twineedle],
        25: [Moves.Rage],
        30: [Moves.PinMissile],
        35: [Moves.Agility],
      },
      teachable: [
        Moves.SwordsDance,
        Moves.Toxic,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.MegaDrain,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Swift,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
      ],
    },
  });
}
