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
  Moves.AerialAce,
  Moves.Attract,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.EchoedVoice,
  Moves.Embargo,
  Moves.Facade,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.Snarl,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Torment,
  Moves.Toxic,
  Moves.Confide,
];

/**
 * The thieves: a Purrloin takes what it wants and looks sweet about
 * it, and a Liepard is gone with it before anybody has turned round
 */
export default function registerPurrloinSpecies(): void {
  registerSpecies(Species.Purrloin, {
    dexNumber: 509,
    evolvesInto: [
      {
        species: Species.Liepard,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Purrloin',
    category: 'Devious Pokemon',
    height: 0.4,
    weight: 10.1,
    family: Families.Purrloin,
    stats: {
      [Stats.HP]: 41,
      [Stats.Attack]: 50,
      [Stats.Defense]: 37,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 37,
      [Stats.Speed]: 66,
    },
    types: [Types.Dark],
    abilities: [Abilities.Limber, Abilities.Unburden],
    hiddenAbilities: [Abilities.Prankster],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.Grassland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        3: [Moves.Growl],
        6: [Moves.Assist],
        10: [Moves.SandAttack],
        12: [Moves.FurySwipes],
        15: [Moves.Pursuit],
        19: [Moves.Torment],
        21: [Moves.FakeOut],
        24: [Moves.HoneClaws],
        28: [Moves.Assurance],
        30: [Moves.Slash],
        33: [Moves.Captivate],
        37: [Moves.NightSlash],
        39: [Moves.Snatch],
        42: [Moves.NastyPlot],
        46: [Moves.SuckerPunch],
        49: [Moves.PlayRough],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Charm,
        Moves.Covet,
        Moves.Encore,
        Moves.FakeTears,
        Moves.FeintAttack,
        Moves.FoulPlay,
        Moves.PayDay,
        Moves.Yawn,
      ],
    },
  });
  registerSpecies(Species.Liepard, {
    dexNumber: 510,
    name: 'Liepard',
    category: 'Cruel Pokemon',
    height: 1.1,
    weight: 37.5,
    family: Families.Purrloin,
    evolvesFrom: Species.Purrloin,
    stats: {
      [Stats.HP]: 64,
      [Stats.Attack]: 88,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 88,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 106,
    },
    types: [Types.Dark],
    abilities: [Abilities.Limber, Abilities.Unburden],
    hiddenAbilities: [Abilities.Prankster, Abilities.Technician],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Woodland, Biome.Grassland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.SandAttack, Moves.Growl, Moves.Assist],
        3: [Moves.Growl],
        6: [Moves.Assist],
        10: [Moves.SandAttack],
        12: [Moves.FurySwipes],
        15: [Moves.Pursuit],
        19: [Moves.Torment],
        22: [Moves.FakeOut],
        26: [Moves.HoneClaws],
        31: [Moves.Assurance],
        34: [Moves.Slash],
        38: [Moves.Taunt],
        43: [Moves.NightSlash],
        47: [Moves.Snatch],
        50: [Moves.NastyPlot],
        55: [Moves.SuckerPunch],
        58: [Moves.PlayRough],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSmash,
        Moves.LaserFocus,
        Moves.ThroatChop,
      ],
    },
  });
}
