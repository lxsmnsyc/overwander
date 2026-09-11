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

// TM, HM and tutor moves the whole line shares
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Waterfall,
  Moves.Dive,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
];

// What both halves of the shell pick up once they are out of it
const OPENED_TEACHABLE = [Moves.HyperBeam, Moves.MudSlap, Moves.Swift];

export default function registerClamperlSpecies(): void {
  registerSpecies(Species.Clamperl, {
    dexNumber: 366,
    // The shell opens one of two ways, and what it was holding
    // decides which. Neither branch is a level, so a Clamperl left
    // alone stays one
    evolvesInto: [
      {
        species: Species.Huntail,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.DeepSeaTooth,
      },
      {
        species: Species.Gorebyss,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.DeepSeaScale,
      },
    ],
    name: 'Clamperl',
    category: 'Bivalve Pokemon',
    height: 0.4,
    weight: 52.5,
    family: Families.Clamperl,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 64,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 74,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 32,
    },
    types: [Types.Water],
    abilities: [Abilities.ShellArmor],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.CoralReef, Biome.Ocean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Clamp, Moves.Whirlpool, Moves.IronDefense],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Barrier, Moves.ConfuseRay, Moves.MudSport, Moves.Refresh, Moves.Supersonic],
    },
  });

  registerSpecies(Species.Huntail, {
    dexNumber: 367,
    name: 'Huntail',
    category: 'Deep Sea Pokemon',
    height: 1.7,
    weight: 27,
    family: Families.Clamperl,
    evolvesFrom: Species.Clamperl,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 104,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 94,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 52,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.WaterVeil],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Whirlpool],
        8: [Moves.Bite],
        15: [Moves.Screech],
        22: [Moves.WaterPulse],
        29: [Moves.ScaryFace],
        36: [Moves.Crunch],
        43: [Moves.BatonPass],
        50: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...OPENED_TEACHABLE, Moves.RockTomb, Moves.Snatch],
    },
  });

  registerSpecies(Species.Gorebyss, {
    dexNumber: 368,
    name: 'Gorebyss',
    category: 'South Sea Pokemon',
    height: 1.8,
    weight: 22.6,
    family: Families.Clamperl,
    evolvesFrom: Species.Clamperl,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 84,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 114,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 52,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.Hydration],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Whirlpool],
        8: [Moves.Confusion],
        15: [Moves.Agility],
        22: [Moves.WaterPulse],
        29: [Moves.Amnesia],
        36: [Moves.Psychic],
        43: [Moves.BatonPass],
        50: [Moves.HydroPump],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...OPENED_TEACHABLE,
        Moves.Safeguard,
        Moves.Psychic,
        Moves.ShadowBall,
      ],
    },
  });
}
