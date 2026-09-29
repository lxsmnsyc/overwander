import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.AllySwitch,
  Moves.Attract,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.ConfuseRay,
  Moves.Curse,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.GrassyTerrain,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.Imprison,
  Moves.MagicCoat,
  Moves.MagicalLeaf,
  Moves.NaturePower,
  Moves.NightShade,
  Moves.PainSplit,
  Moves.PhantomForce,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RolePlay,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Spite,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.VenomDrench,
  Moves.WillOWisp,
  Moves.WorrySeed,
];

// The old wood both shapes haunt
const FAMILY_BIOMES = [Biome.Woodland, Biome.TemperateForest];

// What the stump knows whichever size it has grown to
const FAMILY_LEVEL = {
  13: [Moves.Ingrain],
  16: [Moves.WillOWisp],
  19: [Moves.FeintAttack],
  20: [Moves.Hex],
  35: [Moves.ForestsCurse],
  36: [Moves.PhantomForce],
  39: [Moves.DestinyBond],
  44: [Moves.WoodHammer],
};

/**
 * The stump a lost child grew into, and the tree it becomes. What it
 * hits it takes into the wood with it, which is the curse the forest
 * is named for
 */
export default function registerPhantumpSpecies(): void {
  registerSpecies(Species.Phantump, {
    dexNumber: 708,
    evolvesInto: [
      {
        species: Species.Trevenant,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Phantump',
    category: 'Stump Pokemon',
    height: 0.4,
    weight: 7.0,
    family: Families.Phantump,
    stats: {
      [Stats.HP]: 43,
      [Stats.Attack]: 70,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 38,
    },
    types: [Types.Ghost, Types.Grass],
    abilities: [Abilities.NaturalCure, Abilities.Frisk],
    hiddenAbilities: [Abilities.Harvest],
    eggGroups: [EggGroups.Grass, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.ConfuseRay, Moves.Astonish],
        8: [Moves.Growth, Moves.LeechSeed],
        ...FAMILY_LEVEL,
        28: [Moves.Curse, Moves.HornLeech],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AllySwitch,
        Moves.Bestow,
        Moves.Disable,
        Moves.Grudge,
        Moves.Imprison,
        Moves.PowerUpPunch,
        Moves.SuckerPunch,
        Moves.VenomDrench,
      ],
    },
  });
  registerSpecies(Species.Trevenant, {
    dexNumber: 709,
    name: 'Trevenant',
    category: 'Elder Tree Pokemon',
    height: 1.5,
    weight: 71.0,
    family: Families.Phantump,
    evolvesFrom: Species.Phantump,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 110,
      [Stats.Defense]: 76,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 82,
      [Stats.Speed]: 56,
    },
    types: [Types.Ghost, Types.Grass],
    abilities: [Abilities.NaturalCure, Abilities.Frisk],
    // Cursed Body is this line's invented filler, and Gourgeist's as
    // well: the two the versions keep apart answer a move the same way
    hiddenAbilities: [Abilities.Harvest, Abilities.CursedBody],
    eggGroups: [EggGroups.Grass, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.ConfuseRay,
          Moves.Astonish,
          Moves.Growth,
          Moves.LeechSeed,
          Moves.HornLeech,
          Moves.ShadowClaw,
        ],
        ...FAMILY_LEVEL,
        28: [Moves.Curse],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Block,
        Moves.CalmMind,
        Moves.DrainPunch,
        Moves.Earthquake,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.Haze,
        Moves.HoneClaws,
        Moves.HyperBeam,
        Moves.KnockOff,
        Moves.LeafStorm,
        Moves.PowerUpPunch,
        Moves.ScaryFace,
        Moves.TakeDown,
        Moves.XScissor,
      ],
    },
  });
}
