import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.Dig,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Flash,
  Moves.RockSmash,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Explosion,
  Moves.Substitute,
  Moves.Rollout,
  Moves.Snore,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

// What the two above the base pick up: an acorn hanging in a tree
// cannot swing a machine, and the two that walk can
const GROWN_TEACHABLE = [
  Moves.HyperBeam,
  Moves.BrickBreak,
  Moves.RockTomb,
  Moves.Torment,
  Moves.Thief,
  Moves.Cut,
  Moves.Strength,
  Moves.MegaKick,
  Moves.PsychUp,
  Moves.MudSlap,
  Moves.FuryCutter,
  Moves.Swift,
];

export default function registerSeedotSpecies(): void {
  registerSpecies(Species.Seedot, {
    dexNumber: 273,
    evolvesInto: [
      {
        species: Species.Nuzleaf,
        method: EvolutionMethod.Level,
        level: 14,
      },
    ],
    name: 'Seedot',
    category: 'Acorn Pokemon',
    height: 0.5,
    weight: 4,
    family: Families.Seedot,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 40,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 30,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.EarlyBird],
    hiddenAbilities: [Abilities.Pickpocket],
    eggGroups: [EggGroups.Field, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Bide],
        3: [Moves.Harden],
        7: [Moves.Growth],
        13: [Moves.NaturePower],
        21: [Moves.Synthesis],
        31: [Moves.SunnyDay],
        43: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.QuickAttack,
        Moves.LeechSeed,
        Moves.TakeDown,
        Moves.Amnesia,
        Moves.RazorWind,
        Moves.FalseSwipe,
      ],
    },
  });

  registerSpecies(Species.Nuzleaf, {
    dexNumber: 274,
    evolvesInto: [
      {
        species: Species.Shiftry,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
    ],
    name: 'Nuzleaf',
    category: 'Wily Pokemon',
    height: 1,
    weight: 28,
    family: Families.Seedot,
    evolvesFrom: Species.Seedot,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 70,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass, Types.Dark],
    abilities: [Abilities.Chlorophyll, Abilities.EarlyBird],
    hiddenAbilities: [Abilities.Pickpocket],
    eggGroups: [EggGroups.Field, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound],
        3: [Moves.Harden],
        7: [Moves.Growth],
        13: [Moves.NaturePower],
        19: [Moves.FakeOut],
        25: [Moves.Torment],
        31: [Moves.FeintAttack],
        37: [Moves.RazorWind],
        43: [Moves.Swagger],
        49: [Moves.Extrasensory],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Shiftry, {
    dexNumber: 275,
    name: 'Shiftry',
    category: 'Wicked Pokemon',
    height: 1.3,
    weight: 59.6,
    family: Families.Seedot,
    evolvesFrom: Species.Nuzleaf,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 100,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 80,
    },
    types: [Types.Grass, Types.Dark],
    // Early Bird is the line's rather than its own, so it reaches
    // this stage out of the hidden band
    abilities: [Abilities.Chlorophyll, Abilities.WindRider],
    hiddenAbilities: [Abilities.Pickpocket],
    eggGroups: [EggGroups.Field, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Harden, Moves.Growth, Moves.NaturePower],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE, Moves.AerialAce],
    },
  });
}
