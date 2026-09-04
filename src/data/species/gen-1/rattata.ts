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
  Moves.Blizzard,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
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
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.ShadowBall,
  Moves.RockSmash,
];

export default function registerRattataSpecies(): void {
  registerSpecies(Species.Rattata, {
    dexNumber: 19,
    evolvesInto: [
      {
        species: Species.Raticate,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Rattata',
    category: 'Mouse Pokemon',
    height: 0.3,
    weight: 3.5,
    family: Families.Rattata,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 56,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 72,
    },
    types: [Types.Normal],
    abilities: [Abilities.RunAway, Abilities.Guts],
    hiddenAbilities: [Abilities.Hustle],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip],
        7: [Moves.QuickAttack],
        13: [Moves.HyperFang],
        20: [Moves.FocusEnergy],
        27: [Moves.Pursuit],
        34: [Moves.SuperFang],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Screech,
        Moves.Bite,
        Moves.Counter,
        Moves.FurySwipes,
        Moves.FlameWheel,
        Moves.Reversal,
      ],
    },
  });

  registerSpecies(Species.Raticate, {
    dexNumber: 20,
    name: 'Raticate',
    category: 'Mouse Pokemon',
    height: 0.7,
    weight: 18.5,
    family: Families.Rattata,
    evolvesFrom: Species.Rattata,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 81,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 97,
    },
    types: [Types.Normal],
    abilities: [Abilities.RunAway, Abilities.Guts],
    hiddenAbilities: [Abilities.Hustle, Abilities.Adaptability],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 127,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.QuickAttack],
        13: [Moves.HyperFang],
        20: [Moves.ScaryFace],
        27: [Moves.FocusEnergy],
        30: [Moves.Pursuit],
        40: [Moves.SuperFang],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.IceBeam,
        Moves.HyperBeam,
        Moves.Cut,
        Moves.Roar,
        Moves.Strength,
      ],
    },
  });
}
