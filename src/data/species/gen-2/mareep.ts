import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.ZapCannon,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.IronTail,
  Moves.Swift,
];

// What the two evolved stages pick up once they stand on two legs
const EVOLVED_TEACHABLE = [
  Moves.DynamicPunch,
  Moves.FirePunch,
  Moves.ThunderPunch,
  Moves.RockSmash,
  Moves.Strength,
];

export default function registerMareepSpecies(): void {
  registerSpecies(Species.Mareep, {
    dexNumber: 179,
    evolvesInto: [
      {
        species: Species.Flaaffy,
        method: EvolutionMethod.Level,
        level: 15,
      },
    ],
    name: 'Mareep',
    category: 'Wool Pokemon',
    height: 0.6,
    weight: 7.8,
    family: Families.Mareep,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 40,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.Plus],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 235,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        9: [Moves.ThunderShock],
        16: [Moves.ThunderWave],
        23: [Moves.CottonSpore],
        30: [Moves.LightScreen],
        37: [Moves.Thunder],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.BodySlam, Moves.Reflect, Moves.Safeguard, Moves.Screech, Moves.TakeDown],
    },
  });

  registerSpecies(Species.Flaaffy, {
    dexNumber: 180,
    evolvesInto: [
      {
        species: Species.Ampharos,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Flaaffy',
    category: 'Wool Pokemon',
    height: 0.8,
    weight: 13.3,
    family: Families.Mareep,
    evolvesFrom: Species.Mareep,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 55,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 45,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.Plus],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.ThunderShock],
        18: [Moves.ThunderWave],
        27: [Moves.CottonSpore],
        36: [Moves.LightScreen],
        45: [Moves.Thunder],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE],
    },
  });

  registerSpecies(Species.Ampharos, {
    dexNumber: 181,
    name: 'Ampharos',
    category: 'Light Pokemon',
    height: 1.4,
    weight: 61.5,
    family: Families.Mareep,
    evolvesFrom: Species.Flaaffy,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 55,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    // Illuminate and Motor Drive are this registry's rather than the
    // mainline's, filling a final evolution to four: it is the
    // lighthouse its ships steer by, and the current it stands in
    // drives it rather than hurting it
    hiddenAbilities: [Abilities.Plus, Abilities.Illuminate, Abilities.MotorDrive],
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.ThunderShock, Moves.ThunderWave],
        27: [Moves.CottonSpore],
        30: [Moves.ThunderPunch],
        42: [Moves.LightScreen],
        57: [Moves.Thunder],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE, Moves.HyperBeam],
    },
  });
}
