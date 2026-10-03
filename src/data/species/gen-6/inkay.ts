import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.BatonPass,
  Moves.Bind,
  Moves.CalmMind,
  Moves.Confide,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.Embargo,
  Moves.Endure,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Flamethrower,
  Moves.Flash,
  Moves.Fling,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.FutureSight,
  Moves.Gravity,
  Moves.GuardSwap,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.KnockOff,
  Moves.LightScreen,
  Moves.NastyPlot,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psybeam,
  Moves.Psychic,
  Moves.PsychoCut,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.RockSlide,
  Moves.RolePlay,
  Moves.Round,
  Moves.SecretPower,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.Spite,
  Moves.StoredPower,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Swift,
  Moves.Taunt,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Thunderbolt,
  Moves.Torment,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
];

// The dark shallows both shapes hang in
const FAMILY_BIOMES = [Biome.Beach, Biome.KelpForest];

// What the squid knows whichever way up it is
const FAMILY_LEVEL = {
  8: [Moves.FoulPlay],
  9: [Moves.Payback],
  12: [Moves.Pluck, Moves.Swagger],
  13: [Moves.Psywave],
  15: [Moves.Psybeam, Moves.TopsyTurvy],
  21: [Moves.Slash],
  23: [Moves.Switcheroo],
  24: [Moves.NightSlash],
  27: [Moves.PsychoCut],
  31: [Moves.LightScreen],
};

/**
 * The squid that hangs upside down and talks whoever looks at it into
 * doing the same. Its lights are the whole trick: what an enemy has
 * built up comes off it rather than being matched
 */
export default function registerInkaySpecies(): void {
  registerSpecies(Species.Inkay, {
    dexNumber: 686,
    evolvesInto: [
      {
        species: Species.Malamar,
        method: EvolutionMethod.Level | EvolutionMethod.KnownMove,
        level: 30,
        move: Moves.TopsyTurvy,
      },
    ],
    name: 'Inkay',
    category: 'Revolving Pokemon',
    height: 0.4,
    weight: 3.5,
    family: Families.Inkay,
    stats: {
      [Stats.HP]: 53,
      [Stats.Attack]: 54,
      [Stats.Defense]: 53,
      [Stats.SpecialAttack]: 37,
      [Stats.SpecialDefense]: 46,
      [Stats.Speed]: 45,
    },
    types: [Types.Dark, Types.Psychic],
    abilities: [Abilities.Contrary, Abilities.SuctionCups],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 190,
    habitat: Habitat.Amphibious,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Peck, Moves.Constrict],
        3: [Moves.Hypnosis],
        4: [Moves.Reflect],
        6: [Moves.Wrap],
        ...FAMILY_LEVEL,
        39: [Moves.Superpower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Acupressure,
        Moves.DestinyBond,
        Moves.Disable,
        Moves.Flatter,
        Moves.GuardSwap,
        Moves.PowerSplit,
        Moves.SimpleBeam,
      ],
    },
  });
  registerSpecies(Species.Malamar, {
    dexNumber: 687,
    name: 'Malamar',
    category: 'Overturning Pokemon',
    height: 1.5,
    weight: 47.0,
    family: Families.Inkay,
    evolvesFrom: Species.Inkay,
    stats: {
      [Stats.HP]: 86,
      [Stats.Attack]: 92,
      [Stats.Defense]: 88,
      [Stats.SpecialAttack]: 68,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 73,
    },
    types: [Types.Dark, Types.Psychic],
    abilities: [Abilities.Contrary, Abilities.SuctionCups],
    // Analytic is this line's invented filler: the mainline gives the
    // squid Contrary, Suction Cups and Infiltrator and nothing else
    hiddenAbilities: [Abilities.Infiltrator, Abilities.Analytic],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 80,
    habitat: Habitat.Amphibious,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.Peck,
          Moves.Constrict,
          Moves.Hypnosis,
          Moves.Reflect,
          Moves.Wrap,
          Moves.Superpower,
          Moves.Reversal,
        ],
        ...FAMILY_LEVEL,
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Block,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Reversal,
        Moves.ScaryFace,
        Moves.SignalBeam,
        Moves.BrutalSwing,
        Moves.ThroatChop,
      ],
    },
  });
}
