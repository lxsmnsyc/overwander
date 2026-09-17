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
  Moves.BugBite,
  Moves.Endeavor,
  Moves.MudSlap,
  Moves.Snore,
  Moves.StringShot,
  Moves.Uproar,
];

/**
 * The cricket that keeps the evening's time: Kricketot knocks its
 * antennae together, and a Kricketune conducts what answers
 */
export default function registerKricketotSpecies(): void {
  registerSpecies(Species.Kricketot, {
    dexNumber: 401,
    evolvesInto: [
      {
        species: Species.Kricketune,
        method: EvolutionMethod.Level,
        level: 10,
      },
    ],
    name: 'Kricketot',
    category: 'Cricket Pokemon',
    height: 0.3,
    weight: 2.2,
    family: Families.Kricketot,
    stats: {
      [Stats.HP]: 37,
      [Stats.Attack]: 25,
      [Stats.Defense]: 41,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 41,
      [Stats.Speed]: 25,
    },
    types: [Types.Bug],
    abilities: [Abilities.ShedSkin],
    hiddenAbilities: [Abilities.RunAway],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Bide, Moves.Growl],
        16: [Moves.BugBite],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Kricketune, {
    dexNumber: 402,
    name: 'Kricketune',
    category: 'Cricket Pokemon',
    height: 1.0,
    weight: 25.5,
    family: Families.Kricketot,
    evolvesFrom: Species.Kricketot,
    stats: {
      [Stats.HP]: 77,
      [Stats.Attack]: 85,
      [Stats.Defense]: 51,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 51,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug],
    abilities: [Abilities.Swarm],
    hiddenAbilities: [Abilities.Technician],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Bide, Moves.Growl],
        10: [Moves.FuryCutter],
        14: [Moves.LeechLife],
        18: [Moves.Sing],
        22: [Moves.FocusEnergy],
        26: [Moves.Slash],
        30: [Moves.XScissor],
        34: [Moves.Screech],
        38: [Moves.Taunt],
        42: [Moves.NightSlash],
        46: [Moves.BugBuzz],
        50: [Moves.PerishSong],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AerialAce,
        Moves.Attract,
        Moves.BrickBreak,
        Moves.Captivate,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.FalseSwipe,
        Moves.Flash,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.KnockOff,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.SecretPower,
        Moves.SilverWind,
        Moves.SleepTalk,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Taunt,
        Moves.Toxic,
        Moves.XScissor,
      ],
    },
  });
}
