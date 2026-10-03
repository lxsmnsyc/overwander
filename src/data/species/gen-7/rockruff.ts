import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.Confide,
  Moves.Covet,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.EchoedVoice,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.HyperVoice,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.IronTail,
  Moves.LastResort,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.SleepTalk,
  Moves.Snarl,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StompingTantrum,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Toxic,
  Moves.ZenHeadbutt,
];

// And what all three wolves carry on top of it
const WOLF_TEACHABLE = [Moves.BrickBreak, Moves.BulkUp, Moves.SwordsDance];

// What all three learn past their first moves, which is the puppy's list
const WOLF_LEVELS = {
  12: [Moves.Howl],
  15: [Moves.RockThrow],
  18: [Moves.OdorSleuth],
  23: [Moves.RockTomb],
  26: [Moves.Roar],
  29: [Moves.StealthRock],
  34: [Moves.RockSlide],
  37: [Moves.ScaryFace],
  40: [Moves.Crunch],
  45: [Moves.RockClimb],
  48: [Moves.StoneEdge],
};

const HOME = [Biome.Steppe, Biome.Grassland, Biome.Badlands];

/**
 * The puppy and the three wolves it can grow into. Which one is the
 * hour it grew up at: the day makes a Midday, the night a Midnight and
 * the evening between them a Dusk
 */
export default function registerRockruffSpecies(): void {
  registerSpecies(Species.Rockruff, {
    dexNumber: 744,
    evolvesInto: [
      {
        species: Species.Lycanroc,
        method: EvolutionMethod.Level | EvolutionMethod.TimeOfDay,
        level: 25,
        time: TimeOfDay.Morning | TimeOfDay.Day,
      },
      {
        species: Species.LycanrocMidnight,
        method: EvolutionMethod.Level | EvolutionMethod.TimeOfDay,
        level: 25,
        time: TimeOfDay.Night,
      },
      {
        species: Species.LycanrocDusk,
        method: EvolutionMethod.Level | EvolutionMethod.TimeOfDay,
        level: 25,
        time: TimeOfDay.Evening,
      },
    ],
    name: 'Rockruff',
    category: 'Puppy Pokemon',
    height: 0.5,
    weight: 9.2,
    family: Families.Rockruff,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 65,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 60,
    },
    types: [Types.Rock],
    abilities: [Abilities.KeenEye, Abilities.VitalSpirit],
    // Own Tempo is the event Rockruff's, the one that grows into a Dusk
    // in the mainline. Here the hour does that, so the tempo is only a
    // rarer birth
    hiddenAbilities: [Abilities.Steadfast, Abilities.OwnTempo],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 190,
    biomes: HOME,
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Tackle],
        4: [Moves.SandAttack],
        7: [Moves.Bite],
        ...WOLF_LEVELS,
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.CrushClaw, Moves.FireFang, Moves.SuckerPunch, Moves.Thrash, Moves.ThunderFang],
    },
  });
  registerSpecies(Species.Lycanroc, {
    dexNumber: 745,
    name: 'Lycanroc',
    category: 'Wolf Pokemon',
    height: 0.8,
    weight: 25,
    family: Families.Rockruff,
    evolvesFrom: Species.Rockruff,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 115,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 112,
    },
    types: [Types.Rock],
    abilities: [Abilities.KeenEye, Abilities.SandRush],
    hiddenAbilities: [Abilities.Steadfast],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 90,
    biomes: HOME,
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Accelerock,
          Moves.Bite,
          Moves.Leer,
          Moves.QuickAttack,
          Moves.QuickGuard,
          Moves.SandAttack,
          Moves.Tackle,
        ],
        ...WOLF_LEVELS,
      },
      teachable: [...FAMILY_TEACHABLE, ...WOLF_TEACHABLE, Moves.DrillRun],
    },
  });
  registerSpecies(Species.LycanrocMidnight, {
    dexNumber: 745,
    name: 'Midnight Lycanroc',
    category: 'Wolf Pokemon',
    height: 1.1,
    weight: 25,
    family: Families.Rockruff,
    baseForm: false,
    evolvesFrom: Species.Rockruff,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 115,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 82,
    },
    types: [Types.Rock],
    abilities: [Abilities.KeenEye, Abilities.VitalSpirit],
    hiddenAbilities: [Abilities.NoGuard],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 90,
    biomes: HOME,
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Bite,
          Moves.Counter,
          Moves.Leer,
          Moves.Reversal,
          Moves.SandAttack,
          Moves.Tackle,
          Moves.Taunt,
        ],
        ...WOLF_LEVELS,
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...WOLF_TEACHABLE,
        Moves.DualChop,
        Moves.FirePunch,
        Moves.FocusPunch,
        Moves.FoulPlay,
        Moves.LaserFocus,
        Moves.Outrage,
        Moves.ThroatChop,
        Moves.ThunderPunch,
        Moves.Uproar,
      ],
    },
  });
  registerSpecies(Species.LycanrocDusk, {
    dexNumber: 745,
    name: 'Dusk Lycanroc',
    category: 'Wolf Pokemon',
    height: 0.8,
    weight: 25,
    family: Families.Rockruff,
    baseForm: false,
    evolvesFrom: Species.Rockruff,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 117,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 110,
    },
    types: [Types.Rock],
    abilities: [Abilities.ToughClaws],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 90,
    biomes: HOME,
    activeTimes: TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [
          Moves.Accelerock,
          Moves.Bite,
          Moves.Counter,
          Moves.Leer,
          Moves.SandAttack,
          Moves.Tackle,
          Moves.Thrash,
        ],
        ...WOLF_LEVELS,
      },
      teachable: [...FAMILY_TEACHABLE, ...WOLF_TEACHABLE, Moves.DrillRun, Moves.Outrage],
    },
  });
}
