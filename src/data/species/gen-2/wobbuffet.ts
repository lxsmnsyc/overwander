import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerWobbuffetSpecies(): void {
  registerSpecies(Species.Wobbuffet, {
    dexNumber: 202,
    name: 'Wobbuffet',
    category: 'Patient Pokemon',
    height: 1.3,
    weight: 28.5,
    family: Families.Wobbuffet,
    stats: {
      [Stats.HP]: 190,
      [Stats.Attack]: 33,
      [Stats.Defense]: 58,
      [Stats.SpecialAttack]: 33,
      [Stats.SpecialDefense]: 58,
      [Stats.Speed]: 33,
    },
    types: [Types.Psychic],
    abilities: [Abilities.ShadowTag],
    // Unaware and Magic Bounce are this registry's rather than the
    // mainline's, filling it to four: it gives back what it is given
    // and counts none of what was built up against it
    hiddenAbilities: [Abilities.Telepathy, Abilities.Unaware, Abilities.MagicBounce],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Woodland, Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Counter, Moves.DestinyBond, Moves.MirrorCoat, Moves.Safeguard],
      },
      teachable: [],
    },
  });
}
