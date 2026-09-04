import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Headbutt,
  Moves.Waterfall,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DragonBreath,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.Dive,
  Moves.Facade,
  Moves.SecretPower,
  Moves.WaterPulse,
];

export default function registerHorseaSpecies(): void {
  registerSpecies(Species.Horsea, {
    dexNumber: 116,
    evolvesInto: [
      {
        species: Species.Seadra,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Horsea',
    category: 'Dragon Pokemon',
    height: 0.4,
    weight: 8,
    family: Families.Horsea,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 40,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 60,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.Sniper],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.DeepOcean, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        8: [Moves.SmokeScreen],
        15: [Moves.Leer],
        22: [Moves.WaterGun],
        29: [Moves.Twister],
        36: [Moves.Agility],
        43: [Moves.HydroPump],
        50: [Moves.DragonDance],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AuroraBeam,
        Moves.Disable,
        Moves.Splash,
        Moves.DragonRage,
        Moves.Flail,
        Moves.Octazooka,
      ],
    },
  });

  registerSpecies(Species.Seadra, {
    dexNumber: 117,
    evolvesInto: [
      {
        species: Species.Kingdra,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.DragonScale,
      },
    ],
    name: 'Seadra',
    category: 'Dragon Pokemon',
    height: 1.2,
    weight: 25,
    family: Families.Horsea,
    evolvesFrom: Species.Horsea,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 65,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [Abilities.PoisonPoint, Abilities.Sniper],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.SmokeScreen, Moves.Leer, Moves.WaterGun],
        29: [Moves.Twister],
        40: [Moves.Agility],
        51: [Moves.HydroPump],
        62: [Moves.DragonDance],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
