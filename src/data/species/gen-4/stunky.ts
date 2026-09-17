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
  Moves.Captivate,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Defog,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Explosion,
  Moves.Facade,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.Frustration,
  Moves.FuryCutter,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockSmash,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snatch,
  Moves.Snore,
  Moves.Substitute,
  Moves.SuckerPunch,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
];

/**
 * The smell that clears a route: Stunky sprays from behind and walks
 * off, and a Skuntank can put the same cloud out a long way
 */
export default function registerStunkySpecies(): void {
  registerSpecies(Species.Stunky, {
    dexNumber: 434,
    evolvesInto: [
      {
        species: Species.Skuntank,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Stunky',
    category: 'Skunk Pokemon',
    height: 0.4,
    weight: 19.2,
    family: Families.Stunky,
    stats: {
      [Stats.HP]: 63,
      [Stats.Attack]: 63,
      [Stats.Defense]: 47,
      [Stats.SpecialAttack]: 41,
      [Stats.SpecialDefense]: 41,
      [Stats.Speed]: 74,
    },
    types: [Types.Poison, Types.Dark],
    abilities: [Abilities.Stench, Abilities.Aftermath],
    hiddenAbilities: [Abilities.KeenEye],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [Biome.Shrubland, Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.FocusEnergy, Moves.Scratch],
        4: [Moves.PoisonGas],
        7: [Moves.Screech],
        10: [Moves.FurySwipes],
        14: [Moves.SmokeScreen],
        18: [Moves.Feint],
        22: [Moves.Slash],
        27: [Moves.Toxic],
        32: [Moves.NightSlash],
        38: [Moves.Memento],
        44: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Astonish,
        Moves.Crunch,
        Moves.DoubleEdge,
        Moves.Leer,
        Moves.Punishment,
        Moves.Pursuit,
        Moves.ScaryFace,
        Moves.Smog,
      ],
    },
  });
  registerSpecies(Species.Skuntank, {
    dexNumber: 435,
    name: 'Skuntank',
    category: 'Skunk Pokemon',
    height: 1.0,
    weight: 38.0,
    family: Families.Stunky,
    evolvesFrom: Species.Stunky,
    stats: {
      [Stats.HP]: 103,
      [Stats.Attack]: 93,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 71,
      [Stats.SpecialDefense]: 61,
      [Stats.Speed]: 84,
    },
    types: [Types.Poison, Types.Dark],
    abilities: [Abilities.Stench, Abilities.Aftermath],
    // Poison Touch is this registry's rather than the mainline's:
    // the line fights close in, and nothing else it has puts poison on
    hiddenAbilities: [Abilities.KeenEye, Abilities.PoisonTouch],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Shrubland, Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.FocusEnergy, Moves.PoisonGas, Moves.Scratch],
        4: [Moves.PoisonGas],
        7: [Moves.Screech],
        10: [Moves.FurySwipes],
        14: [Moves.SmokeScreen],
        18: [Moves.Feint],
        22: [Moves.Slash],
        27: [Moves.Toxic],
        32: [Moves.NightSlash],
        34: [Moves.Flamethrower],
        42: [Moves.Memento],
        52: [Moves.Explosion],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.PoisonJab,
        Moves.Strength,
      ],
    },
  });
}
