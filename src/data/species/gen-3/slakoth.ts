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
  Moves.FocusPunch,
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.BulkUp,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Return,
  Moves.ShadowBall,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Flamethrower,
  Moves.FireBlast,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.Strength,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
];

// What the two above the base pick up: the sloth in the tree is not
// getting up for any of them
const GROWN_TEACHABLE = [Moves.Roar, Moves.Earthquake, Moves.Taunt];

export default function registerSlakothSpecies(): void {
  registerSpecies(Species.Slakoth, {
    dexNumber: 287,
    evolvesInto: [
      {
        species: Species.Vigoroth,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Slakoth',
    category: 'Slacker Pokemon',
    height: 0.8,
    weight: 24,
    family: Families.Slakoth,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 30,
    },
    types: [Types.Normal],
    abilities: [Abilities.Truant],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TropicalRainforest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Yawn],
        7: [Moves.Encore],
        13: [Moves.SlackOff],
        19: [Moves.FeintAttack],
        25: [Moves.Amnesia],
        31: [Moves.Covet],
        37: [Moves.Counter],
        43: [Moves.Flail],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Slash, Moves.Pursuit, Moves.CrushClaw, Moves.Curse],
    },
  });

  registerSpecies(Species.Vigoroth, {
    dexNumber: 288,
    evolvesInto: [
      {
        species: Species.Slaking,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Vigoroth',
    category: 'Wild Monkey Pokemon',
    height: 1.4,
    weight: 46.5,
    family: Families.Slakoth,
    evolvesFrom: Species.Slakoth,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 80,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.VitalSpirit],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TropicalRainforest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.FocusEnergy, Moves.Encore, Moves.Uproar],
        19: [Moves.FurySwipes],
        25: [Moves.Endure],
        31: [Moves.Slash],
        37: [Moves.Counter],
        43: [Moves.FocusPunch],
        49: [Moves.Reversal],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Slaking, {
    dexNumber: 289,
    name: 'Slaking',
    category: 'Lazy Pokemon',
    height: 2,
    weight: 130.5,
    family: Families.Slakoth,
    evolvesFrom: Species.Vigoroth,
    stats: {
      [Stats.HP]: 150,
      [Stats.Attack]: 160,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal],
    abilities: [Abilities.Truant],
    // Comatose and Oblivious are this registry's rather than the
    // mainline's: it sleeps through most of the fight either way, and
    // a final evolution is filled to four
    hiddenAbilities: [Abilities.Comatose, Abilities.Oblivious],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TropicalRainforest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Yawn, Moves.Encore, Moves.SlackOff],
        19: [Moves.FeintAttack],
        25: [Moves.Amnesia],
        31: [Moves.Covet],
        36: [Moves.Swagger],
        37: [Moves.Counter],
        43: [Moves.Flail],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE, Moves.HyperBeam],
    },
  });
}
