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
  Moves.Toxic,
  Moves.Psychic,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.SolarBeam,
  Moves.Detect,
  Moves.DreamEater,
  Moves.Nightmare,
  Moves.PsychUp,
  Moves.Swift,
  Moves.AerialAce,
  Moves.CalmMind,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.LightScreen,
  Moves.Mimic,
  Moves.Reflect,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SkillSwap,
  Moves.Substitute,
  Moves.ThunderWave,
];

const FAMILY_ABILITIES = [Abilities.Synchronize, Abilities.EarlyBird];

export default function registerNatuSpecies(): void {
  registerSpecies(Species.Natu, {
    dexNumber: 177,
    evolvesInto: [
      {
        species: Species.Xatu,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Natu',
    category: 'Tiny Bird Pokemon',
    height: 0.2,
    weight: 2,
    family: Families.Natu,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 50,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 70,
    },
    types: [Types.Psychic, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.MagicBounce],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Savanna, Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Peck],
        10: [Moves.NightShade],
        20: [Moves.Teleport],
        30: [Moves.FutureSight, Moves.Wish],
        40: [Moves.ConfuseRay],
        50: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.DrillPeck,
        Moves.FeintAttack,
        Moves.Haze,
        Moves.QuickAttack,
        Moves.SteelWing,
        Moves.FeatherDance,
        Moves.Refresh,
      ],
    },
  });

  registerSpecies(Species.Xatu, {
    dexNumber: 178,
    name: 'Xatu',
    category: 'Mystic Pokemon',
    height: 1.5,
    weight: 15,
    family: Families.Natu,
    evolvesFrom: Species.Natu,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 75,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 95,
    },
    types: [Types.Psychic, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    // Anticipation is this registry's rather than the mainline's,
    // filling a final evolution to four: it stands still all day
    // reading what is about to happen
    hiddenAbilities: [Abilities.MagicBounce, Abilities.Anticipation],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Savanna, Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Peck, Moves.NightShade],
        20: [Moves.Teleport],
        35: [Moves.FutureSight, Moves.Wish],
        50: [Moves.ConfuseRay],
        65: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Fly, Moves.HyperBeam, Moves.SteelWing],
    },
  });
}
