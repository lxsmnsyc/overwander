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
  Moves.Headbutt,
  Moves.Roar,
  Moves.Swift,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DragonBreath,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.RockSmash,
  Moves.Flamethrower,
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
    height: 0.7,
    weight: 19,
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
    abilities: [Abilities.Intimidate, Abilities.FlashFire],
    hiddenAbilities: [Abilities.Justified],
    eggGroups: [EggGroups.Field],
    genderRatio: [3, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Roar],
        9: [Moves.Ember],
        18: [Moves.Leer],
        26: [Moves.TakeDown],
        34: [Moves.FlameWheel],
        39: [Moves.Agility],
        50: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.BodySlam, Moves.Thrash, Moves.FireSpin, Moves.Safeguard, Moves.Crunch],
    },
  });

  registerSpecies(Species.Arcanine, {
    dexNumber: 59,
    name: 'Arcanine',
    category: 'Legendary Pokemon',
    height: 1.9,
    weight: 155,
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
    abilities: [Abilities.Intimidate, Abilities.FlashFire],
    hiddenAbilities: [Abilities.Justified, Abilities.Reckless],
    eggGroups: [EggGroups.Field],
    genderRatio: [3, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Roar, Moves.Ember, Moves.Leer, Moves.TakeDown, Moves.FlameWheel],
        50: [Moves.ExtremeSpeed],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
