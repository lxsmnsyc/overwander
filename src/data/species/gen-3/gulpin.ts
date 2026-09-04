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
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Protect,
  Moves.RainDance,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.SludgeBomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Snatch,
  Moves.Strength,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.Explosion,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Rollout,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerGulpinSpecies(): void {
  registerSpecies(Species.Gulpin, {
    dexNumber: 316,
    evolvesInto: [
      {
        species: Species.Swalot,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Gulpin',
    category: 'Stomach Pokemon',
    height: 0.4,
    weight: 10.3,
    family: Families.Gulpin,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 43,
      [Stats.Defense]: 53,
      [Stats.SpecialAttack]: 43,
      [Stats.SpecialDefense]: 53,
      [Stats.Speed]: 40,
    },
    types: [Types.Poison],
    abilities: [Abilities.LiquidOoze, Abilities.StickyHold],
    hiddenAbilities: [Abilities.Gluttony],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Bog, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Pound],
        6: [Moves.Yawn],
        9: [Moves.PoisonGas],
        14: [Moves.Sludge],
        17: [Moves.Amnesia],
        23: [Moves.Encore],
        28: [Moves.Toxic],
        34: [Moves.Stockpile, Moves.SpitUp, Moves.Swallow],
        39: [Moves.SludgeBomb],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AcidArmor, Moves.PainSplit, Moves.Smog],
    },
  });

  registerSpecies(Species.Swalot, {
    dexNumber: 317,
    name: 'Swalot',
    category: 'Poison Bag Pokemon',
    height: 1.7,
    weight: 80,
    family: Families.Gulpin,
    evolvesFrom: Species.Gulpin,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 73,
      [Stats.Defense]: 83,
      [Stats.SpecialAttack]: 73,
      [Stats.SpecialDefense]: 83,
      [Stats.Speed]: 55,
    },
    types: [Types.Poison],
    abilities: [Abilities.LiquidOoze, Abilities.StickyHold],
    // One the mainline never gave it: what it swallows things with is
    // the same stuff it is full of
    hiddenAbilities: [Abilities.Gluttony, Abilities.PoisonTouch],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Bog, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Yawn, Moves.PoisonGas, Moves.Sludge],
        17: [Moves.Amnesia],
        23: [Moves.Encore],
        26: [Moves.BodySlam],
        31: [Moves.Toxic],
        40: [Moves.Stockpile, Moves.SpitUp, Moves.Swallow],
        48: [Moves.SludgeBomb],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
