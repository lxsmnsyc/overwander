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
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Cut,
  Moves.Strength,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Swift,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Sandstorm,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.RockSmash,
  Moves.AerialAce,
  Moves.BrickBreak,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.RockTomb,
  Moves.SecretPower,
];

export default function registerSandshrewSpecies(): void {
  registerSpecies(Species.Sandshrew, {
    dexNumber: 27,
    evolvesInto: [
      {
        species: Species.Sandslash,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Sandshrew',
    category: 'Mouse Pokemon',
    height: 0.6,
    weight: 12,
    family: Families.Sandshrew,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 40,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandVeil],
    hiddenAbilities: [Abilities.SandRush],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        6: [Moves.DefenseCurl],
        10: [Moves.SandAttack],
        17: [Moves.Slash, Moves.PoisonSting],
        30: [Moves.Swift],
        37: [Moves.FurySwipes],
        45: [Moves.Sandstorm, Moves.SandTomb],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Counter,
        Moves.Swift,
        Moves.Flail,
        Moves.Safeguard,
        Moves.RapidSpin,
        Moves.MetalClaw,

        Moves.CrushClaw,
      ],
    },
  });

  registerSpecies(Species.Sandslash, {
    dexNumber: 28,
    name: 'Sandslash',
    category: 'Mouse Pokemon',
    height: 1,
    weight: 29.5,
    family: Families.Sandshrew,
    evolvesFrom: Species.Sandshrew,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 100,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 65,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandVeil],
    hiddenAbilities: [Abilities.SandRush, Abilities.SandForce, Abilities.RoughSkin],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.SandAttack, Moves.DefenseCurl],
        17: [Moves.Slash, Moves.PoisonSting],
        33: [Moves.Swift],
        42: [Moves.FurySwipes],
        52: [Moves.Sandstorm, Moves.SandTomb],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Counter],
    },
  });
}
