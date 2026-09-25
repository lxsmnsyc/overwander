import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by both shapes
const FAMILY_TEACHABLE = [
  Moves.Agility,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.Bulldoze,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DragonTail,
  Moves.ElectricTerrain,
  Moves.ElectroBall,
  Moves.Electroweb,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.LightScreen,
  Moves.LowSweep,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.VoltSwitch,
  Moves.WildCharge,
];

// The dry ground the frills are worth something on
const FAMILY_BIOMES = [Biome.Desert, Biome.Badlands];

/**
 * The lizard that runs on light. Its frills are cells rather than
 * ears, and what they take out of an enemy goes back down the line to
 * whoever is standing with it
 */
export default function registerHelioptileSpecies(): void {
  registerSpecies(Species.Helioptile, {
    dexNumber: 694,
    evolvesInto: [
      {
        species: Species.Heliolisk,
        method: EvolutionMethod.UsedItem,
        item: Items.SunStone,
      },
    ],
    name: 'Helioptile',
    category: 'Generator Pokemon',
    height: 0.5,
    weight: 6.0,
    family: Families.Helioptile,
    stats: {
      [Stats.HP]: 44,
      [Stats.Attack]: 38,
      [Stats.Defense]: 33,
      [Stats.SpecialAttack]: 61,
      [Stats.SpecialDefense]: 43,
      [Stats.Speed]: 70,
    },
    types: [Types.Electric, Types.Normal],
    abilities: [Abilities.DrySkin, Abilities.SandVeil],
    hiddenAbilities: [Abilities.SolarPower],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.TailWhip, Moves.MudSlap],
        6: [Moves.ThunderShock],
        11: [Moves.Charge],
        12: [Moves.QuickAttack],
        20: [Moves.Bulldoze],
        22: [Moves.RazorWind],
        24: [Moves.VoltSwitch],
        25: [Moves.ParabolicCharge],
        31: [Moves.ThunderWave],
        36: [Moves.Thunderbolt],
        40: [Moves.Electrify],
        44: [Moves.Thunder],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Agility,
        Moves.Camouflage,
        Moves.DragonRush,
        Moves.DragonTail,
        Moves.ElectricTerrain,
        Moves.Glare,
      ],
    },
  });
  registerSpecies(Species.Heliolisk, {
    dexNumber: 695,
    name: 'Heliolisk',
    category: 'Generator Pokemon',
    height: 1.0,
    weight: 21.0,
    family: Families.Helioptile,
    evolvesFrom: Species.Helioptile,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 55,
      [Stats.Defense]: 52,
      [Stats.SpecialAttack]: 109,
      [Stats.SpecialDefense]: 94,
      [Stats.Speed]: 109,
    },
    types: [Types.Electric, Types.Normal],
    abilities: [Abilities.DrySkin, Abilities.SandVeil],
    // Overcoat is this line's invented filler: the mainline gives it
    // Dry Skin, Sand Veil and Solar Power and nothing else, and a hide
    // that keeps grit and powder out costs it nothing in any weather
    hiddenAbilities: [Abilities.SolarPower, Abilities.Overcoat],
    eggGroups: [EggGroups.Monster, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // The stone brings the whole set up at once, which is how the
      // mainline hands a stone evolution its moves
      level: {
        1: [
          Moves.Pound,
          Moves.TailWhip,
          Moves.MudSlap,
          Moves.ThunderShock,
          Moves.Charge,
          Moves.QuickAttack,
          Moves.Bulldoze,
          Moves.RazorWind,
          Moves.VoltSwitch,
          Moves.ParabolicCharge,
          Moves.ThunderWave,
          Moves.Thunderbolt,
          Moves.Electrify,
          Moves.Thunder,
          Moves.Discharge,
          Moves.EerieImpulse,
        ],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DragonPulse,
        Moves.EerieImpulse,
        Moves.FirePunch,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.HyperVoice,
        Moves.LowKick,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.ThunderPunch,
        Moves.WeatherBall,
        Moves.BrutalSwing,
      ],
    },
  });
}
