import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Rest,
  Moves.Substitute,
  Moves.Cut,
  Moves.Surf,
  Moves.Strength,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.RockSmash,
  Moves.Whirlpool,
  Moves.Dive,
  Moves.Facade,
  Moves.RockTomb,
  Moves.SecretPower,
  Moves.WaterPulse,
];

const FAMILY_ABILITIES = [Abilities.HyperCutter, Abilities.ShellArmor];

export default function registerKrabbySpecies(): void {
  registerSpecies(Species.Krabby, {
    dexNumber: 98,
    evolvesInto: [
      {
        species: Species.Kingler,
        method: EvolutionMethod.Level,
        level: 28,
      },
    ],
    name: 'Krabby',
    category: 'River Crab Pokemon',
    height: 0.4,
    weight: 6.5,
    family: Families.Krabby,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 105,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 50,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Beach, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Leer],
        12: [Moves.ViceGrip],
        16: [Moves.Harden],
        23: [Moves.Stomp, Moves.MudShot],
        25: [Moves.Guillotine],
        34: [Moves.Protect],
        35: [Moves.Crabhammer],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Dig, Moves.Haze, Moves.Amnesia, Moves.Slam, Moves.Flail, Moves.KnockOff],
    },
  });

  registerSpecies(Species.Kingler, {
    dexNumber: 99,
    name: 'Kingler',
    category: 'Pincer Pokemon',
    height: 1.3,
    weight: 60,
    family: Families.Krabby,
    evolvesFrom: Species.Krabby,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 130,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 75,
    },
    types: [Types.Water],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SheerForce, Abilities.ToughClaws],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Beach, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Leer, Moves.ViceGrip, Moves.MetalClaw],
        16: [Moves.Harden],
        23: [Moves.Stomp, Moves.MudShot],
        25: [Moves.Guillotine],
        38: [Moves.Protect],
        42: [Moves.Crabhammer],
        65: [Moves.Flail],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Dig],
    },
  });
}
