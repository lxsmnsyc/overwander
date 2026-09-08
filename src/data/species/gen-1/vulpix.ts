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

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
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
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Flamethrower,
  Moves.Facade,
  Moves.Overheat,
  Moves.SecretPower,
];

export default function registerVulpixSpecies(): void {
  registerSpecies(Species.Vulpix, {
    dexNumber: 37,
    evolvesInto: [
      {
        species: Species.Ninetales,
        method: EvolutionMethod.UsedItem,
        item: Items.FireStone,
      },
    ],
    name: 'Vulpix',
    category: 'Fox Pokemon',
    height: 0.6,
    weight: 9.9,
    family: Families.Vulpix,
    stats: {
      [Stats.HP]: 38,
      [Stats.Attack]: 41,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.FlashFire],
    hiddenAbilities: [Abilities.Drought],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 190,
    biomes: [Biome.Woodland, Biome.Shrubland, Biome.Taiga, Biome.Volcano],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.TailWhip],
        7: [Moves.QuickAttack],
        13: [Moves.Roar],
        17: [Moves.WillOWisp],
        19: [Moves.ConfuseRay],
        25: [Moves.Safeguard, Moves.Imprison],
        31: [Moves.Flamethrower],
        37: [Moves.FireSpin, Moves.Grudge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Hypnosis,
        Moves.Disable,
        Moves.Flail,
        Moves.Spite,
        Moves.FeintAttack,
        Moves.HeatWave,
        Moves.Howl,
        Moves.PsychUp,
      ],
    },
  });

  registerSpecies(Species.Ninetales, {
    dexNumber: 38,
    name: 'Ninetales',
    category: 'Fox Pokemon',
    height: 1.1,
    weight: 19.9,
    family: Families.Vulpix,
    evolvesFrom: Species.Vulpix,
    stats: {
      [Stats.HP]: 73,
      [Stats.Attack]: 76,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 81,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Fire],
    abilities: [Abilities.FlashFire],
    hiddenAbilities: [Abilities.Drought, Abilities.FlameBody, Abilities.Forewarn],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 75,
    biomes: [Biome.Woodland, Biome.Shrubland, Biome.Taiga, Biome.Volcano],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Ember,
          Moves.TailWhip,
          Moves.QuickAttack,
          Moves.Roar,
          Moves.ConfuseRay,
          Moves.Safeguard,
        ],
        43: [Moves.FireSpin],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Roar],
    },
  });
}
