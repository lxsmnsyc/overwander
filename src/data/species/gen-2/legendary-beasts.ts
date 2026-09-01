import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by all three beasts
const BEAST_TEACHABLE = [
  Moves.Toxic,
  Moves.Cut,
  Moves.Strength,
  Moves.Dig,
  Moves.Flash,
  Moves.HyperBeam,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
  Moves.Sandstorm,
  Moves.PsychUp,
  Moves.MudSlap,
  Moves.Headbutt,
  Moves.RockSmash,
  Moves.Roar,
  Moves.Swift,
];

export default function registerLegendaryBeastSpecies(): void {
  registerSpecies(Species.Raikou, {
    dexNumber: 243,
    name: 'Raikou',
    category: 'Thunder Pokemon',
    height: 1.9,
    weight: 178,
    family: Families.Raikou,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 85,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 115,
    },
    types: [Types.Electric],
    abilities: [Abilities.Pressure],
    // Motor Drive and Volt Absorb are this registry's rather than the
    // mainline's: the storm it is made of runs it rather than hurts it
    hiddenAbilities: [Abilities.InnerFocus, Abilities.MotorDrive, Abilities.VoltAbsorb],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer],
        11: [Moves.ThunderShock],
        21: [Moves.Roar],
        31: [Moves.QuickAttack],
        41: [Moves.Spark],
        51: [Moves.Reflect],
        61: [Moves.Crunch],
        71: [Moves.Thunder],
      },
      teachable: [...BEAST_TEACHABLE, Moves.Thunder, Moves.ZapCannon],
    },
  });

  registerSpecies(Species.Entei, {
    dexNumber: 244,
    name: 'Entei',
    category: 'Volcano Pokemon',
    height: 2.1,
    weight: 198,
    family: Families.Entei,
    stats: {
      [Stats.HP]: 115,
      [Stats.Attack]: 115,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 100,
    },
    types: [Types.Fire],
    abilities: [Abilities.Pressure],
    // Magma Armor and Intimidate are this registry's rather than the
    // mainline's: a volcano for a body, and a roar that sets one off
    hiddenAbilities: [Abilities.InnerFocus, Abilities.MagmaArmor, Abilities.Intimidate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Volcano, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer],
        11: [Moves.Ember],
        21: [Moves.Roar],
        31: [Moves.FireSpin],
        41: [Moves.Stomp],
        51: [Moves.Flamethrower],
        61: [Moves.Swagger],
        71: [Moves.FireBlast],
      },
      teachable: [...BEAST_TEACHABLE, Moves.FireBlast, Moves.SolarBeam],
    },
  });

  registerSpecies(Species.Suicune, {
    dexNumber: 245,
    name: 'Suicune',
    category: 'Aurora Pokemon',
    height: 2,
    weight: 187,
    family: Families.Suicune,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 75,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 115,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [Abilities.Pressure],
    // Water Absorb and Storm Drain are this registry's rather than the
    // mainline's: the north wind runs on the water it goes to purify
    hiddenAbilities: [Abilities.InnerFocus, Abilities.WaterAbsorb, Abilities.StormDrain],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer],
        11: [Moves.WaterGun],
        21: [Moves.RainDance, Moves.Roar],
        31: [Moves.Gust],
        41: [Moves.AuroraBeam, Moves.BubbleBeam],
        51: [Moves.Mist],
        61: [Moves.MirrorCoat],
        71: [Moves.HydroPump],
      },
      teachable: [
        ...BEAST_TEACHABLE,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Whirlpool,
        Moves.IcyWind,
        Moves.Blizzard,
      ],
    },
  });
}
