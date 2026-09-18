import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The three that stood between the pokemon and a burning forest, and
 * have kept standing since. They are built to one plan: the same
 * fourteen moves at the same levels, the same 580 spread turned a
 * different way, and one of them carries Sacred Sword for the others
 */

// TM and tutor moves all three share
const SWORD_TEACHABLE = [
  Moves.AerialAce,
  Moves.Block,
  Moves.CalmMind,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.FocusBlast,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Reflect,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Roar,
  Moves.RockSmash,
  Moves.Round,
  Moves.Safeguard,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.Superpower,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Taunt,
  Moves.Toxic,
  Moves.WorkUp,
  Moves.XScissor,
  Moves.ZenHeadbutt,
];

/** The levels the three share, filled in with each one's own move */
const SWORD_LEVELS = {
  7: [Moves.DoubleKick],
  19: [Moves.TakeDown],
  25: [Moves.HelpingHand],
  31: [Moves.Retaliate],
  42: [Moves.SacredSword],
  49: [Moves.SwordsDance],
  55: [Moves.QuickGuard],
  61: [Moves.WorkUp],
  73: [Moves.CloseCombat],
};

export default function registerSwordsOfJusticeSpecies(): void {
  registerSpecies(Species.Cobalion, {
    dexNumber: 638,
    name: 'Cobalion',
    category: 'Iron Will Pokemon',
    height: 2.1,
    weight: 250,
    family: Families.Cobalion,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 90,
      [Stats.Defense]: 129,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 72,
      [Stats.Speed]: 108,
    },
    types: [Types.Steel, Types.Fighting],
    abilities: [Abilities.Justified],
    // Sturdy, Clear Body and Inner Focus are this registry's rather
    // than the mainline's: nothing moves the one that holds the line
    hiddenAbilities: [Abilities.Sturdy, Abilities.ClearBody, Abilities.InnerFocus],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...SWORD_LEVELS,
        1: [Moves.Leer, Moves.QuickAttack],
        13: [Moves.MetalClaw],
        37: [Moves.IronHead],
        67: [Moves.MetalBurst],
      },
      teachable: [
        ...SWORD_TEACHABLE,
        Moves.Bounce,
        Moves.FlashCannon,
        Moves.HoneClaws,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.MagnetRise,
        Moves.PoisonJab,
        Moves.RockPolish,
        Moves.Sandstorm,
        Moves.StealthRock,
        Moves.ThunderWave,
        Moves.VoltSwitch,
      ],
    },
  });
  registerSpecies(Species.Terrakion, {
    dexNumber: 639,
    name: 'Terrakion',
    category: 'Cavern Pokemon',
    height: 1.9,
    weight: 260,
    family: Families.Terrakion,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 129,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 72,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 108,
    },
    types: [Types.Rock, Types.Fighting],
    abilities: [Abilities.Justified],
    // Sand Rush, Rock Head and Moxie are this registry's rather than
    // the mainline's: the one that goes through the wall pays nothing
    // for it and is worth more for every wall it went through
    hiddenAbilities: [Abilities.SandRush, Abilities.RockHead, Abilities.Moxie],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...SWORD_LEVELS,
        1: [Moves.Leer, Moves.QuickAttack],
        13: [Moves.SmackDown],
        37: [Moves.RockSlide],
        67: [Moves.StoneEdge],
      },
      teachable: [
        ...SWORD_TEACHABLE,
        Moves.Bulldoze,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.IronHead,
        Moves.PoisonJab,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.Sandstorm,
        Moves.SmackDown,
        Moves.StealthRock,
      ],
    },
  });
  registerSpecies(Species.Virizion, {
    dexNumber: 640,
    name: 'Virizion',
    category: 'Grassland Pokemon',
    height: 2,
    weight: 200,
    family: Families.Virizion,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 90,
      [Stats.Defense]: 72,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 129,
      [Stats.Speed]: 108,
    },
    types: [Types.Grass, Types.Fighting],
    abilities: [Abilities.Justified],
    // Chlorophyll, Leaf Guard and Serene Grace are this registry's
    // rather than the mainline's: the sun is what the swordsman of
    // the grassland fights in, and its blows carry what they carry
    hiddenAbilities: [Abilities.Chlorophyll, Abilities.LeafGuard, Abilities.SereneGrace],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...SWORD_LEVELS,
        1: [Moves.Leer, Moves.QuickAttack],
        13: [Moves.MagicalLeaf],
        37: [Moves.GigaDrain],
        67: [Moves.LeafBlade],
      },
      teachable: [
        ...SWORD_TEACHABLE,
        Moves.Bounce,
        Moves.EnergyBall,
        Moves.Flash,
        Moves.GigaDrain,
        Moves.GrassKnot,
        Moves.LightScreen,
        Moves.SeedBomb,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.Synthesis,
        Moves.WorrySeed,
      ],
    },
  });
}
