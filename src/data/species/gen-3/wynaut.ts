import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerWynautSpecies(): void {
  registerSpecies(Species.Wynaut, {
    dexNumber: 360,
    evolvesInto: [
      {
        species: Species.Wobbuffet,
        method: EvolutionMethod.Level,
        level: 15,
      },
    ],
    name: 'Wynaut',
    category: 'Bright Pokemon',
    height: 0.6,
    weight: 14,
    family: Families.Wobbuffet,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 23,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 23,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 23,
    },
    types: [Types.Psychic],
    abilities: [Abilities.ShadowTag],
    hiddenAbilities: [Abilities.Telepathy],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 125,
    biomes: [Biome.Mountain, Biome.Woodland, Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Charm, Moves.Encore, Moves.Splash],
        15: [Moves.Counter, Moves.DestinyBond, Moves.MirrorCoat, Moves.Safeguard],
      },
      teachable: [],
    },
  });
}
