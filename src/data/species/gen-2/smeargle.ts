import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSmeargleSpecies(): void {
  registerSpecies(Species.Smeargle, {
    dexNumber: 235,
    name: 'Smeargle',
    category: 'Painter Pokemon',
    height: 1.2,
    weight: 58,
    family: Families.Smeargle,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 20,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 75,
    },
    types: [Types.Normal],
    abilities: [Abilities.OwnTempo, Abilities.Technician],
    // Prankster is this registry's rather than the mainline's,
    // filling it to four: everything it knows was copied off somebody
    // else, and getting there first is what makes that worth anything
    hiddenAbilities: [Abilities.Moody, Abilities.Prankster],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Shrubland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      // Sketch and nothing else, over and over: no machine teaches it
      // anything, because it takes what it wants off whoever it meets
      level: {
        1: [Moves.Sketch],
        11: [Moves.Sketch],
        21: [Moves.Sketch],
        31: [Moves.Sketch],
        41: [Moves.Sketch],
        51: [Moves.Sketch],
        61: [Moves.Sketch],
        71: [Moves.Sketch],
        81: [Moves.Sketch],
        91: [Moves.Sketch],
      },
      teachable: [],
    },
  });
}
