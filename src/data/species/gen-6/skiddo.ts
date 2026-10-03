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
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.NaturePower,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Roar,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.Round,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Surf,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WildCharge,
  Moves.WorrySeed,
  Moves.ZenHeadbutt,
];

// The pasture the goats graze, both stages alike
const FAMILY_BIOMES = [Biome.Grassland, Biome.Shrubland, Biome.Steppe, Biome.MontaneForest];

export default function registerSkiddoSpecies(): void {
  registerSpecies(Species.Skiddo, {
    dexNumber: 672,
    evolvesInto: [
      {
        species: Species.Gogoat,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Skiddo',
    category: 'Mount Pokemon',
    height: 0.9,
    weight: 31.0,
    family: Families.Skiddo,
    stats: {
      [Stats.HP]: 66,
      [Stats.Attack]: 65,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 62,
      [Stats.SpecialDefense]: 57,
      [Stats.Speed]: 52,
    },
    types: [Types.Grass],
    abilities: [Abilities.SapSipper],
    hiddenAbilities: [Abilities.GrassPelt],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growth],
        7: [Moves.VineWhip],
        9: [Moves.TailWhip],
        12: [Moves.LeechSeed],
        13: [Moves.RazorLeaf],
        16: [Moves.WorrySeed],
        20: [Moves.Synthesis],
        22: [Moves.TakeDown],
        26: [Moves.Bulldoze],
        30: [Moves.SeedBomb],
        34: [Moves.BulkUp],
        38: [Moves.DoubleEdge],
        42: [Moves.HornLeech],
        45: [Moves.LeafBlade],
        50: [Moves.MilkDrink],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.DefenseCurl, Moves.MilkDrink, Moves.Rollout],
    },
  });
  registerSpecies(Species.Gogoat, {
    dexNumber: 673,
    name: 'Gogoat',
    category: 'Mount Pokemon',
    height: 1.7,
    weight: 91.0,
    family: Families.Skiddo,
    evolvesFrom: Species.Skiddo,
    stats: {
      [Stats.HP]: 123,
      [Stats.Attack]: 100,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 97,
      [Stats.SpecialDefense]: 81,
      [Stats.Speed]: 68,
    },
    types: [Types.Grass],
    abilities: [Abilities.SapSipper],
    // Stamina and Harvest are this line's invented fillers: the
    // mainline gives Gogoat only the two above
    hiddenAbilities: [Abilities.GrassPelt, Abilities.Stamina, Abilities.Harvest],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growth],
        7: [Moves.VineWhip],
        9: [Moves.TailWhip],
        12: [Moves.LeechSeed],
        13: [Moves.RazorLeaf],
        16: [Moves.WorrySeed],
        20: [Moves.Synthesis],
        22: [Moves.TakeDown],
        26: [Moves.Bulldoze],
        30: [Moves.SeedBomb],
        34: [Moves.BulkUp],
        40: [Moves.DoubleEdge],
        47: [Moves.HornLeech],
        55: [Moves.LeafBlade],
        58: [Moves.MilkDrink],
        60: [Moves.Earthquake],
        65: [Moves.AerialAce],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AerialAce,
        Moves.Bounce,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Superpower,
        Moves.StompingTantrum,
      ],
    },
  });
}
