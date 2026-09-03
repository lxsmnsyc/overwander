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
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.IronTail,
  Moves.Return,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Strength,
  Moves.RockSmash,
  Moves.Waterfall,
  Moves.Dive,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Rollout,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

// What the two above the base pick up: the machines and tutors that
// ask for a pokemon that stands up out of the water
const GROWN_TEACHABLE = [
  Moves.Earthquake,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.DynamicPunch,
  Moves.RockSlide,
  Moves.IcePunch,
];

export default function registerMudkipSpecies(): void {
  registerSpecies(Species.Mudkip, {
    dexNumber: 258,
    evolvesInto: [
      {
        species: Species.Marshtomp,
        method: EvolutionMethod.Level,
        level: 16,
      },
    ],
    name: 'Mudkip',
    category: 'Mud Fish Pokemon',
    height: 0.4,
    weight: 7.6,
    family: Families.Mudkip,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 70,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 40,
    },
    types: [Types.Water],
    abilities: [Abilities.Torrent],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        6: [Moves.MudSlap],
        10: [Moves.WaterGun],
        15: [Moves.Bide],
        19: [Moves.Foresight],
        24: [Moves.MudSport],
        28: [Moves.TakeDown],
        33: [Moves.Whirlpool],
        37: [Moves.Protect],
        42: [Moves.HydroPump],
        46: [Moves.Endeavor],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Refresh, Moves.Uproar, Moves.Curse, Moves.MirrorCoat, Moves.Stomp, Moves.IceBall],
    },
  });

  registerSpecies(Species.Marshtomp, {
    dexNumber: 259,
    evolvesInto: [
      {
        species: Species.Swampert,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Marshtomp',
    category: 'Mud Fish Pokemon',
    height: 0.7,
    weight: 28,
    family: Families.Mudkip,
    evolvesFrom: Species.Mudkip,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 85,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 50,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.Torrent],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.MudSlap, Moves.WaterGun],
        15: [Moves.Bide],
        16: [Moves.MudShot],
        20: [Moves.Foresight],
        25: [Moves.MudSport],
        31: [Moves.TakeDown],
        37: [Moves.MuddyWater],
        42: [Moves.Protect],
        46: [Moves.Earthquake],
        53: [Moves.Endeavor],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Swampert, {
    dexNumber: 260,
    name: 'Swampert',
    category: 'Mud Fish Pokemon',
    height: 1.5,
    weight: 81.9,
    family: Families.Mudkip,
    evolvesFrom: Species.Marshtomp,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 110,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 60,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.Torrent],
    // Rain Dish and Water Veil are this registry's rather than the
    // mainline's: it carries its own Rain Dance, and a final
    // evolution is filled to four
    hiddenAbilities: [Abilities.Damp, Abilities.RainDish, Abilities.WaterVeil],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.MudSlap, Moves.WaterGun],
        15: [Moves.Bide],
        16: [Moves.MudShot],
        20: [Moves.Foresight],
        25: [Moves.MudSport],
        31: [Moves.TakeDown],
        39: [Moves.MuddyWater],
        46: [Moves.Protect],
        52: [Moves.Earthquake],
        61: [Moves.Endeavor],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...GROWN_TEACHABLE,
        Moves.FocusPunch,
        Moves.Roar,
        Moves.BrickBreak,
        Moves.HyperBeam,
      ],
    },
  });
}
