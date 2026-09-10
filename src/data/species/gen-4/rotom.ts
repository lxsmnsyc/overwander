import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The plasma that lives in other people's machines. The five
 * appliance shapes are not stages: a Catalog moves a Rotom between
 * any two of them, its own included, so the line is a wheel rather
 * than a ladder
 */

// The one learn set all six share, whatever they are plugged into
const ROTOM_TEACHABLE = [
  Moves.ChargeBeam,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.OminousWind,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.Spite,
  Moves.Substitute,
  Moves.SuckerPunch,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Thief,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.Uproar,
  Moves.WillOWisp,
];

const ROTOM_BIOMES = [Biome.Woodland, Biome.TemperateForest];

export default function registerRotomSpecies(): void {
  registerSpecies(Species.Rotom, {
    dexNumber: 479,
    evolvesInto: [
      {
        species: Species.RotomHeat,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomWash,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFrost,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFan,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomMow,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Rotom',
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 77,
      [Stats.Speed]: 91,
    },
    types: [Types.Electric, Types.Ghost],
    abilities: [Abilities.Levitate],
    // The other three are this registry's: it is the motor, it is
    // live to the touch, and it is why the fridge door sticks
    hiddenAbilities: [Abilities.MotorDrive, Abilities.Static, Abilities.MagnetPull],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.ConfuseRay, Moves.ThunderShock, Moves.ThunderWave, Moves.Trick],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
  registerSpecies(Species.RotomHeat, {
    dexNumber: 479,
    evolvesFrom: Species.Rotom,
    evolvesInto: [
      {
        species: Species.Rotom,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomWash,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFrost,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFan,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomMow,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Heat Rotom',
    baseForm: false,
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 107,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 86,
    },
    types: [Types.Electric, Types.Fire],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    // It lives where a Rotom does, but a Catalog is the only way
    // into this shape, so no pool stages one
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Astonish,
          Moves.ConfuseRay,
          Moves.Overheat,
          Moves.ThunderShock,
          Moves.ThunderWave,
          Moves.Trick,
        ],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
  registerSpecies(Species.RotomWash, {
    dexNumber: 479,
    evolvesFrom: Species.Rotom,
    evolvesInto: [
      {
        species: Species.Rotom,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomHeat,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFrost,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFan,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomMow,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Wash Rotom',
    baseForm: false,
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 107,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 86,
    },
    types: [Types.Electric, Types.Water],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    // It lives where a Rotom does, but a Catalog is the only way
    // into this shape, so no pool stages one
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Astonish,
          Moves.ConfuseRay,
          Moves.HydroPump,
          Moves.ThunderShock,
          Moves.ThunderWave,
          Moves.Trick,
        ],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
  registerSpecies(Species.RotomFrost, {
    dexNumber: 479,
    evolvesFrom: Species.Rotom,
    evolvesInto: [
      {
        species: Species.Rotom,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomHeat,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomWash,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFan,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomMow,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Frost Rotom',
    baseForm: false,
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 107,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 86,
    },
    types: [Types.Electric, Types.Ice],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    // It lives where a Rotom does, but a Catalog is the only way
    // into this shape, so no pool stages one
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Astonish,
          Moves.Blizzard,
          Moves.ConfuseRay,
          Moves.ThunderShock,
          Moves.ThunderWave,
          Moves.Trick,
        ],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
  registerSpecies(Species.RotomFan, {
    dexNumber: 479,
    evolvesFrom: Species.Rotom,
    evolvesInto: [
      {
        species: Species.Rotom,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomHeat,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomWash,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFrost,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomMow,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Fan Rotom',
    baseForm: false,
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 107,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 86,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    // It lives where a Rotom does, but a Catalog is the only way
    // into this shape, so no pool stages one
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.AirSlash,
          Moves.Astonish,
          Moves.ConfuseRay,
          Moves.ThunderShock,
          Moves.ThunderWave,
          Moves.Trick,
        ],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
  registerSpecies(Species.RotomMow, {
    dexNumber: 479,
    evolvesFrom: Species.Rotom,
    evolvesInto: [
      {
        species: Species.Rotom,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomHeat,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomWash,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFrost,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
      {
        species: Species.RotomFan,
        method: EvolutionMethod.UsedItem,
        item: Items.RotomCatalog,
      },
    ],
    name: 'Mow Rotom',
    baseForm: false,
    category: 'Plasma Pokemon',
    height: 0.3,
    weight: 0.3,
    family: Families.Rotom,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 65,
      [Stats.Defense]: 107,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 107,
      [Stats.Speed]: 86,
    },
    types: [Types.Electric, Types.Grass],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: undefined,
    catchRate: 45,
    // It lives where a Rotom does, but a Catalog is the only way
    // into this shape, so no pool stages one
    biomes: [...ROTOM_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Astonish,
          Moves.ConfuseRay,
          Moves.LeafStorm,
          Moves.ThunderShock,
          Moves.ThunderWave,
          Moves.Trick,
        ],
        8: [Moves.Uproar],
        15: [Moves.DoubleTeam],
        22: [Moves.ShockWave],
        29: [Moves.OminousWind],
        36: [Moves.Substitute],
        43: [Moves.Charge],
        50: [Moves.Discharge],
      },
      teachable: [...ROTOM_TEACHABLE],
    },
  });
}
