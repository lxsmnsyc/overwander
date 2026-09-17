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
  Moves.Attract,
  Moves.BulletSeed,
  Moves.Captivate,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Rollout,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WorrySeed,
];

/**
 * The cherry and what it opens into. A Cherrim keeps its blossom shut
 * until the sun is out, so the open shape is worn rather than met:
 * the dex fills it in the moment the closed one is
 */
export default function registerCherubiSpecies(): void {
  registerSpecies(Species.Cherubi, {
    dexNumber: 420,
    evolvesInto: [
      {
        species: Species.Cherrim,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Cherubi',
    category: 'Cherry Pokemon',
    height: 0.4,
    weight: 3.3,
    family: Families.Cherubi,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 35,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 62,
      [Stats.SpecialDefense]: 53,
      [Stats.Speed]: 35,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        7: [Moves.Growth],
        10: [Moves.LeechSeed],
        13: [Moves.HelpingHand],
        19: [Moves.MagicalLeaf],
        22: [Moves.SunnyDay],
        28: [Moves.WorrySeed],
        31: [Moves.TakeDown],
        37: [Moves.SolarBeam],
        40: [Moves.LuckyChant],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Aromatherapy,
        Moves.GrassWhistle,
        Moves.NaturePower,
        Moves.RazorLeaf,
        Moves.SweetScent,
        Moves.Tickle,
        Moves.WeatherBall,
      ],
    },
  });
  registerSpecies(Species.Cherrim, {
    dexNumber: 421,
    name: 'Cherrim',
    category: 'Blossom Pokemon',
    height: 0.5,
    weight: 9.3,
    family: Families.Cherubi,
    evolvesFrom: Species.Cherubi,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 87,
      [Stats.SpecialDefense]: 78,
      [Stats.Speed]: 85,
    },
    types: [Types.Grass],
    abilities: [Abilities.FlowerGift],
    // Harvest and Healer are this registry's rather than the
    // mainline's: the line is fruit, and a blossom opens for whoever
    // is standing under it
    hiddenAbilities: [Abilities.Harvest, Abilities.Healer],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growth, Moves.Tackle],
        7: [Moves.Growth],
        10: [Moves.LeechSeed],
        13: [Moves.HelpingHand],
        19: [Moves.MagicalLeaf],
        22: [Moves.SunnyDay],
        25: [Moves.PetalDance],
        30: [Moves.WorrySeed],
        35: [Moves.TakeDown],
        43: [Moves.SolarBeam],
        48: [Moves.LuckyChant],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
  registerSpecies(Species.CherrimSunshine, {
    dexNumber: 421,
    name: 'Sunshine Cherrim',
    category: 'Blossom Pokemon',
    height: 0.5,
    weight: 9.3,
    family: Families.Cherubi,
    evolvesFrom: Species.Cherubi,
    baseForm: false,
    worn: true,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 60,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 87,
      [Stats.SpecialDefense]: 78,
      [Stats.Speed]: 85,
    },
    types: [Types.Grass],
    abilities: [Abilities.FlowerGift],
    hiddenAbilities: [Abilities.Harvest, Abilities.Healer],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growth, Moves.Tackle],
        7: [Moves.Growth],
        10: [Moves.LeechSeed],
        13: [Moves.HelpingHand],
        19: [Moves.MagicalLeaf],
        22: [Moves.SunnyDay],
        25: [Moves.PetalDance],
        30: [Moves.WorrySeed],
        35: [Moves.TakeDown],
        43: [Moves.SolarBeam],
        48: [Moves.LuckyChant],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
