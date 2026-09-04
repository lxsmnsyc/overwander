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
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.TriAttack,
  Moves.Substitute,
  Moves.Surf,
  Moves.Flash,
  Moves.Thunder,
  Moves.Waterfall,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.ZapCannon,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.PsychUp,
  Moves.Whirlpool,
];

const FAMILY_ABILITIES = [Abilities.Illuminate, Abilities.NaturalCure];

export default function registerStaryuSpecies(): void {
  registerSpecies(Species.Staryu, {
    dexNumber: 120,
    evolvesInto: [
      {
        species: Species.Starmie,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Staryu',
    category: 'Star Shape Pokemon',
    height: 0.8,
    weight: 34.5,
    family: Families.Staryu,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 45,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Water3],
    genderRatio: undefined,
    catchRate: 225,
    biomes: [Biome.Beach, Biome.CoralReef, Biome.RockyCoast, Biome.KelpForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Harden],
        7: [Moves.WaterGun],
        13: [Moves.RapidSpin],
        19: [Moves.Recover],
        25: [Moves.Swift],
        31: [Moves.BubbleBeam],
        37: [Moves.Minimize],
        42: [Moves.LightScreen],
        47: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Supersonic, Moves.AuroraBeam, Moves.Barrier],
    },
  });

  registerSpecies(Species.Starmie, {
    dexNumber: 121,
    name: 'Starmie',
    category: 'Mysterious Pokemon',
    height: 1.1,
    weight: 80,
    family: Families.Staryu,
    evolvesFrom: Species.Staryu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 115,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Analytic, Abilities.Regenerator],
    eggGroups: [EggGroups.Water3],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Beach, Biome.CoralReef, Biome.RockyCoast, Biome.KelpForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.WaterGun,
          Moves.Harden,
          Moves.BubbleBeam,
          Moves.Recover,
          Moves.RapidSpin,
        ],
        37: [Moves.ConfuseRay],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.DreamEater, Moves.Nightmare],
    },
  });
}
