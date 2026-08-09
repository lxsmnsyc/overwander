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
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Surf,
  Moves.Strength,
];

const FAMILY_ABILITIES = [Abilities.BattleArmor, Abilities.RockHead, Abilities.LightningRod];

export default function registerCuboneSpecies(): void {
  registerSpecies(Species.Cubone, {
    dexNumber: 104,
    evolvesInto: [
      {
        species: Species.Marowak,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Cubone',
    category: 'Lonely Pokemon',
    family: Families.Cubone,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 35,
    },
    types: [Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.BoneClub, Moves.Growl],
        25: [Moves.Leer],
        31: [Moves.FocusEnergy],
        38: [Moves.Thrash],
        43: [Moves.Bonemerang],
        46: [Moves.Rage],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Marowak, {
    dexNumber: 105,
    name: 'Marowak',
    category: 'Bone Keeper Pokemon',
    family: Families.Cubone,
    evolvesFrom: Species.Cubone,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 80,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 45,
    },
    types: [Types.Ground],
    abilities: [...FAMILY_ABILITIES],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.BoneClub, Moves.Growl, Moves.Leer],
        25: [Moves.Leer],
        33: [Moves.FocusEnergy],
        41: [Moves.Thrash],
        48: [Moves.Bonemerang],
        55: [Moves.Rage],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
