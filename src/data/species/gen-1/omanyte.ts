import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
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
  Moves.HornDrill,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Headbutt,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.IcyWind,
  Moves.Sandstorm,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.RockSmash,
  Moves.Whirlpool,
];

const FAMILY_ABILITIES = [Abilities.SwiftSwim, Abilities.ShellArmor];

export default function registerOmanyteSpecies(): void {
  registerSpecies(Species.Omanyte, {
    dexNumber: 138,
    evolvesInto: [
      {
        species: Species.Omastar,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Omanyte',
    category: 'Spiral Pokemon',
    height: 0.4,
    weight: 7.5,
    family: Families.Omanyte,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 40,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 35,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    // Extinct: nothing brings one back but a fossil, so it lives
    // nowhere on the map
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Withdraw, Moves.Constrict],
        13: [Moves.Bite],
        31: [Moves.Leer],
        34: [Moves.HornAttack],
        37: [Moves.Protect],
        46: [Moves.SpikeCannon],
        49: [Moves.AncientPower],
        53: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Slam, Moves.Supersonic, Moves.BubbleBeam, Moves.AuroraBeam, Moves.Haze],
    },
  });

  registerSpecies(Species.Omastar, {
    dexNumber: 139,
    name: 'Omastar',
    category: 'Spiral Pokemon',
    height: 1,
    weight: 35,
    family: Families.Omanyte,
    evolvesFrom: Species.Omanyte,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 125,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 55,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.WeakArmor, Abilities.Sniper],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    // Extinct: nothing brings one back but a fossil, so it lives
    // nowhere on the map
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Withdraw, Moves.HornAttack, Moves.Bite, Moves.Constrict],
        31: [Moves.Leer],
        37: [Moves.Protect],
        40: [Moves.SpikeCannon],
        49: [Moves.HydroPump],
        54: [Moves.AncientPower],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.BodySlam,
        Moves.SeismicToss,
        Moves.Submission,
      ],
    },
  });
}
