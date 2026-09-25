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
  Moves.CalmMind,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Electroweb,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.IronDefense,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.Payback,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SeedBomb,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StruggleBug,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WorrySeed,
  Moves.Confide,
];

/**
 * The tailors: a Sewaddle stitches its own clothes out of leaves, and
 * a Leavanny makes them for everything smaller than itself
 */
export default function registerSewaddleSpecies(): void {
  registerSpecies(Species.Sewaddle, {
    dexNumber: 540,
    evolvesInto: [
      {
        species: Species.Swadloon,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Sewaddle',
    category: 'Sewing Pokemon',
    height: 0.3,
    weight: 2.5,
    family: Families.Sewaddle,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 53,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 42,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.Swarm, Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.StringShot, Moves.Tackle],
        8: [Moves.BugBite],
        15: [Moves.RazorLeaf],
        22: [Moves.StruggleBug],
        29: [Moves.Endure],
        31: [Moves.StickyWeb],
        36: [Moves.BugBuzz],
        43: [Moves.Flail],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Agility,
        Moves.AirSlash,
        Moves.BatonPass,
        Moves.Camouflage,
        Moves.MeFirst,
        Moves.MindReader,
        Moves.RazorWind,
        Moves.Screech,
        Moves.SilverWind,
      ],
    },
  });
  registerSpecies(Species.Swadloon, {
    dexNumber: 541,
    evolvesInto: [
      {
        species: Species.Leavanny,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Swadloon',
    category: 'Leaf-Wrapped Pokemon',
    height: 0.5,
    weight: 7.3,
    family: Families.Sewaddle,
    evolvesFrom: Species.Sewaddle,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 63,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 42,
    },
    types: [Types.Bug, Types.Grass],
    abilities: [Abilities.LeafGuard, Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // Wrapped in its own leaves and growing: everything else it
      // knows it learned as a Sewaddle
      level: {
        1: [Moves.BugBite, Moves.GrassWhistle, Moves.RazorLeaf, Moves.StringShot, Moves.Tackle],
        20: [Moves.Protect],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Leavanny, {
    dexNumber: 542,
    name: 'Leavanny',
    category: 'Nurturing Pokemon',
    height: 1.2,
    weight: 20.5,
    family: Families.Sewaddle,
    evolvesFrom: Species.Swadloon,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 103,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 92,
    },
    types: [Types.Bug, Types.Grass],
    // Leaf Guard comes through Swadloon rather than its own, which is
    // what the pools walk puts in the hidden band
    abilities: [Abilities.Swarm, Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.BugBite, Moves.FalseSwipe, Moves.RazorLeaf, Moves.StringShot, Moves.Tackle],
        22: [Moves.StruggleBug],
        29: [Moves.Slash],
        32: [Moves.HelpingHand],
        34: [Moves.FellStinger],
        36: [Moves.LeafBlade],
        39: [Moves.XScissor],
        43: [Moves.Entrainment],
        46: [Moves.SwordsDance],
        50: [Moves.LeafStorm],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AerialAce,
        Moves.FalseSwipe,
        Moves.GigaImpact,
        Moves.HealBell,
        Moves.HelpingHand,
        Moves.HoneClaws,
        Moves.HyperBeam,
        Moves.KnockOff,
        Moves.PoisonJab,
        Moves.Reflect,
        Moves.Retaliate,
        Moves.ShadowClaw,
        Moves.SwordsDance,
        Moves.XScissor,
        Moves.LaserFocus,
        Moves.ThroatChop,
      ],
    },
  });
}
