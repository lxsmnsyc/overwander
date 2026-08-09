import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerScytherSpecies(): void {
  registerSpecies(Species.Scyther, {
    dexNumber: 123,
    name: 'Scyther',
    category: 'Mantis Pokemon',
    family: Families.Scyther,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 110,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 105,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Swarm, Abilities.Technician],
    hiddenAbility: Abilities.Steadfast,
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.QuickAttack],
        17: [Moves.Leer],
        20: [Moves.FocusEnergy],
        24: [Moves.DoubleTeam],
        29: [Moves.Slash],
        35: [Moves.SwordsDance],
        42: [Moves.Agility],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Swift,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
      ],
    },
  });
}
