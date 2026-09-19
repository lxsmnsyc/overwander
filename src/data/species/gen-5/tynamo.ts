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

// TM and tutor moves the two grown sizes share
const FAMILY_TEACHABLE = [
  Moves.AcidSpray,
  Moves.Acrobatics,
  Moves.Attract,
  Moves.BodySlam,
  Moves.Charge,
  Moves.ChargeBeam,
  Moves.Crunch,
  Moves.DoubleTeam,
  Moves.ElectroBall,
  Moves.Electroweb,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.HiddenPower,
  Moves.KnockOff,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Substitute,
  Moves.SuperFang,
  Moves.Swagger,
  Moves.TakeDown,
  Moves.Thunder,
  Moves.ThunderFang,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.VoltSwitch,
  Moves.WildCharge,
  Moves.Confide,
];

/**
 * The eels: a Tynamo alone is worth nothing and a shoal of them
 * discharges as one, and what they grow into hangs onto its prey with
 * a mouth that does not let go
 */
export default function registerTynamoSpecies(): void {
  registerSpecies(Species.Tynamo, {
    dexNumber: 602,
    evolvesInto: [
      {
        species: Species.Eelektrik,
        method: EvolutionMethod.Level,
        level: 39,
      },
    ],
    name: 'Tynamo',
    category: 'EleFish Pokemon',
    height: 0.2,
    weight: 0.3,
    family: Families.Tynamo,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 55,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 60,
    },
    types: [Types.Electric],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Mountain, Biome.Bog],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      // A Tynamo knows four things and never learns a fifth until it
      // is something else
      level: {
        1: [Moves.Tackle, Moves.ThunderWave, Moves.Spark, Moves.ChargeBeam],
      },
      teachable: [Moves.Charge, Moves.ChargeBeam, Moves.KnockOff, Moves.ThunderWave],
    },
  });
  registerSpecies(Species.Eelektrik, {
    dexNumber: 603,
    evolvesInto: [
      {
        species: Species.Eelektross,
        method: EvolutionMethod.UsedItem,
        item: Items.ThunderStone,
      },
    ],
    name: 'Eelektrik',
    category: 'EleFish Pokemon',
    height: 1.2,
    weight: 22,
    family: Families.Tynamo,
    evolvesFrom: Species.Tynamo,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 85,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 40,
    },
    types: [Types.Electric],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Bog],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Headbutt, Moves.ThunderWave, Moves.Spark, Moves.ChargeBeam, Moves.Crunch],
        9: [Moves.Bind],
        19: [Moves.Acid],
        29: [Moves.Discharge],
        44: [Moves.Thunderbolt],
        49: [Moves.AcidSpray],
        54: [Moves.Coil],
        59: [Moves.WildCharge],
        64: [Moves.GastroAcid],
        69: [Moves.ZapCannon],
        74: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Eelektross, {
    dexNumber: 604,
    name: 'Eelektross',
    category: 'EleFish Pokemon',
    height: 2.1,
    weight: 80.5,
    family: Families.Tynamo,
    evolvesFrom: Species.Eelektrik,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 115,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 50,
    },
    types: [Types.Electric],
    abilities: [Abilities.Levitate],
    // Volt Absorb, Strong Jaw and Water Absorb are the invented three:
    // Levitate is all the whole line reaches, which leaves the last
    // stage three short of four
    hiddenAbilities: [Abilities.VoltAbsorb, Abilities.StrongJaw, Abilities.WaterAbsorb],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.Mountain, Biome.Bog],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Headbutt,
          Moves.Thrash,
          Moves.Acid,
          Moves.ZapCannon,
          Moves.Crunch,
          Moves.CrushClaw,
          Moves.GastroAcid,
          Moves.Discharge,
          Moves.Coil,
          Moves.IonDeluge,
        ],
        5: [Moves.WildCharge],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BrickBreak,
        Moves.BulkUp,
        Moves.Bulldoze,
        Moves.CloseCombat,
        Moves.ConfuseRay,
        Moves.Cut,
        Moves.DragonClaw,
        Moves.DragonPulse,
        Moves.DragonTail,
        Moves.DrainPunch,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.FocusPunch,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HeavySlam,
        Moves.Hex,
        Moves.HoneClaws,
        Moves.HyperBeam,
        Moves.Outrage,
        Moves.Roar,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swift,
        Moves.ThunderPunch,
        Moves.ZenHeadbutt,
        Moves.PowerUpPunch,
      ],
    },
  });
}
