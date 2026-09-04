import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.SwordsDance,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Surf,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.IcyWind,
  Moves.Sandstorm,
  Moves.GigaDrain,
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
];

const FAMILY_ABILITIES = [Abilities.SwiftSwim, Abilities.BattleArmor];

export default function registerKabutoSpecies(): void {
  registerSpecies(Species.Kabuto, {
    dexNumber: 140,
    evolvesInto: [
      {
        species: Species.Kabutops,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Kabuto',
    category: 'Shellfish Pokemon',
    height: 0.5,
    weight: 11.5,
    family: Families.Kabuto,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 80,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 55,
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
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden],
        10: [Moves.Absorb],
        19: [Moves.Leer],
        28: [Moves.SandAttack],
        37: [Moves.Endure],
        39: [Moves.Slash],
        46: [Moves.MegaDrain],
        49: [Moves.HydroPump],
        55: [Moves.AncientPower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.BubbleBeam, Moves.AuroraBeam, Moves.Dig, Moves.Flail, Moves.RapidSpin],
    },
  });

  registerSpecies(Species.Kabutops, {
    dexNumber: 141,
    name: 'Kabutops',
    category: 'Shellfish Pokemon',
    height: 1.3,
    weight: 40.5,
    family: Families.Kabuto,
    evolvesFrom: Species.Kabuto,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 115,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 80,
    },
    types: [Types.Rock, Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.WeakArmor, Abilities.Sharpness],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    // Extinct: nothing brings one back but a fossil, so it lives
    // nowhere on the map
    biomes: [],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Harden, Moves.Absorb],
        19: [Moves.Leer],
        28: [Moves.SandAttack],
        37: [Moves.Endure],
        39: [Moves.Slash],
        51: [Moves.MegaDrain],
        53: [Moves.HydroPump],
        65: [Moves.AncientPower],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.BodySlam,
        Moves.SeismicToss,
        Moves.Submission,
        Moves.RazorWind,
        Moves.Cut,
        Moves.Headbutt,
        Moves.FuryCutter,
        Moves.Whirlpool,
      ],
    },
  });
}
