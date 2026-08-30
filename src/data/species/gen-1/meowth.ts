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
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.PayDay,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Substitute,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Swift,
  Moves.DreamEater,
  Moves.Thief,
  Moves.Nightmare,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.ZapCannon,
  Moves.IcyWind,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.PsychUp,
  Moves.ShadowBall,
];

export default function registerMeowthSpecies(): void {
  registerSpecies(Species.Meowth, {
    dexNumber: 52,
    evolvesInto: [
      {
        species: Species.Persian,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Meowth',
    category: 'Scratch Cat Pokemon',
    height: 0.4,
    weight: 4.2,
    family: Families.Meowth,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.Pickup, Abilities.Technician],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl],
        11: [Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        28: [Moves.FeintAttack],
        33: [Moves.FurySwipes],
        44: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Hypnosis, Moves.Amnesia, Moves.Spite, Moves.Charm],
    },
  });

  registerSpecies(Species.Persian, {
    dexNumber: 53,
    name: 'Persian',
    category: 'Classy Cat Pokemon',
    height: 1,
    weight: 32,
    family: Families.Meowth,
    evolvesFrom: Species.Meowth,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 70,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 115,
    },
    types: [Types.Normal],
    abilities: [Abilities.Limber, Abilities.Technician],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        29: [Moves.FeintAttack],
        37: [Moves.FurySwipes],
        51: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Roar],
    },
  });
}
