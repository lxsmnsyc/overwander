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
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Psychic,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Surf,
];

// The evolved forms grow arms: fighting-style TMs and HM Strength
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Metronome,
  Moves.Strength,
];

export default function registerPoliwagSpecies(): void {
  registerSpecies(Species.Poliwag, {
    dexNumber: 60,
    evolvesInto: [
      {
        species: Species.Poliwhirl,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Poliwag',
    category: 'Tadpole Pokemon',
    height: 0.6,
    weight: 12.4,
    family: Families.Poliwag,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 50,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 90,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbility: Abilities.SwiftSwim,
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        16: [Moves.Hypnosis],
        19: [Moves.WaterGun],
        25: [Moves.DoubleSlap],
        31: [Moves.BodySlam],
        38: [Moves.Amnesia],
        45: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Mist, Moves.Splash],
    },
  });

  registerSpecies(Species.Poliwhirl, {
    dexNumber: 61,
    evolvesInto: [
      {
        species: Species.Poliwrath,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Poliwhirl',
    category: 'Tadpole Pokemon',
    height: 1,
    weight: 20,
    family: Families.Poliwag,
    evolvesFrom: Species.Poliwag,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 90,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbility: Abilities.SwiftSwim,
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Hypnosis, Moves.WaterGun],
        16: [Moves.Hypnosis],
        19: [Moves.WaterGun],
        26: [Moves.DoubleSlap],
        33: [Moves.BodySlam],
        41: [Moves.Amnesia],
        49: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE],
    },
  });

  registerSpecies(Species.Poliwrath, {
    dexNumber: 62,
    name: 'Poliwrath',
    category: 'Tadpole Pokemon',
    height: 1.3,
    weight: 54,
    family: Families.Poliwag,
    evolvesFrom: Species.Poliwhirl,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 95,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Fighting],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbility: Abilities.SwiftSwim,
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Hypnosis, Moves.WaterGun, Moves.DoubleSlap, Moves.BodySlam],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE, Moves.HyperBeam],
    },
  });
}
