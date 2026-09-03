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

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Psychic,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Surf,
  Moves.Headbutt,
  Moves.DefenseCurl,
  Moves.Waterfall,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.Dig,
  Moves.Dive,
  Moves.Facade,
  Moves.SecretPower,
  Moves.WaterPulse,
];

// The evolved forms grow arms: fighting-style TMs and HM Strength
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Metronome,
  Moves.Strength,
  Moves.IcePunch,
  Moves.Earthquake,
  Moves.MudSlap,
  Moves.Detect,
  Moves.RockSmash,
];

export default function registerPoliwagSpecies(): void {
  registerSpecies(Species.Poliwag, {
    dexNumber: 60,
    evolvesInto: [
      {
        species: Species.Poliwhirl,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Poliwag',
    category: 'Tadpole Pokemon',
    height: 0.6,
    weight: 12.4,
    family: Families.Poliwag,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 50,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 90,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbilities: [Abilities.SwiftSwim],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        7: [Moves.Hypnosis],
        13: [Moves.WaterGun],
        19: [Moves.DoubleSlap],
        25: [Moves.RainDance],
        31: [Moves.BodySlam],
        37: [Moves.BellyDrum],
        38: [Moves.Amnesia],
        43: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Mist,
        Moves.Splash,
        Moves.BubbleBeam,
        Moves.Haze,
        Moves.MindReader,
        Moves.IceBall,
        Moves.WaterSport,
      ],
    },
  });

  registerSpecies(Species.Poliwhirl, {
    dexNumber: 61,
    evolvesInto: [
      {
        species: Species.Poliwrath,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
      {
        species: Species.Politoed,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.KingsRock,
      },
    ],
    name: 'Poliwhirl',
    category: 'Tadpole Pokemon',
    height: 1,
    weight: 20,
    family: Families.Poliwag,
    evolvesFrom: Species.Poliwag,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 90,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbilities: [Abilities.SwiftSwim],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Hypnosis, Moves.WaterGun],
        19: [Moves.DoubleSlap],
        27: [Moves.RainDance],
        33: [Moves.BodySlam],
        41: [Moves.Amnesia],
        43: [Moves.BellyDrum],
        49: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...EVOLVED_TEACHABLE, Moves.BrickBreak, Moves.FocusPunch],
    },
  });

  registerSpecies(Species.Poliwrath, {
    dexNumber: 62,
    name: 'Poliwrath',
    category: 'Tadpole Pokemon',
    height: 1.3,
    weight: 54,
    family: Families.Poliwag,
    evolvesFrom: Species.Poliwhirl,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 95,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Fighting],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbilities: [Abilities.SwiftSwim, Abilities.Guts],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Hypnosis, Moves.WaterGun, Moves.DoubleSlap, Moves.BodySlam, Moves.Submission],
        51: [Moves.MindReader],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...EVOLVED_TEACHABLE,
        Moves.HyperBeam,
        Moves.DynamicPunch,
        Moves.BrickBreak,
        Moves.BulkUp,
        Moves.FocusPunch,
        Moves.RockTomb,
      ],
    },
  });
}
