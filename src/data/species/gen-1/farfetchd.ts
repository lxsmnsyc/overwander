import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves
const TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.RazorWind,
  Moves.Whirlwind,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Fly,
];

export default function registerFarfetchdSpecies(): void {
  registerSpecies(Species.Farfetchd, {
    dexNumber: 83,
    name: "Farfetch'd",
    category: 'Wild Duck Pokemon',
    family: Families.Farfetchd,
    stats: {
      [Stats.HP]: 52,
      [Stats.Attack]: 90,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 58,
      [Stats.SpecialDefense]: 62,
      [Stats.Speed]: 60,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Defiant, Abilities.KeenEye, Abilities.InnerFocus],
    eggGroups: [EggGroups.Flying, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.SandAttack],
        7: [Moves.Leer],
        15: [Moves.FuryAttack],
        23: [Moves.SwordsDance],
        31: [Moves.Agility],
        39: [Moves.Slash],
      },
      teachable: [...TEACHABLE],
    },
  });
}
