import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.FlameBody, Abilities.RunAway, Abilities.FlashFire];

export default function registerPonytaSpecies(): void {
  registerSpecies(Species.Ponyta, {
    dexNumber: 77,
    evolvesInto: [
      {
        species: Species.Rapidash,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Ponyta',
    category: 'Fire Horse Pokemon',
    family: Families.Ponyta,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 85,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 90,
    },
    types: [Types.Fire],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Savanna],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember],
        30: [Moves.TailWhip],
        32: [Moves.Stomp],
        35: [Moves.Growl],
        39: [Moves.FireSpin],
        43: [Moves.TakeDown],
        48: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Rapidash, {
    dexNumber: 78,
    name: 'Rapidash',
    category: 'Fire Horse Pokemon',
    family: Families.Ponyta,
    evolvesFrom: Species.Ponyta,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 100,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 105,
    },
    types: [Types.Fire],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Savanna],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.TailWhip, Moves.Stomp, Moves.Growl],
        30: [Moves.TailWhip],
        32: [Moves.Stomp],
        35: [Moves.Growl],
        39: [Moves.FireSpin],
        47: [Moves.TakeDown],
        55: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
