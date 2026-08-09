import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

export default function registerPinsirSpecies(): void {
  registerSpecies(Species.Pinsir, {
    dexNumber: 127,
    name: 'Pinsir',
    category: 'Stag Beetle Pokemon',
    family: Families.Pinsir,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 125,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 85,
    },
    types: [Types.Bug],
    abilities: [Abilities.Moxie, Abilities.HyperCutter, Abilities.MoldBreaker],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.ViceGrip],
        25: [Moves.SeismicToss],
        30: [Moves.Guillotine],
        36: [Moves.FocusEnergy],
        43: [Moves.Harden],
        49: [Moves.Slash],
        54: [Moves.SwordsDance],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
        Moves.Strength,
      ],
    },
  });
}
