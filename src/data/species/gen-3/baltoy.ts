import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Earthquake,
  Moves.Return,
  Moves.Dig,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Sandstorm,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.SkillSwap,
  Moves.Flash,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.Explosion,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerBaltoySpecies(): void {
  registerSpecies(Species.Baltoy, {
    dexNumber: 343,
    evolvesInto: [
      {
        species: Species.Claydol,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Baltoy',
    category: 'Clay Doll Pokemon',
    height: 0.5,
    weight: 21.5,
    family: Families.Baltoy,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 40,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 55,
    },
    types: [Types.Ground, Types.Psychic],
    abilities: [Abilities.Levitate],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 255,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion],
        3: [Moves.Harden],
        5: [Moves.RapidSpin],
        7: [Moves.MudSlap],
        11: [Moves.Psybeam],
        15: [Moves.RockTomb],
        19: [Moves.SelfDestruct],
        25: [Moves.AncientPower],
        31: [Moves.Sandstorm],
        37: [Moves.CosmicPower],
        45: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Claydol, {
    dexNumber: 344,
    name: 'Claydol',
    category: 'Clay Doll Pokemon',
    height: 1.5,
    weight: 108,
    family: Families.Baltoy,
    evolvesFrom: Species.Baltoy,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 70,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 75,
    },
    types: [Types.Ground, Types.Psychic],
    abilities: [Abilities.Levitate],
    // Three the mainline never gave it, which is what a doll with one
    // ability owes: it works out the answer at leisure, fired clay
    // blunts what should be devastating, and the sand it was dug from
    // sharpens what it throws
    hiddenAbilities: [Abilities.Analytic, Abilities.Filter, Abilities.SandForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 90,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Teleport, Moves.Harden, Moves.RapidSpin],
        7: [Moves.MudSlap],
        11: [Moves.Psybeam],
        15: [Moves.RockTomb],
        19: [Moves.SelfDestruct],
        25: [Moves.AncientPower],
        31: [Moves.Sandstorm],
        36: [Moves.HyperBeam],
        42: [Moves.CosmicPower],
        55: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength, Moves.RockSmash],
    },
  });
}
