import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.BugBite,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Frustration,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.IronDefense,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.Round,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StruggleBug,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Toxic,
  Moves.Venoshock,
  Moves.Confide,
  Moves.Infestation,
];

/**
 * The centipedes: a Venipede tastes the ground with its antennae, and
 * a Scolipede runs down whatever it has decided on
 */
export default function registerVenipedeSpecies(): void {
  registerSpecies(Species.Venipede, {
    dexNumber: 543,
    evolvesInto: [
      {
        species: Species.Whirlipede,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Venipede',
    category: 'Centipede Pokemon',
    height: 0.4,
    weight: 5.3,
    family: Families.Venipede,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 45,
      [Stats.Defense]: 59,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 39,
      [Stats.Speed]: 57,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.Swarm],
    hiddenAbilities: [Abilities.SpeedBoost],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.DefenseCurl, Moves.Rollout],
        5: [Moves.PoisonSting],
        8: [Moves.Screech],
        12: [Moves.Pursuit],
        15: [Moves.Protect],
        19: [Moves.PoisonTail],
        22: [Moves.BugBite],
        26: [Moves.Venoshock],
        29: [Moves.Agility],
        33: [Moves.Steamroller],
        36: [Moves.Toxic],
        40: [Moves.RockClimb],
        43: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.PinMissile,
        Moves.RockClimb,
        Moves.Spikes,
        Moves.TakeDown,
        Moves.ToxicSpikes,
        Moves.Twineedle,
      ],
    },
  });
  registerSpecies(Species.Whirlipede, {
    dexNumber: 544,
    evolvesInto: [
      {
        species: Species.Scolipede,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Whirlipede',
    category: 'Curlipede Pokemon',
    height: 1.2,
    weight: 58.5,
    family: Families.Venipede,
    evolvesFrom: Species.Venipede,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 55,
      [Stats.Defense]: 99,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 79,
      [Stats.Speed]: 47,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.Swarm],
    hiddenAbilities: [Abilities.SpeedBoost],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.DefenseCurl, Moves.PoisonSting, Moves.Rollout, Moves.Screech],
        12: [Moves.Pursuit],
        15: [Moves.Protect],
        19: [Moves.PoisonTail],
        22: [Moves.IronDefense],
        23: [Moves.BugBite],
        28: [Moves.Venoshock],
        32: [Moves.Agility],
        37: [Moves.Steamroller],
        41: [Moves.Toxic],
        43: [Moves.VenomDrench],
        46: [Moves.RockClimb],
        50: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Scolipede, {
    dexNumber: 545,
    name: 'Scolipede',
    category: 'Megapede Pokemon',
    height: 2.5,
    weight: 200.5,
    family: Families.Venipede,
    evolvesFrom: Species.Whirlipede,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 100,
      [Stats.Defense]: 89,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 69,
      [Stats.Speed]: 112,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.Swarm],
    // Rough Skin is the invented fourth: the line reaches three, and
    // it is spines and horns from end to end
    hiddenAbilities: [Abilities.SpeedBoost, Abilities.RoughSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.DefenseCurl, Moves.Megahorn, Moves.PoisonSting, Moves.Rollout, Moves.Screech],
        12: [Moves.Pursuit],
        15: [Moves.Protect],
        19: [Moves.PoisonTail],
        23: [Moves.BugBite],
        28: [Moves.Venoshock],
        30: [Moves.BatonPass],
        33: [Moves.Agility],
        39: [Moves.Steamroller],
        44: [Moves.Toxic],
        47: [Moves.VenomDrench],
        50: [Moves.RockClimb],
        55: [Moves.DoubleEdge],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AquaTail,
        Moves.Bulldoze,
        Moves.Cut,
        Moves.Dig,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.Snatch,
        Moves.Strength,
        Moves.Superpower,
        Moves.SwordsDance,
        Moves.XScissor,
      ],
    },
  });
}
