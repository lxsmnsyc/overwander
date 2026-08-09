import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerPorygonSpecies(): void {
  registerSpecies(Species.Porygon, {
    dexNumber: 137,
    name: 'Porygon',
    category: 'Virtual Pokemon',
    family: Families.Porygon,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 60,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
    },
    types: [Types.Normal],
    abilities: [Abilities.Analytic, Abilities.Trace, Abilities.Download],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Sharpen],
        23: [Moves.Psybeam],
        28: [Moves.Recover],
        35: [Moves.Agility],
        42: [Moves.TriAttack],
      },
      teachable: [
        Moves.Toxic,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Swift,
        Moves.SkullBash,
        Moves.Rest,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.TriAttack,
        Moves.Substitute,
        Moves.Flash,
      ],
    },
  });
}
