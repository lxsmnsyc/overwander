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
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.IronTail,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Flash,
  Moves.Strength,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerElectrikeSpecies(): void {
  registerSpecies(Species.Electrike, {
    dexNumber: 309,
    evolvesInto: [
      {
        species: Species.Manectric,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Electrike',
    category: 'Lightning Pokemon',
    height: 0.6,
    weight: 15.2,
    family: Families.Electrike,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 45,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 65,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static, Abilities.LightningRod],
    hiddenAbilities: [Abilities.Minus],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        4: [Moves.ThunderWave],
        9: [Moves.Leer],
        12: [Moves.Howl],
        17: [Moves.QuickAttack],
        20: [Moves.Spark],
        25: [Moves.OdorSleuth],
        28: [Moves.Roar],
        33: [Moves.Bite],
        36: [Moves.Thunder],
        41: [Moves.Charge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Headbutt, Moves.Crunch, Moves.Uproar, Moves.Curse],
    },
  });

  registerSpecies(Species.Manectric, {
    dexNumber: 310,
    name: 'Manectric',
    category: 'Discharge Pokemon',
    height: 1.5,
    weight: 40.2,
    family: Families.Electrike,
    evolvesFrom: Species.Electrike,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 75,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 105,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static, Abilities.LightningRod],
    // Quick Feet is this registry's rather than the mainline's: it is
    // built on 105 Speed, and a final evolution is filled to four
    hiddenAbilities: [Abilities.Minus, Abilities.QuickFeet],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.ThunderWave, Moves.Leer, Moves.Howl],
        17: [Moves.QuickAttack],
        20: [Moves.Spark],
        25: [Moves.OdorSleuth],
        31: [Moves.Roar],
        39: [Moves.Bite],
        45: [Moves.Thunder],
        53: [Moves.Charge],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
