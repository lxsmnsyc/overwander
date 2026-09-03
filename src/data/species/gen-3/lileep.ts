import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.SludgeBomb,
  Moves.Sandstorm,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerLileepSpecies(): void {
  registerSpecies(Species.Lileep, {
    dexNumber: 345,
    evolvesInto: [
      {
        species: Species.Cradily,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Lileep',
    category: 'Sea Lily Pokemon',
    height: 1,
    weight: 23.8,
    family: Families.Lileep,
    stats: {
      [Stats.HP]: 66,
      [Stats.Attack]: 41,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 61,
      [Stats.SpecialDefense]: 87,
      [Stats.Speed]: 23,
    },
    types: [Types.Rock, Types.Grass],
    abilities: [Abilities.SuctionCups],
    hiddenAbilities: [Abilities.StormDrain],
    eggGroups: [EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    // Nowhere: what comes out of a fossil is not in the world any more
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Astonish],
        8: [Moves.Constrict],
        15: [Moves.Acid],
        22: [Moves.Ingrain],
        29: [Moves.ConfuseRay],
        36: [Moves.Amnesia],
        43: [Moves.AncientPower],
        50: [Moves.Stockpile, Moves.SpitUp, Moves.Swallow],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Barrier, Moves.MirrorCoat, Moves.Recover],
    },
  });

  registerSpecies(Species.Cradily, {
    dexNumber: 346,
    name: 'Cradily',
    category: 'Barnacle Pokemon',
    height: 1.5,
    weight: 60.4,
    family: Families.Lileep,
    evolvesFrom: Species.Lileep,
    stats: {
      [Stats.HP]: 86,
      [Stats.Attack]: 81,
      [Stats.Defense]: 97,
      [Stats.SpecialAttack]: 81,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 43,
    },
    types: [Types.Rock, Types.Grass],
    abilities: [Abilities.SuctionCups],
    // Two the mainline never gave it: the filter feeder drinks what
    // is thrown at it, and a thing anchored to the rock only settles
    // deeper for being hit
    hiddenAbilities: [Abilities.StormDrain, Abilities.WaterAbsorb, Abilities.Stamina],
    eggGroups: [EggGroups.Water3],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.Constrict, Moves.Acid, Moves.Ingrain],
        29: [Moves.ConfuseRay],
        36: [Moves.Amnesia],
        48: [Moves.AncientPower],
        60: [Moves.Stockpile, Moves.SpitUp, Moves.Swallow],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.RockTomb,
        Moves.Strength,
        Moves.RockSmash,
      ],
    },
  });
}
