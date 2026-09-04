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
  Moves.RazorWind,
  Moves.Whirlwind,
  Moves.Toxic,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkyAttack,
  Moves.Rest,
  Moves.Substitute,
  Moves.Fly,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.SteelWing,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
];

export default function registerSpearowSpecies(): void {
  registerSpecies(Species.Spearow, {
    dexNumber: 21,
    evolvesInto: [
      {
        species: Species.Fearow,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Spearow',
    category: 'Tiny Bird Pokemon',
    height: 0.3,
    weight: 2,
    family: Families.Spearow,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 60,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 31,
      [Stats.SpecialDefense]: 31,
      [Stats.Speed]: 70,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye],
    hiddenAbilities: [Abilities.Sniper],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl],
        7: [Moves.Leer],
        13: [Moves.FuryAttack],
        22: [Moves.MirrorMove],
        25: [Moves.Pursuit],
        29: [Moves.DrillPeck],
        36: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.QuickAttack,
        Moves.TriAttack,
        Moves.ScaryFace,
        Moves.FeintAttack,
        Moves.FalseSwipe,
      ],
    },
  });

  registerSpecies(Species.Fearow, {
    dexNumber: 22,
    name: 'Fearow',
    category: 'Beak Pokemon',
    height: 1.2,
    weight: 38,
    family: Families.Spearow,
    evolvesFrom: Species.Spearow,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 90,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 61,
      [Stats.SpecialDefense]: 61,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye],
    hiddenAbilities: [Abilities.Sniper, Abilities.BigPecks, Abilities.Hustle],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl, Moves.Leer, Moves.FuryAttack],
        25: [Moves.MirrorMove],
        26: [Moves.Pursuit],
        34: [Moves.DrillPeck],
        43: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
