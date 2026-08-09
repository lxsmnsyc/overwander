import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMewtwoSpecies(): void {
  registerSpecies(Species.Mewtwo, {
    dexNumber: 150,
    name: 'Mewtwo',
    category: 'Genetic Pokemon',
    family: Families.Mewtwo,
    stats: {
      [Stats.HP]: 106,
      [Stats.Attack]: 110,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 154,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 130,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Unnerve, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Disable, Moves.Swift],
        63: [Moves.Barrier],
        66: [Moves.Psychic],
        70: [Moves.Recover],
        75: [Moves.Mist],
        81: [Moves.Amnesia],
      },
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.PayDay,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.SolarBeam,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.SelfDestruct,
        Moves.FireBlast,
        Moves.Swift,
        Moves.SkullBash,
        Moves.RockSlide,
        Moves.TriAttack,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
        Moves.Flash,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.Rest,
      ],
    },
  });
}
