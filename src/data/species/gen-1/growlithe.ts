import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
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
  Moves.DragonRage,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

export default function registerGrowlitheSpecies(): void {
  registerSpecies(Species.Growlithe, {
    dexNumber: 58,
    evolvesInto: [
      {
        species: Species.Arcanine,
        method: EvolutionMethod.UsedItem,
        item: Items.FireStone,
      },
    ],
    name: 'Growlithe',
    category: 'Puppy Pokemon',
    family: Families.Growlithe,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 70,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 60,
    },
    types: [Types.Fire],
    abilities: [Abilities.Justified, Abilities.Intimidate, Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [3, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Roar],
        18: [Moves.Ember],
        23: [Moves.Leer],
        30: [Moves.TakeDown],
        39: [Moves.Agility],
        50: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Arcanine, {
    dexNumber: 59,
    name: 'Arcanine',
    category: 'Legendary Pokemon',
    family: Families.Growlithe,
    evolvesFrom: Species.Growlithe,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 110,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 95,
    },
    types: [Types.Fire],
    abilities: [Abilities.Justified, Abilities.Intimidate, Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [3, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Roar, Moves.Ember, Moves.Leer, Moves.TakeDown],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
