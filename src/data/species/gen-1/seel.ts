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
  Moves.HornDrill,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.PayDay,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Strength,
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
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
];

const FAMILY_ABILITIES = [Abilities.ThickFat, Abilities.Hydration];

export default function registerSeelSpecies(): void {
  registerSpecies(Species.Seel, {
    dexNumber: 86,
    evolvesInto: [
      {
        species: Species.Dewgong,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Seel',
    category: 'Sea Lion Pokemon',
    height: 1.1,
    weight: 90,
    family: Families.Seel,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 45,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 45,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.IceBody],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.PolarOcean, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Headbutt],
        5: [Moves.Growl],
        16: [Moves.AuroraBeam],
        21: [Moves.Rest],
        32: [Moves.TakeDown],
        37: [Moves.IceBeam],
        48: [Moves.Safeguard],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Lick, Moves.Peck, Moves.Disable, Moves.Slam, Moves.PerishSong, Moves.Encore],
    },
  });

  registerSpecies(Species.Dewgong, {
    dexNumber: 87,
    name: 'Dewgong',
    category: 'Sea Lion Pokemon',
    height: 1.7,
    weight: 120,
    family: Families.Seel,
    evolvesFrom: Species.Seel,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 70,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Ice],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.IceBody, Abilities.SlushRush],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.PolarOcean, Biome.Tundra, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Headbutt, Moves.Growl, Moves.AuroraBeam],
        21: [Moves.Rest],
        32: [Moves.TakeDown],
        43: [Moves.IceBeam],
        60: [Moves.Safeguard],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
