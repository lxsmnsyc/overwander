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
  Moves.Attract,
  Moves.Bounce,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.FlameCharge,
  Moves.Flash,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.VoltSwitch,
  Moves.WildCharge,
  Moves.Confide,
];

/**
 * The bolts: a Blitzle's mane flashes before it moves, and a
 * Zebstrika is thunder with hooves
 */
export default function registerBlitzleSpecies(): void {
  registerSpecies(Species.Blitzle, {
    dexNumber: 522,
    evolvesInto: [
      {
        species: Species.Zebstrika,
        method: EvolutionMethod.Level,
        level: 27,
      },
    ],
    name: 'Blitzle',
    category: 'Electrified Pokemon',
    height: 0.8,
    weight: 29.8,
    family: Families.Blitzle,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 60,
      [Stats.Defense]: 32,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 32,
      [Stats.Speed]: 76,
    },
    types: [Types.Electric],
    abilities: [Abilities.LightningRod, Abilities.MotorDrive],
    hiddenAbilities: [Abilities.SapSipper],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.QuickAttack],
        4: [Moves.TailWhip],
        8: [Moves.Charge],
        11: [Moves.ShockWave],
        15: [Moves.ThunderWave],
        18: [Moves.FlameCharge],
        22: [Moves.Pursuit],
        25: [Moves.Spark],
        29: [Moves.Stomp],
        32: [Moves.Discharge],
        36: [Moves.Agility],
        39: [Moves.WildCharge],
        43: [Moves.Thrash],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.DoubleEdge,
        Moves.DoubleKick,
        Moves.Endure,
        Moves.MeFirst,
        Moves.Rage,
        Moves.SandAttack,
        Moves.Screech,
        Moves.TakeDown,
      ],
    },
  });
  registerSpecies(Species.Zebstrika, {
    dexNumber: 523,
    name: 'Zebstrika',
    category: 'Thunderbolt Pokemon',
    height: 1.6,
    weight: 79.5,
    family: Families.Blitzle,
    evolvesFrom: Species.Blitzle,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 100,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 116,
    },
    types: [Types.Electric],
    abilities: [Abilities.LightningRod, Abilities.MotorDrive],
    // Reckless is the invented fourth: the line reaches three, and it
    // throws itself at things with Wild Charge and Take Down
    hiddenAbilities: [Abilities.SapSipper, Abilities.Reckless],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Charge, Moves.QuickAttack, Moves.TailWhip, Moves.ThunderWave],
        11: [Moves.ShockWave],
        18: [Moves.FlameCharge],
        22: [Moves.Pursuit],
        25: [Moves.Spark],
        31: [Moves.Stomp],
        36: [Moves.Discharge],
        42: [Moves.Agility],
        47: [Moves.WildCharge],
        53: [Moves.Thrash],
        58: [Moves.IonDeluge],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Overheat,
        Moves.RockSmash,
        Moves.LaserFocus,
      ],
    },
  });
}
