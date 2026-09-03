import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves the two with arms share. A Beldum has none:
// it knows one move and takes nothing else
const ARMED_TEACHABLE = [
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.HyperBeam,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Earthquake,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.SludgeBomb,
  Moves.Sandstorm,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Cut,
  Moves.Strength,
  Moves.Flash,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Explosion,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Rollout,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.ThunderPunch,
  Moves.SleepTalk,
  Moves.DefenseCurl,
  Moves.Swift,
];

export default function registerBeldumSpecies(): void {
  registerSpecies(Species.Beldum, {
    dexNumber: 374,
    evolvesInto: [
      {
        species: Species.Metang,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Beldum',
    category: 'Iron Ball Pokemon',
    height: 0.6,
    weight: 95.2,
    family: Families.Beldum,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 55,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 30,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.ClearBody],
    hiddenAbilities: [Abilities.LightMetal],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Badlands, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.TakeDown],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Metang, {
    dexNumber: 375,
    evolvesInto: [
      {
        species: Species.Metagross,
        method: EvolutionMethod.Level,
        level: 45,
      },
    ],
    name: 'Metang',
    category: 'Iron Claw Pokemon',
    height: 1.2,
    weight: 202.5,
    family: Families.Beldum,
    evolvesFrom: Species.Beldum,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 75,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 50,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.ClearBody],
    hiddenAbilities: [Abilities.LightMetal],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Badlands, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.TakeDown],
        20: [Moves.Confusion, Moves.MetalClaw],
        26: [Moves.ScaryFace],
        32: [Moves.Pursuit],
        38: [Moves.Psychic],
        44: [Moves.IronDefense],
        50: [Moves.MeteorMash],
        56: [Moves.Agility],
        62: [Moves.HyperBeam],
      },
      teachable: [...ARMED_TEACHABLE],
    },
  });

  registerSpecies(Species.Metagross, {
    dexNumber: 376,
    name: 'Metagross',
    category: 'Iron Leg Pokemon',
    height: 1.6,
    weight: 550,
    family: Families.Beldum,
    evolvesFrom: Species.Metang,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 135,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 70,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.ClearBody],
    // Two the mainline never gave it: it holds itself off the ground
    // on its own mind, and four brains' worth of attention goes into
    // whatever it makes of steel
    hiddenAbilities: [Abilities.LightMetal, Abilities.Levitate, Abilities.Steelworker],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Badlands, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.TakeDown, Moves.Confusion, Moves.MetalClaw, Moves.ScaryFace],
        32: [Moves.Pursuit],
        38: [Moves.Psychic],
        44: [Moves.IronDefense],
        55: [Moves.MeteorMash],
        66: [Moves.Agility],
        77: [Moves.HyperBeam],
      },
      teachable: [...ARMED_TEACHABLE],
    },
  });
}
