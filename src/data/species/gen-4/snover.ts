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
  Moves.Avalanche,
  Moves.Blizzard,
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
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcePunch,
  Moves.IcyWind,
  Moves.IronTail,
  Moves.LightScreen,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WaterPulse,
];

/**
 * The tree that brings its own winter: a Snover walks down to where
 * people are when the snow comes, and an Abomasnow makes the snow
 */
export default function registerSnoverSpecies(): void {
  registerSpecies(Species.Snover, {
    dexNumber: 459,
    evolvesInto: [
      {
        species: Species.Abomasnow,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Snover',
    category: 'Frost Tree Pokemon',
    height: 1.0,
    weight: 50.5,
    family: Families.Snover,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 62,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 62,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 40,
    },
    types: [Types.Grass, Types.Ice],
    abilities: [Abilities.SnowWarning],
    hiddenAbilities: [Abilities.Soundproof],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.AlpineTundra, Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.PowderSnow],
        5: [Moves.RazorLeaf],
        9: [Moves.IcyWind],
        13: [Moves.GrassWhistle],
        17: [Moves.Swagger],
        21: [Moves.Mist],
        26: [Moves.IceShard],
        31: [Moves.Ingrain],
        36: [Moves.WoodHammer],
        41: [Moves.Blizzard],
        46: [Moves.SheerCold],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.DoubleEdge,
        Moves.Growth,
        Moves.LeechSeed,
        Moves.MagicalLeaf,
        Moves.Mist,
        Moves.SeedBomb,
        Moves.Stomp,
      ],
    },
  });
  registerSpecies(Species.Abomasnow, {
    dexNumber: 460,
    name: 'Abomasnow',
    category: 'Frost Tree Pokemon',
    height: 2.2,
    weight: 135.5,
    family: Families.Snover,
    evolvesFrom: Species.Snover,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 92,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 92,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass, Types.Ice],
    abilities: [Abilities.SnowWarning],
    // Ice Body and Slush Rush are this registry's rather than the
    // mainline's: the line has two abilities and needs four, and both
    // are paid for by the hail it brings itself
    hiddenAbilities: [Abilities.Soundproof, Abilities.IceBody, Abilities.SlushRush],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.AlpineTundra, Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.IcePunch, Moves.IcyWind, Moves.Leer, Moves.PowderSnow, Moves.RazorLeaf],
        5: [Moves.RazorLeaf],
        9: [Moves.IcyWind],
        13: [Moves.GrassWhistle],
        17: [Moves.Swagger],
        21: [Moves.Mist],
        26: [Moves.IceShard],
        31: [Moves.Ingrain],
        36: [Moves.WoodHammer],
        47: [Moves.Blizzard],
        58: [Moves.SheerCold],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BrickBreak,
        Moves.Earthquake,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Outrage,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Strength,
      ],
    },
  });
}
