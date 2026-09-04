import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.Taunt,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Torment,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Surf,
  Moves.Waterfall,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerCarvanhaSpecies(): void {
  registerSpecies(Species.Carvanha, {
    dexNumber: 318,
    evolvesInto: [
      {
        species: Species.Sharpedo,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Carvanha',
    category: 'Savage Pokemon',
    height: 0.8,
    weight: 20.8,
    family: Families.Carvanha,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 90,
      [Stats.Defense]: 20,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 65,
    },
    types: [Types.Water, Types.Dark],
    abilities: [Abilities.RoughSkin],
    hiddenAbilities: [Abilities.SpeedBoost],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Ocean, Biome.CoralReef],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Bite],
        7: [Moves.Rage],
        13: [Moves.FocusEnergy],
        16: [Moves.ScaryFace],
        22: [Moves.Crunch],
        28: [Moves.Screech],
        31: [Moves.TakeDown],
        37: [Moves.Swagger],
        43: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.HydroPump, Moves.Thrash],
    },
  });

  registerSpecies(Species.Sharpedo, {
    dexNumber: 319,
    name: 'Sharpedo',
    category: 'Brutal Pokemon',
    height: 1.8,
    weight: 88.8,
    family: Families.Carvanha,
    evolvesFrom: Species.Carvanha,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 120,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 95,
    },
    types: [Types.Water, Types.Dark],
    abilities: [Abilities.RoughSkin],
    // Two the mainline never gave it: what surfaces beside it thinks
    // better of swinging, and nothing eats while it is circling
    hiddenAbilities: [Abilities.SpeedBoost, Abilities.Intimidate, Abilities.Unnerve],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Ocean, Biome.CoralReef],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Bite, Moves.Rage, Moves.FocusEnergy],
        16: [Moves.ScaryFace],
        22: [Moves.Crunch],
        28: [Moves.Screech],
        33: [Moves.Slash],
        38: [Moves.Taunt],
        43: [Moves.Swagger],
        48: [Moves.SkullBash],
        53: [Moves.Agility],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Roar,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.RockTomb,
        Moves.Strength,
        Moves.RockSmash,
      ],
    },
  });
}
