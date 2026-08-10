import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerDittoSpecies(): void {
  registerSpecies(Species.Ditto, {
    dexNumber: 132,
    name: 'Ditto',
    category: 'Transform Pokemon',
    height: 0.3,
    weight: 4,
    family: Families.Ditto,
    stats: {
      [Stats.HP]: 48,
      [Stats.Attack]: 48,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 48,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 48,
    },
    types: [Types.Normal],
    abilities: [Abilities.Limber],
    hiddenAbility: Abilities.Imposter,
    eggGroups: [EggGroups.Ditto],
    genderRatio: undefined,
    catchRate: 35,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Transform],
      },
      teachable: [],
    },
  });
}
