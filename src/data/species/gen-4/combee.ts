import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Genders, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AirCutter,
  Moves.BugBite,
  Moves.Endeavor,
  Moves.MudSlap,
  Moves.OminousWind,
  Moves.Snore,
  Moves.StringShot,
  Moves.Swift,
  Moves.Tailwind,
];

/**
 * The comb and the queen. A Combee is three grubs flying in step, and
 * only a female one has a comb to build: the males stay as they are,
 * so a Vespiquen is always the one that was born to be one
 */
export default function registerCombeeSpecies(): void {
  registerSpecies(Species.Combee, {
    dexNumber: 415,
    evolvesInto: [
      {
        species: Species.Vespiquen,
        method: EvolutionMethod.Level | EvolutionMethod.Gender,
        level: 21,
        gender: Genders.Female,
      },
    ],
    name: 'Combee',
    category: 'Tiny Bee Pokemon',
    height: 0.3,
    weight: 5.5,
    family: Families.Combee,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 30,
      [Stats.Defense]: 42,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 42,
      [Stats.Speed]: 70,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.HoneyGather],
    hiddenAbilities: [Abilities.Hustle],
    eggGroups: [EggGroups.Bug],
    genderRatio: [7, 1],
    catchRate: 120,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Gust, Moves.SweetScent],
        13: [Moves.BugBite],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Vespiquen, {
    dexNumber: 416,
    name: 'Vespiquen',
    category: 'Beehive Pokemon',
    height: 1.2,
    weight: 38.5,
    family: Families.Combee,
    evolvesFrom: Species.Combee,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 80,
      [Stats.Defense]: 102,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 102,
      [Stats.Speed]: 40,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Pressure],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Bug],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Gust, Moves.SweetScent],
        3: [Moves.PoisonSting],
        7: [Moves.ConfuseRay],
        9: [Moves.FuryCutter],
        13: [Moves.DefendOrder],
        15: [Moves.Pursuit],
        19: [Moves.FurySwipes],
        21: [Moves.PowerGem],
        25: [Moves.HealOrder],
        27: [Moves.Toxic],
        31: [Moves.Slash],
        33: [Moves.Captivate],
        37: [Moves.AttackOrder],
        39: [Moves.Swagger],
        43: [Moves.DestinyBond],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AerialAce,
        Moves.Attract,
        Moves.Captivate,
        Moves.Cut,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roost,
        Moves.SecretPower,
        Moves.SignalBeam,
        Moves.SilverWind,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Thief,
        Moves.Toxic,
        Moves.UTurn,
        Moves.XScissor,
      ],
    },
  });
}
