import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Genders, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.Covet,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.EchoedVoice,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.Gravity,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MagicRoom,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RolePlay,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Torment,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.WonderRoom,
  Moves.ZenHeadbutt,
];

// The wood the cats keep to, both stages alike
const FAMILY_BIOMES = [Biome.Woodland, Biome.TemperateForest];

// What the grown cat carries on top of the family's list
const MEOWSTIC_TEACHABLE = [
  ...FAMILY_TEACHABLE,
  Moves.Dig,
  Moves.GigaImpact,
  Moves.HyperBeam,
  Moves.PowerUpPunch,
  Moves.ShadowBall,
];

// What both sexes share: the same body, met in the same wood
const MEOWSTIC_SHARED = {
  dexNumber: 678,
  category: 'Constraint Pokemon',
  height: 0.6,
  weight: 8.5,
  family: Families.Espurr,
  evolvesFrom: Species.Espurr,
  stats: {
    [Stats.HP]: 74,
    [Stats.Attack]: 48,
    [Stats.Defense]: 76,
    [Stats.SpecialAttack]: 83,
    [Stats.SpecialDefense]: 81,
    [Stats.Speed]: 104,
  },
  types: [Types.Psychic],
  abilities: [Abilities.KeenEye, Abilities.Infiltrator],
  eggGroups: [EggGroups.Field],
  genderRatio: [1, 1] as [number, number],
  catchRate: 75,
  biomes: [...FAMILY_BIOMES],
  activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
};

/**
 * The cats that hold their own psychic power in. An Espurr keeps it
 * behind its ears; a Meowstic opens them and lets it out.
 *
 * The two sexes grow into different pokemon: he props screens up and
 * she throws, which the mainline says with different abilities and
 * different moves rather than with a recolour
 */
export default function registerEspurrSpecies(): void {
  registerSpecies(Species.Espurr, {
    dexNumber: 677,
    evolvesInto: [
      {
        species: Species.Meowstic,
        method: EvolutionMethod.Level | EvolutionMethod.Gender,
        level: 25,
        gender: Genders.Male,
      },
      {
        species: Species.MeowsticFemale,
        method: EvolutionMethod.Level | EvolutionMethod.Gender,
        level: 25,
        gender: Genders.Female,
      },
    ],
    name: 'Espurr',
    category: 'Restraint Pokemon',
    height: 0.3,
    weight: 3.5,
    family: Families.Espurr,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 48,
      [Stats.Defense]: 54,
      [Stats.SpecialAttack]: 63,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 68,
    },
    types: [Types.Psychic],
    abilities: [Abilities.KeenEye, Abilities.Infiltrator],
    hiddenAbilities: [Abilities.OwnTempo],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer],
        5: [Moves.Covet],
        9: [Moves.Confusion],
        13: [Moves.LightScreen],
        17: [Moves.Psybeam],
        19: [Moves.FakeOut],
        22: [Moves.DisarmingVoice],
        25: [Moves.Psyshock],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Assist, Moves.Barrier, Moves.Trick, Moves.Yawn],
    },
  });
  registerSpecies(Species.Meowstic, {
    ...MEOWSTIC_SHARED,
    name: 'Meowstic',
    // Synchronize is this line's invented filler: the mainline gives a
    // male Meowstic Prankster and nothing else, and her Competitive
    // is her own
    hiddenAbilities: [Abilities.Prankster, Abilities.Synchronize],
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer, Moves.MeanLook, Moves.HelpingHand],
        5: [Moves.Covet],
        9: [Moves.Confusion],
        13: [Moves.LightScreen],
        17: [Moves.Psybeam],
        19: [Moves.FakeOut],
        22: [Moves.DisarmingVoice],
        25: [Moves.Psyshock],
        28: [Moves.Charm],
        31: [Moves.MiracleEye],
        35: [Moves.Reflect],
        40: [Moves.Psychic],
        43: [Moves.RolePlay],
        45: [Moves.Imprison],
        48: [Moves.SuckerPunch],
        50: [Moves.MistyTerrain],
        53: [Moves.QuickGuard],
      },
      teachable: [...MEOWSTIC_TEACHABLE],
    },
  });
  registerSpecies(Species.MeowsticFemale, {
    ...MEOWSTIC_SHARED,
    // The same name as his: every list draws a gender symbol beside
    // it, so spelling the sex out again says nothing
    name: 'Meowstic',
    // Her own pokemon rather than his coat: she is drawn again, she
    // is born Competitive where he is born Prankster, and she learns
    // to throw where he learns to guard
    baseForm: false,
    hiddenAbilities: [Abilities.Competitive, Abilities.Synchronize],
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Leer, Moves.MagicalLeaf, Moves.MeFirst],
        5: [Moves.Covet],
        9: [Moves.Confusion],
        13: [Moves.LightScreen],
        17: [Moves.Psybeam],
        19: [Moves.FakeOut],
        22: [Moves.DisarmingVoice],
        25: [Moves.Psyshock],
        28: [Moves.ChargeBeam],
        31: [Moves.ShadowBall],
        35: [Moves.Extrasensory],
        40: [Moves.Psychic],
        43: [Moves.RolePlay],
        45: [Moves.SignalBeam],
        48: [Moves.SuckerPunch],
        50: [Moves.FutureSight],
        53: [Moves.StoredPower],
      },
      teachable: [...MEOWSTIC_TEACHABLE],
    },
  });
}
