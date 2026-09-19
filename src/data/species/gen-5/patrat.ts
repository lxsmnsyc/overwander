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
  Moves.Attract,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.Fling,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Round,
  Moves.ShadowBall,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.WorkUp,
];

/**
 * The scouts of the open country: a Patrat posts itself where it can
 * see, and a Watchog lights its stripes at whatever it catches coming
 */
export default function registerPatratSpecies(): void {
  registerSpecies(Species.Patrat, {
    dexNumber: 504,
    evolvesInto: [
      {
        species: Species.Watchog,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Patrat',
    category: 'Scout Pokemon',
    height: 0.5,
    weight: 11.6,
    family: Families.Patrat,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 55,
      [Stats.Defense]: 39,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 39,
      [Stats.Speed]: 42,
    },
    types: [Types.Normal],
    abilities: [Abilities.RunAway, Abilities.KeenEye],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        3: [Moves.Leer],
        6: [Moves.Bite],
        8: [Moves.Bide],
        11: [Moves.Detect],
        13: [Moves.SandAttack],
        16: [Moves.Crunch],
        18: [Moves.Hypnosis],
        21: [Moves.SuperFang],
        23: [Moves.AfterYou],
        26: [Moves.WorkUp],
        28: [Moves.HyperFang],
        31: [Moves.MeanLook],
        33: [Moves.BatonPass],
        36: [Moves.Slam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Assurance,
        Moves.Flail,
        Moves.Foresight,
        Moves.IronTail,
        Moves.Pursuit,
        Moves.Revenge,
        Moves.Screech,
      ],
    },
  });
  registerSpecies(Species.Watchog, {
    dexNumber: 505,
    name: 'Watchog',
    category: 'Lookout Pokemon',
    height: 1.1,
    weight: 27,
    family: Families.Patrat,
    evolvesFrom: Species.Patrat,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 69,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 69,
      [Stats.Speed]: 77,
    },
    types: [Types.Normal],
    abilities: [Abilities.Illuminate, Abilities.KeenEye],
    hiddenAbilities: [Abilities.Analytic, Abilities.RunAway],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Leer, Moves.Bite, Moves.LowKick],
        3: [Moves.Leer],
        6: [Moves.Bite],
        8: [Moves.Bide],
        11: [Moves.Detect],
        13: [Moves.SandAttack],
        16: [Moves.Crunch],
        18: [Moves.Hypnosis],
        20: [Moves.ConfuseRay],
        22: [Moves.SuperFang],
        25: [Moves.AfterYou],
        29: [Moves.PsychUp],
        32: [Moves.HyperFang],
        36: [Moves.MeanLook],
        39: [Moves.BatonPass],
        43: [Moves.Slam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DreamEater,
        Moves.Flamethrower,
        Moves.Flash,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.PsychUp,
        Moves.RockSmash,
        Moves.Strength,
        Moves.Thunder,
        Moves.ThunderWave,
      ],
    },
  });
}
