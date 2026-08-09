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
    hiddenAbility: Abilities.Sniper,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl],
        9: [Moves.Leer],
        15: [Moves.FuryAttack],
        22: [Moves.MirrorMove],
        29: [Moves.DrillPeck],
        36: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Fearow, {
    dexNumber: 22,
    name: 'Fearow',
    category: 'Beak Pokemon',
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
    hiddenAbility: Abilities.Sniper,
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Shrubland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl, Moves.Leer],
        9: [Moves.Leer],
        15: [Moves.FuryAttack],
        25: [Moves.MirrorMove],
        34: [Moves.DrillPeck],
        43: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
