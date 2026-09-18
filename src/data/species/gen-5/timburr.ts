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
  Moves.Block,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.CloseCombat,
  Moves.Curse,
  Moves.Dig,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.Endure,
  Moves.Facade,
  Moves.FirePunch,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusEnergy,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IcePunch,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Revenge,
  Moves.Reversal,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.SmackDown,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.WorkUp,
];

// What the line carries, in the order it grows into: a square timber,
// a steel beam, then a pillar of concrete in each hand
const FAMILY_LEVEL = {
  16: [Moves.BulkUp],
  20: [Moves.RockSlide, Moves.WakeUpSlap],
  24: [Moves.Slam, Moves.ChipAway],
};

/**
 * The labourers: the whole line works a building site, and none of
 * them will put down what it is carrying
 */
export default function registerTimburrSpecies(): void {
  registerSpecies(Species.Timburr, {
    dexNumber: 532,
    evolvesInto: [
      {
        species: Species.Gurdurr,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Timburr',
    category: 'Muscular Pokemon',
    height: 0.6,
    weight: 12.5,
    family: Families.Timburr,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 35,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Guts, Abilities.SheerForce],
    hiddenAbilities: [Abilities.IronFist],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 180,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer],
        4: [Moves.LowKick, Moves.FocusEnergy],
        8: [Moves.RockThrow, Moves.Bide],
        ...FAMILY_LEVEL,
        28: [Moves.ScaryFace],
        32: [Moves.DynamicPunch],
        36: [Moves.HammerArm],
        40: [Moves.StoneEdge],
        44: [Moves.Superpower],
        46: [Moves.FocusPunch],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.CometPunch,
        Moves.Counter,
        Moves.Defog,
        Moves.Detect,
        Moves.DrainPunch,
        Moves.Endure,
        Moves.ForcePalm,
        Moves.Foresight,
        Moves.MachPunch,
        Moves.Reversal,
        Moves.SmellingSalts,
        Moves.WideGuard,
      ],
    },
  });
  registerSpecies(Species.Gurdurr, {
    dexNumber: 533,
    evolvesInto: [
      {
        species: Species.Conkeldurr,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Gurdurr',
    category: 'Muscular Pokemon',
    height: 1.2,
    weight: 40,
    family: Families.Timburr,
    evolvesFrom: Species.Timburr,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 105,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 40,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Guts, Abilities.SheerForce],
    hiddenAbilities: [Abilities.IronFist],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 90,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer, Moves.LowKick, Moves.RockThrow, Moves.FocusEnergy, Moves.Bide],
        ...FAMILY_LEVEL,
        30: [Moves.ScaryFace],
        36: [Moves.DynamicPunch],
        42: [Moves.HammerArm],
        48: [Moves.StoneEdge],
        53: [Moves.FocusPunch],
        54: [Moves.Superpower],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Conkeldurr, {
    dexNumber: 534,
    name: 'Conkeldurr',
    category: 'Muscular Pokemon',
    height: 1.4,
    weight: 87,
    family: Families.Timburr,
    evolvesFrom: Species.Gurdurr,
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 140,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Guts, Abilities.SheerForce],
    // Rock Head is the invented fourth: the line reaches three, and
    // it throws its own weight about with concrete in both hands
    hiddenAbilities: [Abilities.IronFist, Abilities.RockHead],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Leer, Moves.LowKick, Moves.RockThrow, Moves.FocusEnergy, Moves.Bide],
        ...FAMILY_LEVEL,
        30: [Moves.ScaryFace],
        36: [Moves.DynamicPunch],
        42: [Moves.HammerArm],
        48: [Moves.StoneEdge],
        53: [Moves.FocusPunch],
        54: [Moves.Superpower],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BodySlam,
        Moves.Bulldoze,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockBlast,
      ],
    },
  });
}
