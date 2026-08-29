import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
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
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.DragonRage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
];

export default function registerDratiniSpecies(): void {
  registerSpecies(Species.Dratini, {
    dexNumber: 147,
    evolvesInto: [
      {
        species: Species.Dragonair,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Dratini',
    category: 'Dragon Pokemon',
    height: 1.8,
    weight: 3.3,
    family: Families.Dratini,
    stats: {
      [Stats.HP]: 41,
      [Stats.Attack]: 64,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 50,
    },
    types: [Types.Dragon],
    abilities: [Abilities.ShedSkin],
    hiddenAbilities: [Abilities.MarvelScale],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer],
        10: [Moves.ThunderWave],
        20: [Moves.Agility],
        30: [Moves.Slam],
        40: [Moves.DragonRage],
        50: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.LightScreen, Moves.Mist, Moves.Haze, Moves.Supersonic],
    },
  });

  registerSpecies(Species.Dragonair, {
    dexNumber: 148,
    evolvesInto: [
      {
        species: Species.Dragonite,
        method: EvolutionMethod.Level,
        level: 55,
      },
    ],
    name: 'Dragonair',
    category: 'Dragon Pokemon',
    height: 4,
    weight: 16.5,
    family: Families.Dratini,
    evolvesFrom: Species.Dratini,
    stats: {
      [Stats.HP]: 61,
      [Stats.Attack]: 84,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 70,
    },
    types: [Types.Dragon],
    abilities: [Abilities.ShedSkin],
    hiddenAbilities: [Abilities.MarvelScale],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer, Moves.ThunderWave],
        20: [Moves.Agility],
        35: [Moves.Slam],
        45: [Moves.DragonRage],
        55: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Dragonite, {
    dexNumber: 149,
    name: 'Dragonite',
    category: 'Dragon Pokemon',
    height: 2.2,
    weight: 210,
    family: Families.Dratini,
    evolvesFrom: Species.Dragonair,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 134,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 80,
    },
    types: [Types.Dragon, Types.Flying],
    abilities: [Abilities.InnerFocus],
    hiddenAbilities: [Abilities.Multiscale],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Leer, Moves.ThunderWave, Moves.Agility],
        35: [Moves.Slam],
        45: [Moves.DragonRage],
        55: [Moves.HyperBeam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.Fissure,
        Moves.FireBlast,
        Moves.Strength,
      ],
    },
  });
}
