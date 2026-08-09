import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerTangelaSpecies(): void {
  registerSpecies(Species.Tangela, {
    dexNumber: 114,
    name: 'Tangela',
    category: 'Vine Pokemon',
    family: Families.Tangela,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 55,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.LeafGuard],
    hiddenAbility: Abilities.Regenerator,
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Constrict, Moves.Bind],
        29: [Moves.Absorb],
        32: [Moves.PoisonPowder],
        36: [Moves.StunSpore],
        39: [Moves.SleepPowder],
        45: [Moves.Slam],
        49: [Moves.Growth],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.Rage,
        Moves.MegaDrain,
        Moves.SolarBeam,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.HyperBeam,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
      ],
    },
  });
}
