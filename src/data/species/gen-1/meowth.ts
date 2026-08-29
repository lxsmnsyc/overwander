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
        12: [Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        33: [Moves.FurySwipes],
        44: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Hypnosis, Moves.Amnesia],
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
        1: [Moves.Scratch, Moves.Growl],
        12: [Moves.Bite],
        17: [Moves.PayDay],
        24: [Moves.Screech],
        37: [Moves.FurySwipes],
        51: [Moves.Slash],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
