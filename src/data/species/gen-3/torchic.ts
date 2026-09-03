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
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.Frustration,
  Moves.Return,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Flamethrower,
  Moves.FireBlast,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Overheat,
  Moves.Cut,
  Moves.Strength,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.SwordsDance,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

// What the two above the base pick up: the machines and tutors that
// ask for arms to swing them
const GROWN_TEACHABLE = [
  Moves.FocusPunch,
  Moves.BulkUp,
  Moves.BrickBreak,
  Moves.DynamicPunch,
  Moves.FuryCutter,
  Moves.ThunderPunch,
  Moves.FirePunch,
];

export default function registerTorchicSpecies(): void {
  registerSpecies(Species.Torchic, {
    dexNumber: 255,
    evolvesInto: [
      {
        species: Species.Combusken,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Torchic',
    category: 'Chick Pokemon',
    height: 0.4,
    weight: 2.5,
    family: Families.Torchic,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 60,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 45,
    },
    types: [Types.Fire],
    abilities: [Abilities.Blaze],
    hiddenAbilities: [Abilities.SpeedBoost],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl],
        7: [Moves.FocusEnergy],
        10: [Moves.Ember],
        16: [Moves.Peck],
        19: [Moves.SandAttack],
        25: [Moves.FireSpin],
        28: [Moves.QuickAttack],
        34: [Moves.Slash],
        37: [Moves.MirrorMove],
        43: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Counter,
        Moves.Reversal,
        Moves.Endure,
        Moves.RockSlide,
        Moves.Swagger,
        Moves.SmellingSalts,
      ],
    },
  });

  registerSpecies(Species.Combusken, {
    dexNumber: 256,
    evolvesInto: [
      {
        species: Species.Blaziken,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Combusken',
    category: 'Young Fowl Pokemon',
    height: 0.9,
    weight: 19.5,
    family: Families.Torchic,
    evolvesFrom: Species.Torchic,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 55,
    },
    types: [Types.Fire, Types.Fighting],
    abilities: [Abilities.Blaze],
    hiddenAbilities: [Abilities.SpeedBoost],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.FocusEnergy, Moves.Ember],
        16: [Moves.DoubleKick],
        17: [Moves.Peck],
        21: [Moves.SandAttack],
        28: [Moves.BulkUp],
        32: [Moves.QuickAttack],
        39: [Moves.Slash],
        43: [Moves.MirrorMove],
        50: [Moves.SkyUppercut],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Blaziken, {
    dexNumber: 257,
    name: 'Blaziken',
    category: 'Blaze Pokemon',
    height: 1.9,
    weight: 52,
    family: Families.Torchic,
    evolvesFrom: Species.Combusken,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 120,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 80,
    },
    types: [Types.Fire, Types.Fighting],
    abilities: [Abilities.Blaze],
    // Iron Fist and Moxie are this registry's rather than the
    // mainline's: it fights with its fists and kicks, and a final
    // evolution is filled to four
    hiddenAbilities: [Abilities.SpeedBoost, Abilities.IronFist, Abilities.Moxie],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Volcano],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.Growl, Moves.FocusEnergy, Moves.Ember, Moves.FirePunch],
        16: [Moves.DoubleKick],
        17: [Moves.Peck],
        21: [Moves.SandAttack],
        28: [Moves.BulkUp],
        32: [Moves.QuickAttack],
        36: [Moves.BlazeKick],
        42: [Moves.Slash],
        49: [Moves.MirrorMove],
        59: [Moves.SkyUppercut],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...GROWN_TEACHABLE,
        Moves.Roar,
        Moves.HyperBeam,
        Moves.Earthquake,
      ],
    },
  });
}
