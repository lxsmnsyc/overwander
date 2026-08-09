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

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.HornDrill,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
];

// Additional TM/HM moves for the fully evolved form
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.IceBeam,
  Moves.HyperBeam,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.FireBlast,
  Moves.RockSlide,
  Moves.Surf,
  Moves.Strength,
];

export default function registerNidoranMSpecies(): void {
  registerSpecies(Species.NidoranM, {
    dexNumber: 32,
    evolvesInto: [
      {
        species: Species.Nidorino,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Nidoran M',
    category: 'Poison Pin Pokemon',
    family: Families.NidoranM,
    stats: {
      [Stats.HP]: 46,
      [Stats.Attack]: 57,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 50,
    },
    types: [Types.Poison],
    abilities: [Abilities.Hustle, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 0],
    catchRate: 235,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Tackle],
        8: [Moves.HornAttack],
        14: [Moves.PoisonSting],
        21: [Moves.FocusEnergy],
        29: [Moves.FuryAttack],
        36: [Moves.HornDrill],
        43: [Moves.DoubleKick],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Nidorino, {
    dexNumber: 33,
    evolvesInto: [
      {
        species: Species.Nidoking,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Nidorino',
    category: 'Poison Pin Pokemon',
    family: Families.NidoranM,
    evolvesFrom: Species.NidoranM,
    stats: {
      [Stats.HP]: 61,
      [Stats.Attack]: 72,
      [Stats.Defense]: 57,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 65,
    },
    types: [Types.Poison],
    abilities: [Abilities.Hustle, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 0],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Tackle, Moves.HornAttack],
        8: [Moves.HornAttack],
        14: [Moves.PoisonSting],
        23: [Moves.FocusEnergy],
        32: [Moves.FuryAttack],
        41: [Moves.HornDrill],
        50: [Moves.DoubleKick],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Nidoking, {
    dexNumber: 34,
    name: 'Nidoking',
    category: 'Drill Pokemon',
    family: Families.NidoranM,
    evolvesFrom: Species.Nidorino,
    stats: {
      [Stats.HP]: 81,
      [Stats.Attack]: 102,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 85,
    },
    types: [Types.Poison, Types.Ground],
    abilities: [Abilities.SheerForce, Abilities.PoisonPoint, Abilities.Rivalry],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.HornAttack, Moves.PoisonSting],
        8: [Moves.HornAttack],
        14: [Moves.PoisonSting],
        23: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE],
    },
  });
}
