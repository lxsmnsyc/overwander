import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.SolarBeam,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Cut,
  Moves.Headbutt,
  Moves.Flash,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.SweetScent,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
];

// What the two above the base pick up: the machines that ask for a
// grown pokemon to swing them
const GROWN_TEACHABLE = [Moves.Strength, Moves.FuryCutter, Moves.RockSmash];

export default function registerChikoritaSpecies(): void {
  registerSpecies(Species.Chikorita, {
    dexNumber: 152,
    evolvesInto: [
      {
        species: Species.Bayleef,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Chikorita',
    category: 'Leaf Pokemon',
    height: 0.9,
    weight: 6.4,
    family: Families.Chikorita,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 49,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 49,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 45,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.LeafGuard],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        8: [Moves.RazorLeaf],
        12: [Moves.Reflect],
        15: [Moves.PoisonPowder],
        22: [Moves.Synthesis],
        29: [Moves.BodySlam],
        36: [Moves.LightScreen],
        43: [Moves.Safeguard],
        50: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.VineWhip, Moves.Counter, Moves.LeechSeed, Moves.Flail, Moves.AncientPower],
    },
  });

  registerSpecies(Species.Bayleef, {
    dexNumber: 153,
    evolvesInto: [
      {
        species: Species.Meganium,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Bayleef',
    category: 'Leaf Pokemon',
    height: 1.2,
    weight: 15.8,
    family: Families.Chikorita,
    evolvesFrom: Species.Chikorita,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 62,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 63,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    hiddenAbilities: [Abilities.LeafGuard],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.RazorLeaf, Moves.Reflect],
        15: [Moves.PoisonPowder],
        23: [Moves.Synthesis],
        31: [Moves.BodySlam],
        39: [Moves.LightScreen],
        47: [Moves.Safeguard],
        55: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Meganium, {
    dexNumber: 154,
    name: 'Meganium',
    category: 'Herb Pokemon',
    height: 1.8,
    weight: 100.5,
    family: Families.Chikorita,
    evolvesFrom: Species.Bayleef,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 82,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 83,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass],
    abilities: [Abilities.Overgrow],
    // Natural Cure and Healer are this registry's rather than the
    // mainline's: a line whose own moves are Aromatherapy and
    // Safeguard reads as the one that mends, and a final evolution is
    // filled to four
    hiddenAbilities: [Abilities.LeafGuard, Abilities.NaturalCure, Abilities.Healer],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.RazorLeaf, Moves.Reflect],
        15: [Moves.PoisonPowder],
        23: [Moves.Synthesis],
        31: [Moves.BodySlam],
        41: [Moves.LightScreen],
        51: [Moves.Safeguard],
        61: [Moves.SolarBeam],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE, Moves.HyperBeam, Moves.Earthquake],
    },
  });
}
