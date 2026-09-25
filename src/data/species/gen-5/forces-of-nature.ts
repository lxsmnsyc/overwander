import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves all three share
const GENIE_TEACHABLE = [
  Moves.Attract,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Crunch,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.Fling,
  Moves.Fly,
  Moves.FocusBlast,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IronTail,
  Moves.NastyPlot,
  Moves.Payback,
  Moves.Protect,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.SmackDown,
  Moves.Snore,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WeatherBall,
];

/** The levels the three share, filled in with each one's own weather */
const GENIE_LEVELS = {
  5: [Moves.Leer],
  7: [Moves.Bite],
  11: [Moves.Twister],
  25: [Moves.Extrasensory],
  40: [Moves.Crunch],
};

/** What the tornadus knows, in either shape */
const TORNADUS_LEARNSET = {
  level: {
    ...GENIE_LEVELS,
    1: [
      Moves.Gust,
      Moves.Tackle,
      Moves.Thrash,
      Moves.Swagger,
      Moves.Uproar,
      Moves.Astonish,
      Moves.HammerArm,
      Moves.Tailwind,
      Moves.Hurricane,
    ],
    13: [Moves.Revenge],
    14: [Moves.AirCutter],
    22: [Moves.NastyPlot],
    35: [Moves.AirSlash],
    55: [Moves.RainDance],
    67: [Moves.DarkPulse],
  },
  teachable: [
    ...GENIE_TEACHABLE,
    Moves.Acrobatics,
    Moves.AerialAce,
    Moves.Agility,
    Moves.AirCutter,
    Moves.AirSlash,
    Moves.Assurance,
    Moves.DarkPulse,
    Moves.Embargo,
    Moves.FoulPlay,
    Moves.HeatWave,
    Moves.Hurricane,
    Moves.IcyWind,
    Moves.Incinerate,
    Moves.KnockOff,
    Moves.Metronome,
    Moves.Revenge,
    Moves.Reversal,
    Moves.Sandstorm,
    Moves.SkyDrop,
    Moves.Tailwind,
    Moves.Taunt,
    Moves.Thief,
    Moves.Torment,
    Moves.Uproar,
  ],
};

/** What the thundurus knows, in either shape */
const THUNDURUS_LEARNSET = {
  level: {
    ...GENIE_LEVELS,
    1: [
      Moves.Tackle,
      Moves.Thrash,
      Moves.ThunderShock,
      Moves.Swagger,
      Moves.Uproar,
      Moves.Charge,
      Moves.Astonish,
      Moves.HammerArm,
      Moves.NastyPlot,
    ],
    13: [Moves.Revenge],
    14: [Moves.Spark],
    19: [Moves.ShockWave],
    31: [Moves.Extrasensory],
    35: [Moves.VoltSwitch],
    37: [Moves.Discharge],
    47: [Moves.Thunder],
    60: [Moves.RainDance],
    67: [Moves.DarkPulse],
  },
  teachable: [
    ...GENIE_TEACHABLE,
    Moves.Acrobatics,
    Moves.Agility,
    Moves.Assurance,
    Moves.Charge,
    Moves.ChargeBeam,
    Moves.DarkPulse,
    Moves.ElectroBall,
    Moves.Electroweb,
    Moves.Embargo,
    Moves.FlashCannon,
    Moves.FoulPlay,
    Moves.Incinerate,
    Moves.KnockOff,
    Moves.Revenge,
    Moves.SkyDrop,
    Moves.Snarl,
    Moves.Taunt,
    Moves.Thief,
    Moves.Thunder,
    Moves.ThunderPunch,
    Moves.ThunderWave,
    Moves.Thunderbolt,
    Moves.Torment,
    Moves.Uproar,
    Moves.VoltSwitch,
    Moves.WildCharge,
    Moves.ZenHeadbutt,
  ],
};

/** What the landorus knows, in either shape */
const LANDORUS_LEARNSET = {
  level: {
    ...GENIE_LEVELS,
    1: [
      Moves.Tackle,
      Moves.RockThrow,
      Moves.Fissure,
      Moves.Outrage,
      Moves.Imprison,
      Moves.RockTomb,
      Moves.SandTomb,
      Moves.Block,
      Moves.MudShot,
      Moves.HammerArm,
      Moves.SmackDown,
    ],
    7: [Moves.Bite, Moves.Punishment],
    13: [Moves.Bulldoze],
    22: [Moves.BulkUp],
    25: [Moves.SwordsDance, Moves.Extrasensory],
    35: [Moves.RockSlide],
    37: [Moves.EarthPower],
    41: [Moves.Crunch],
    49: [Moves.Earthquake],
    50: [Moves.StoneEdge],
    55: [Moves.Sandstorm],
  },
  teachable: [
    ...GENIE_TEACHABLE,
    Moves.Bulldoze,
    Moves.CalmMind,
    Moves.Dig,
    Moves.EarthPower,
    Moves.Earthquake,
    Moves.Explosion,
    Moves.Gravity,
    Moves.Imprison,
    Moves.MudSlap,
    Moves.Outrage,
    Moves.RockPolish,
    Moves.RockSlide,
    Moves.RockTomb,
    Moves.SandTomb,
    Moves.Sandstorm,
    Moves.SelfDestruct,
    Moves.StealthRock,
    Moves.StoneEdge,
    Moves.SwordsDance,
    Moves.Taunt,
  ],
};

/**
 * The three that ride the storm clouds. Two of them wreck the fields
 * they pass over and the third makes the soil rich from what they
 * left, which is the whole of what the region says about them.
 *
 * Each carries a second shape, and the mirror that turns one into the
 * other is **not** written yet: it works the way the Meteorite does
 * for a Deoxys, spent on each change, and it waits until the art for
 * the other two shapes lands
 */
export default function registerForcesOfNatureSpecies(): void {
  registerSpecies(Species.Tornadus, {
    dexNumber: 641,
    name: 'Tornadus',
    category: 'Cyclone Pokemon',
    height: 1.5,
    weight: 63,
    family: Families.Tornadus,
    stats: {
      [Stats.HP]: 79,
      [Stats.Attack]: 115,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 111,
    },
    types: [Types.Flying],
    abilities: [Abilities.Prankster],
    // Wind Rider and Snow Warning are this registry's rather than the
    // mainline's: it is the wind, so nothing the wind carries touches
    // it, and the gale it arrives on is a freezing one. Regenerator
    // belongs to its other shape and never counts toward these four
    hiddenAbilities: [Abilities.Defiant, Abilities.WindRider, Abilities.SnowWarning],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: TORNADUS_LEARNSET,
  });
  registerSpecies(Species.Thundurus, {
    dexNumber: 642,
    name: 'Thundurus',
    category: 'Bolt Strike Pokemon',
    height: 1.5,
    weight: 61,
    family: Families.Thundurus,
    stats: {
      [Stats.HP]: 79,
      [Stats.Attack]: 115,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 111,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.Prankster],
    // Lightning Rod and Drizzle are this registry's rather than the
    // mainline's: every bolt on the field belongs to it, and the
    // downpour comes with the lightning. Volt Absorb belongs to its
    // other shape and never counts toward these four
    hiddenAbilities: [Abilities.Defiant, Abilities.LightningRod, Abilities.Drizzle],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: THUNDURUS_LEARNSET,
  });
  registerSpecies(Species.Landorus, {
    dexNumber: 645,
    name: 'Landorus',
    category: 'Abundance Pokemon',
    height: 1.5,
    weight: 68,
    family: Families.Landorus,
    stats: {
      [Stats.HP]: 89,
      [Stats.Attack]: 125,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 101,
    },
    types: [Types.Ground, Types.Flying],
    abilities: [Abilities.SandForce],
    // Harvest and Sand Stream are this registry's rather than the
    // mainline's: it follows the other two to make the ground rich
    // again, and it brings its own sand to do it in. Intimidate
    // belongs to its other shape and never counts toward these four
    hiddenAbilities: [Abilities.SheerForce, Abilities.Harvest, Abilities.SandStream],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: LANDORUS_LEARNSET,
  });

  // The other shape each one takes. It carries the ability that shape
  // is known by and nothing else, the way the mainline has it, and
  // nothing hands a catch one of these until the mirror is written
  registerSpecies(Species.TornadusTherian, {
    dexNumber: 641,
    name: 'Tornadus Therian',
    baseForm: false,
    category: 'Cyclone Pokemon',
    height: 1.4,
    weight: 63,
    family: Families.Tornadus,
    stats: {
      [Stats.HP]: 79,
      [Stats.Attack]: 100,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 121,
    },
    types: [Types.Flying],
    abilities: [Abilities.Regenerator],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: TORNADUS_LEARNSET,
  });
  registerSpecies(Species.ThundurusTherian, {
    dexNumber: 642,
    name: 'Thundurus Therian',
    baseForm: false,
    category: 'Bolt Strike Pokemon',
    height: 3,
    weight: 61,
    family: Families.Thundurus,
    stats: {
      [Stats.HP]: 79,
      [Stats.Attack]: 105,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 145,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 101,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.VoltAbsorb],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: THUNDURUS_LEARNSET,
  });
  registerSpecies(Species.LandorusTherian, {
    dexNumber: 645,
    name: 'Landorus Therian',
    baseForm: false,
    category: 'Abundance Pokemon',
    height: 1.3,
    weight: 68,
    family: Families.Landorus,
    stats: {
      [Stats.HP]: 89,
      [Stats.Attack]: 145,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 91,
    },
    types: [Types.Ground, Types.Flying],
    abilities: [Abilities.Intimidate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 3,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: LANDORUS_LEARNSET,
  });
}
