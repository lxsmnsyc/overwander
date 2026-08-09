import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerTaurosSpecies(): void {
  registerSpecies(Species.Tauros, {
    dexNumber: 128,
    name: 'Tauros',
    category: 'Wild Bull Pokemon',
    family: Families.Tauros,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 100,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 110,
    },
    types: [Types.Normal],
    abilities: [Abilities.SheerForce, Abilities.Intimidate, Abilities.AngerPoint],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        21: [Moves.Stomp],
        28: [Moves.TailWhip],
        35: [Moves.Leer],
        44: [Moves.Rage],
        51: [Moves.TakeDown],
      },
      teachable: [
        Moves.Toxic,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.FireBlast,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
