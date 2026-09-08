import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Protect,
  Moves.RainDance,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SteelWing,
  Moves.Fly,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerSwabluSpecies(): void {
  registerSpecies(Species.Swablu, {
    dexNumber: 333,
    evolvesInto: [
      {
        species: Species.Altaria,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Swablu',
    category: 'Cotton Bird Pokemon',
    height: 0.4,
    weight: 1.2,
    family: Families.Swablu,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 40,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 50,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.NaturalCure],
    hiddenAbilities: [Abilities.CloudNine],
    eggGroups: [EggGroups.Flying, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Peck],
        8: [Moves.Astonish],
        11: [Moves.Sing],
        18: [Moves.FuryAttack],
        21: [Moves.Safeguard],
        28: [Moves.Mist],
        31: [Moves.TakeDown],
        38: [Moves.MirrorMove],
        41: [Moves.Refresh],
        48: [Moves.PerishSong],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Agility, Moves.Haze, Moves.Pursuit, Moves.Rage],
    },
  });

  registerSpecies(Species.Altaria, {
    dexNumber: 334,
    name: 'Altaria',
    category: 'Humming Pokemon',
    height: 1.1,
    weight: 20.6,
    family: Families.Swablu,
    evolvesFrom: Species.Swablu,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 70,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 80,
    },
    types: [Types.Dragon, Types.Flying],
    abilities: [Abilities.NaturalCure],
    // Two the mainline never gave it: what it sings for an ally, and
    // a cloud's own way of getting somewhere first
    hiddenAbilities: [Abilities.CloudNine, Abilities.GaleWings, Abilities.Healer],
    eggGroups: [EggGroups.Flying, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Peck, Moves.Astonish, Moves.Sing],
        18: [Moves.FuryAttack],
        21: [Moves.Safeguard],
        28: [Moves.Mist],
        31: [Moves.TakeDown],
        35: [Moves.DragonBreath],
        40: [Moves.DragonDance],
        45: [Moves.Refresh],
        54: [Moves.PerishSong],
        59: [Moves.SkyAttack],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DragonClaw,
        Moves.Roar,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.Earthquake,
        Moves.Flamethrower,
        Moves.FireBlast,
        Moves.RockSmash,
      ],
    },
  });
}
