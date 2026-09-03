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
  Moves.SolarBeam,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
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
  Moves.SweetScent,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.AerialAce,
  Moves.BulletSeed,
  Moves.Facade,
  Moves.Mimic,
  Moves.SecretPower,
  Moves.Substitute,
  Moves.SwordsDance,
];

const FAMILY_ABILITIES = [Abilities.Chlorophyll, Abilities.LeafGuard];

// The powders come in at the same levels all the way up the line
const POWDERS = {
  13: [Moves.PoisonPowder],
  15: [Moves.StunSpore],
  17: [Moves.SleepPowder],
};

export default function registerHoppipSpecies(): void {
  registerSpecies(Species.Hoppip, {
    dexNumber: 187,
    evolvesInto: [
      {
        species: Species.Skiploom,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Hoppip',
    category: 'Cottonweed Pokemon',
    height: 0.4,
    weight: 0.5,
    family: Families.Hoppip,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 35,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 50,
    },
    types: [Types.Grass, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Splash, Moves.Synthesis],
        5: [Moves.TailWhip],
        10: [Moves.Tackle],
        ...POWDERS,
        20: [Moves.LeechSeed],
        25: [Moves.CottonSpore],
        30: [Moves.MegaDrain],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Amnesia,
        Moves.Confusion,
        Moves.DoubleEdge,
        Moves.Encore,
        Moves.Growl,
        Moves.PayDay,
        Moves.Reflect,

        Moves.HelpingHand,
        Moves.PsychUp,
      ],
    },
  });

  registerSpecies(Species.Skiploom, {
    dexNumber: 188,
    evolvesInto: [
      {
        species: Species.Jumpluff,
        method: EvolutionMethod.Level,
        level: 27,
      },
    ],
    name: 'Skiploom',
    category: 'Cottonweed Pokemon',
    height: 0.6,
    weight: 1,
    family: Families.Hoppip,
    evolvesFrom: Species.Hoppip,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 45,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Splash, Moves.Synthesis, Moves.TailWhip, Moves.Tackle],
        ...POWDERS,
        22: [Moves.LeechSeed],
        29: [Moves.CottonSpore],
        36: [Moves.MegaDrain],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.DoubleEdge],
    },
  });

  registerSpecies(Species.Jumpluff, {
    dexNumber: 189,
    name: 'Jumpluff',
    category: 'Cottonweed Pokemon',
    height: 0.8,
    weight: 3,
    family: Families.Hoppip,
    evolvesFrom: Species.Skiploom,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 55,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 110,
    },
    types: [Types.Grass, Types.Flying],
    abilities: [...FAMILY_ABILITIES],
    // Effect Spore is this registry's rather than the mainline's,
    // filling a final evolution to four: the three powders it already
    // learns are what it is covered in
    hiddenAbilities: [Abilities.Infiltrator, Abilities.EffectSpore],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Splash, Moves.Synthesis, Moves.TailWhip, Moves.Tackle],
        ...POWDERS,
        22: [Moves.LeechSeed],
        33: [Moves.CottonSpore],
        44: [Moves.MegaDrain],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.DoubleEdge],
    },
  });
}
