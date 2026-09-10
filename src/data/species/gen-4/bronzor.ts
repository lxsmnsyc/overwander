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
  Moves.AncientPower,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Earthquake,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.NaturalGift,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Rollout,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SignalBeam,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StealthRock,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
];

/**
 * Found where people used to live: Bronzor is a mirror somebody
 * buried, and a Bronzong is the bell that was rung above it
 */
export default function registerBronzorSpecies(): void {
  registerSpecies(Species.Bronzor, {
    dexNumber: 436,
    evolvesInto: [
      {
        species: Species.Bronzong,
        method: EvolutionMethod.Level,
        level: 33,
      },
    ],
    name: 'Bronzor',
    category: 'Bronze Pokemon',
    height: 0.5,
    weight: 60.5,
    family: Families.Bronzor,
    stats: {
      [Stats.HP]: 57,
      [Stats.Attack]: 24,
      [Stats.Defense]: 86,
      [Stats.SpecialAttack]: 24,
      [Stats.SpecialDefense]: 86,
      [Stats.Speed]: 23,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.Levitate, Abilities.Heatproof],
    hiddenAbilities: [Abilities.HeavyMetal],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Badlands, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Tackle],
        7: [Moves.Hypnosis],
        12: [Moves.Imprison],
        14: [Moves.ConfuseRay],
        19: [Moves.Extrasensory],
        26: [Moves.IronDefense],
        30: [Moves.Safeguard],
        35: [Moves.GyroBall],
        37: [Moves.FutureSight],
        41: [Moves.FeintAttack],
        49: [Moves.Payback],
        52: [Moves.HealBlock],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Bronzong, {
    dexNumber: 437,
    name: 'Bronzong',
    category: 'Bronze Bell Pokemon',
    height: 1.3,
    weight: 187.0,
    family: Families.Bronzor,
    evolvesFrom: Species.Bronzor,
    stats: {
      [Stats.HP]: 67,
      [Stats.Attack]: 89,
      [Stats.Defense]: 116,
      [Stats.SpecialAttack]: 79,
      [Stats.SpecialDefense]: 116,
      [Stats.Speed]: 33,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.Levitate, Abilities.Heatproof],
    // Mirror Armor is this registry's rather than the mainline's: the
    // face is polished, and 116 of each defense is worth keeping
    hiddenAbilities: [Abilities.HeavyMetal, Abilities.MirrorArmor],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 90,
    biomes: [Biome.Mountain, Biome.Badlands, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Confusion,
          Moves.Hypnosis,
          Moves.Imprison,
          Moves.RainDance,
          Moves.SunnyDay,
          Moves.Tackle,
        ],
        7: [Moves.Hypnosis],
        12: [Moves.Imprison],
        14: [Moves.ConfuseRay],
        19: [Moves.Extrasensory],
        26: [Moves.IronDefense],
        30: [Moves.Safeguard],
        33: [Moves.Block],
        38: [Moves.GyroBall],
        43: [Moves.FutureSight],
        50: [Moves.FeintAttack],
        61: [Moves.Payback],
        67: [Moves.HealBlock],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Explosion,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.RockSmash,
        Moves.Strength,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
