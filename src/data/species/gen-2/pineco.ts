import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.SolarBeam,
  Moves.SunnyDay,
  Moves.GigaDrain,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.RockSmash,
  Moves.Strength,
  Moves.SweetScent,
  Moves.BodySlam,
  Moves.Dig,
  Moves.Earthquake,
  Moves.Facade,
  Moves.LightScreen,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.SecretPower,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.Sturdy];

export default function registerPinecoSpecies(): void {
  registerSpecies(Species.Pineco, {
    dexNumber: 204,
    evolvesInto: [
      {
        species: Species.Forretress,
        method: EvolutionMethod.Level,
        level: 31,
      },
    ],
    name: 'Pineco',
    category: 'Bagworm Pokemon',
    height: 0.6,
    weight: 7.2,
    family: Families.Pineco,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 15,
    },
    types: [Types.Bug],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Protect, Moves.Tackle],
        8: [Moves.SelfDestruct],
        15: [Moves.TakeDown],
        22: [Moves.RapidSpin],
        29: [Moves.Bide],
        36: [Moves.Explosion],
        43: [Moves.Spikes],
        50: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Flail,
        Moves.PinMissile,
        Moves.Reflect,
        Moves.Swift,
        Moves.Counter,
        Moves.SandTomb,
      ],
    },
  });

  registerSpecies(Species.Forretress, {
    dexNumber: 205,
    name: 'Forretress',
    category: 'Bagworm Pokemon',
    height: 1.2,
    weight: 125.8,
    family: Families.Pineco,
    evolvesFrom: Species.Pineco,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 90,
      [Stats.Defense]: 140,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 40,
    },
    types: [Types.Bug, Types.Steel],
    abilities: [...FAMILY_ABILITIES],
    // Aftermath and Filter are this registry's rather than the
    // mainline's, filling a final evolution to four: it goes off when
    // it goes down, and the shell blunts what the shell is weak to
    hiddenAbilities: [Abilities.Overcoat, Abilities.Aftermath, Abilities.Filter],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        31: [Moves.ZapCannon],
        1: [Moves.Protect, Moves.Tackle, Moves.SelfDestruct],
        15: [Moves.TakeDown],
        22: [Moves.RapidSpin],
        29: [Moves.Bide],
        39: [Moves.Explosion],
        49: [Moves.Spikes],
        59: [Moves.DoubleEdge],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Sandstorm,
        Moves.HyperBeam,
        Moves.Counter,
        Moves.Reflect,
      ],
    },
  });
}
