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
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.SolarBeam,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
];

export default function registerParasSpecies(): void {
  registerSpecies(Species.Paras, {
    dexNumber: 46,
    name: 'Paras',
    category: 'Mushroom Pokemon',
    family: Families.Paras,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 70,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 25,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.Damp, Abilities.EffectSpore, Abilities.DrySkin],
    eggGroups: [EggGroups.Bug, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 190,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        13: [Moves.StunSpore],
        20: [Moves.LeechLife],
        27: [Moves.Spore],
        34: [Moves.Slash],
        41: [Moves.Growth],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Parasect, {
    dexNumber: 47,
    name: 'Parasect',
    category: 'Mushroom Pokemon',
    family: Families.Paras,
    evolvesFrom: Species.Paras,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 95,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 30,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.Damp, Abilities.EffectSpore, Abilities.DrySkin],
    eggGroups: [EggGroups.Bug, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 75,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.StunSpore, Moves.LeechLife],
        30: [Moves.Spore],
        39: [Moves.Slash],
        48: [Moves.Growth],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
