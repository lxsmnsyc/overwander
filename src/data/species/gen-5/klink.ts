import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Assurance,
  Moves.Bind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.Gravity,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IronDefense,
  Moves.MagicCoat,
  Moves.MagnetRise,
  Moves.PowerGem,
  Moves.Protect,
  Moves.Recycle,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSmash,
  Moves.Round,
  Moves.Sandstorm,
  Moves.Screech,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Uproar,
  Moves.VoltSwitch,
  Moves.WildCharge,
  Moves.Confide,
];

// What the gears learn however many of them are meshed
const FAMILY_LEVEL = {
  12: [Moves.ChargeBeam],
  16: [Moves.MetalSound],
  20: [Moves.Autotomize],
  24: [Moves.Discharge],
  28: [Moves.Screech],
  36: [Moves.LockOn, Moves.MirrorShot],
};

/**
 * The gears: two of them found each other in a cave and have turned
 * against each other ever since, and neither half is anything on its
 * own. None of them is male or female
 */
export default function registerKlinkSpecies(): void {
  registerSpecies(Species.Klink, {
    dexNumber: 599,
    evolvesInto: [
      {
        species: Species.Klang,
        method: EvolutionMethod.Level,
        level: 38,
      },
    ],
    name: 'Klink',
    category: 'Gear Pokemon',
    height: 0.3,
    weight: 21,
    family: Families.Klink,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 55,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 30,
    },
    types: [Types.Steel],
    abilities: [Abilities.Plus, Abilities.Minus],
    hiddenAbilities: [Abilities.ClearBody],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 130,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.ViceGrip, Moves.ThunderShock],
        4: [Moves.Bind],
        6: [Moves.Charge],
        ...FAMILY_LEVEL,
        16: [Moves.MetalSound, Moves.GearGrind],
        40: [Moves.ShiftGear],
        44: [Moves.ZapCannon],
        48: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Klang, {
    dexNumber: 600,
    evolvesInto: [
      {
        species: Species.Klinklang,
        method: EvolutionMethod.Level,
        level: 49,
      },
    ],
    name: 'Klang',
    category: 'Gear Pokemon',
    height: 0.6,
    weight: 51,
    family: Families.Klink,
    evolvesFrom: Species.Klink,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 80,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 50,
    },
    types: [Types.Steel],
    abilities: [Abilities.Plus, Abilities.Minus],
    hiddenAbilities: [Abilities.ClearBody],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 60,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.ViceGrip, Moves.Bind, Moves.ThunderShock, Moves.Charge, Moves.GearGrind],
        ...FAMILY_LEVEL,
        42: [Moves.ShiftGear],
        48: [Moves.ZapCannon],
        54: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Klinklang, {
    dexNumber: 601,
    name: 'Klinklang',
    category: 'Gear Pokemon',
    height: 0.6,
    weight: 81,
    family: Families.Klink,
    evolvesFrom: Species.Klang,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 100,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 90,
    },
    types: [Types.Steel],
    abilities: [Abilities.Plus, Abilities.Minus],
    // Motor Drive is the invented fourth: the line reaches three, and
    // what it does with the current it spins up is run on it
    hiddenAbilities: [Abilities.ClearBody, Abilities.MotorDrive],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 30,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.ViceGrip,
          Moves.Bind,
          Moves.ThunderShock,
          Moves.Charge,
          Moves.GearGrind,
          Moves.GearUp,
        ],
        ...FAMILY_LEVEL,
        42: [Moves.ShiftGear],
        48: [Moves.ZapCannon],
        54: [Moves.HyperBeam],
        76: [Moves.MagneticFlux],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
}
