import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMrMimeSpecies(): void {
  registerSpecies(Species.MrMime, {
    dexNumber: 122,
    name: 'Mr. Mime',
    category: 'Barrier Pokemon',
    family: Families.MrMime,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 90,
    },
    types: [Types.Psychic, Types.Fairy],
    abilities: [Abilities.Technician, Abilities.Soundproof, Abilities.Filter],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Barrier],
        23: [Moves.LightScreen],
        31: [Moves.DoubleSlap],
        39: [Moves.Meditate],
        47: [Moves.Substitute],
      },
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.SkullBash,
        Moves.Rest,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Flash,
      ],
    },
  });
}
