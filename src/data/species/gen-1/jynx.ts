import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerJynxSpecies(): void {
  registerSpecies(Species.Jynx, {
    dexNumber: 124,
    name: 'Jynx',
    category: 'Human Shape Pokemon',
    family: Families.Jynx,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 50,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 95,
    },
    types: [Types.Ice, Types.Psychic],
    abilities: [Abilities.DrySkin, Abilities.Oblivious, Abilities.Forewarn],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Glacier, Biome.Tundra],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.LovelyKiss],
        18: [Moves.Lick],
        23: [Moves.DoubleSlap],
        31: [Moves.IcePunch],
        39: [Moves.BodySlam],
        47: [Moves.Thrash],
        58: [Moves.Blizzard],
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
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Psywave,
        Moves.Substitute,
      ],
    },
  });
}
