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
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
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

export default function registerNidoranFSpecies(): void {
  registerSpecies(Species.NidoranF, {
    dexNumber: 29,
    evolvesInto: [
      {
        species: Species.Nidorina,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Nidoran F',
    category: 'Poison Pin Pokemon',
    height: 0.4,
    weight: 7,
    family: Families.NidoranF,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 47,
      [Stats.Defense]: 52,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 41,
    },
    types: [Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.Rivalry],
    hiddenAbilities: [Abilities.Hustle],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 235,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle],
        8: [Moves.Scratch],
        12: [Moves.DoubleKick],
        14: [Moves.PoisonSting],
        21: [Moves.TailWhip],
        29: [Moves.Bite],
        36: [Moves.FurySwipes],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Supersonic,
        Moves.Disable,
        Moves.TakeDown,
        Moves.Counter,
        Moves.FocusEnergy,
        Moves.Charm,
        Moves.BeatUp,
      ],
    },
  });

  registerSpecies(Species.Nidorina, {
    dexNumber: 30,
    evolvesInto: [
      {
        species: Species.Nidoqueen,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Nidorina',
    category: 'Poison Pin Pokemon',
    height: 0.8,
    weight: 20,
    family: Families.NidoranF,
    evolvesFrom: Species.NidoranF,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 62,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 56,
    },
    types: [Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.Rivalry],
    hiddenAbilities: [Abilities.Hustle],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Tackle, Moves.Scratch],
        12: [Moves.DoubleKick],
        14: [Moves.PoisonSting],
        23: [Moves.TailWhip],
        32: [Moves.Bite],
        41: [Moves.FurySwipes],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Strength, Moves.RockSmash, Moves.IceBeam],
    },
  });

  registerSpecies(Species.Nidoqueen, {
    dexNumber: 31,
    name: 'Nidoqueen',
    category: 'Drill Pokemon',
    height: 1.3,
    weight: 60,
    family: Families.NidoranF,
    evolvesFrom: Species.Nidorina,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 92,
      [Stats.Defense]: 87,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 76,
    },
    types: [Types.Poison, Types.Ground],
    abilities: [Abilities.PoisonPoint, Abilities.Rivalry],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Savanna, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Scratch, Moves.TailWhip, Moves.DoubleKick],
        14: [Moves.PoisonSting],
        23: [Moves.BodySlam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...EVOLVED_TEACHABLE,
        Moves.FirePunch,
        Moves.IcePunch,
        Moves.ThunderPunch,
        Moves.Roar,
        Moves.IcyWind,
        Moves.Sandstorm,
        Moves.FuryCutter,
        Moves.DynamicPunch,
        Moves.ShadowBall,
        Moves.RockSmash,
        Moves.Flamethrower,
      ],
    },
  });
}
