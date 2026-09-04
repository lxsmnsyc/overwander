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
  Moves.Headbutt,
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
];

const FAMILY_ABILITIES = [Abilities.RunAway, Abilities.FlashFire];

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
    height: 1,
    weight: 30,
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
    hiddenAbilities: [Abilities.FlameBody],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.Tackle],
        4: [Moves.Growl],
        8: [Moves.TailWhip],
        19: [Moves.Stomp],
        26: [Moves.FireSpin],
        34: [Moves.TakeDown],
        43: [Moves.Agility],
        53: [Moves.FireBlast],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.DoubleKick,
        Moves.Thrash,
        Moves.Hypnosis,
        Moves.QuickAttack,
        Moves.FlameWheel,
        Moves.Charm,
      ],
    },
  });

  registerSpecies(Species.Rapidash, {
    dexNumber: 78,
    name: 'Rapidash',
    category: 'Fire Horse Pokemon',
    height: 1.7,
    weight: 95,
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
    hiddenAbilities: [Abilities.FlameBody, Abilities.Reckless],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.TailWhip, Moves.Stomp, Moves.Growl, Moves.Tackle],
        26: [Moves.FireSpin],
        34: [Moves.TakeDown],
        40: [Moves.FuryAttack],
        47: [Moves.Agility],
        61: [Moves.FireBlast],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
