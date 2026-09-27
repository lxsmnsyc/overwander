import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.AerialAce,
  Moves.Agility,
  Moves.AirCutter,
  Moves.AirSlash,
  Moves.Assurance,
  Moves.Attract,
  Moves.BodySlam,
  Moves.BraveBird,
  Moves.BulkUp,
  Moves.CloseCombat,
  Moves.Cut,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.FeatherDance,
  Moves.Fly,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.Hurricane,
  Moves.Pluck,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Roost,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SkyDrop,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SteelWing,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Swift,
  Moves.Tailwind,
  Moves.TakeDown,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
  Moves.Confide,
];

// What the eagle works out how to do, at either size
const FAMILY_LEVEL = {
  18: [Moves.Tailwind],
  19: [Moves.ScaryFace],
  32: [Moves.Defog],
  46: [Moves.CrushClaw],
  50: [Moves.SkyDrop],
};

/**
 * The eagle: every Rufflet is male, and it will pick a fight with
 * anything at all so long as it has something to prove
 */
export default function registerRuffletSpecies(): void {
  registerSpecies(Species.Rufflet, {
    dexNumber: 627,
    evolvesInto: [
      {
        species: Species.Braviary,
        method: EvolutionMethod.Level,
        level: 54,
      },
    ],
    name: 'Rufflet',
    category: 'Eaglet Pokemon',
    height: 0.5,
    weight: 10.5,
    family: Families.Rufflet,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 83,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 37,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 60,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.SheerForce],
    hiddenAbilities: [Abilities.Hustle],
    eggGroups: [EggGroups.Flying],
    // Male only, the way its counterpart on the far side of the ridge
    // is female only
    genderRatio: [1, 0],
    catchRate: 190,
    biomes: [Biome.Mountain, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Peck, Moves.QuickAttack],
        5: [Moves.FuryAttack],
        6: [Moves.AerialAce, Moves.HoneClaws],
        10: [Moves.WingAttack],
        11: [Moves.Twister],
        ...FAMILY_LEVEL,
        20: [Moves.AirSlash],
        25: [Moves.Roost],
        34: [Moves.DoubleEdge],
        42: [Moves.Whirlwind],
        43: [Moves.BraveBird],
        64: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.RockSmash, Moves.Roost],
    },
  });
  registerSpecies(Species.Braviary, {
    dexNumber: 628,
    name: 'Braviary',
    category: 'Valiant Pokemon',
    height: 1.5,
    weight: 41,
    family: Families.Rufflet,
    evolvesFrom: Species.Rufflet,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 123,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 57,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 80,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.KeenEye, Abilities.SheerForce],
    // Four without inventing anything: Hustle walks up from the Rufflet
    // below it and Defiant is its own
    hiddenAbilities: [Abilities.Defiant],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 0],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.WingAttack,
          Moves.Whirlwind,
          Moves.FuryAttack,
          Moves.Thrash,
          Moves.Leer,
          Moves.Peck,
          Moves.SkyAttack,
          Moves.BraveBird,
          Moves.HoneClaws,
          Moves.Superpower,
        ],
        ...FAMILY_LEVEL,
        23: [Moves.AerialAce],
        28: [Moves.Slash],
        41: [Moves.AirSlash],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.MetalClaw,
        Moves.Reversal,
      ],
    },
  });
}
