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
  Moves.CalmMind,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Taunt,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.Thunderbolt,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.ShockWave,
  Moves.Torment,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SkillSwap,
  Moves.Snatch,
  Moves.Flash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerRaltsSpecies(): void {
  registerSpecies(Species.Ralts, {
    dexNumber: 280,
    evolvesInto: [
      {
        species: Species.Kirlia,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Ralts',
    category: 'Feeling Pokemon',
    height: 0.4,
    weight: 6.6,
    family: Families.Ralts,
    stats: {
      [Stats.HP]: 28,
      [Stats.Attack]: 25,
      [Stats.Defense]: 25,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 40,
    },
    types: [Types.Psychic, Types.Fairy],
    abilities: [Abilities.Synchronize, Abilities.Trace],
    hiddenAbilities: [Abilities.Telepathy],
    eggGroups: [EggGroups.HumanLike, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 235,
    biomes: [Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl],
        6: [Moves.Confusion],
        11: [Moves.DoubleTeam],
        16: [Moves.Teleport],
        21: [Moves.CalmMind],
        26: [Moves.Psychic],
        31: [Moves.Imprison],
        36: [Moves.FutureSight],
        41: [Moves.Hypnosis],
        46: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Disable, Moves.MeanLook, Moves.WillOWisp, Moves.DestinyBond, Moves.Memento],
    },
  });

  registerSpecies(Species.Kirlia, {
    dexNumber: 281,
    evolvesInto: [
      {
        species: Species.Gardevoir,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Kirlia',
    category: 'Emotion Pokemon',
    height: 0.8,
    weight: 20.2,
    family: Families.Ralts,
    evolvesFrom: Species.Ralts,
    stats: {
      [Stats.HP]: 38,
      [Stats.Attack]: 35,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 50,
    },
    types: [Types.Psychic, Types.Fairy],
    abilities: [Abilities.Synchronize, Abilities.Trace],
    hiddenAbilities: [Abilities.Telepathy],
    eggGroups: [EggGroups.HumanLike, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Confusion, Moves.DoubleTeam, Moves.Teleport],
        21: [Moves.CalmMind],
        26: [Moves.Psychic],
        33: [Moves.Imprison],
        40: [Moves.FutureSight],
        47: [Moves.Hypnosis],
        54: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Gardevoir, {
    dexNumber: 282,
    name: 'Gardevoir',
    category: 'Embrace Pokemon',
    height: 1.6,
    weight: 48.4,
    family: Families.Ralts,
    evolvesFrom: Species.Kirlia,
    stats: {
      [Stats.HP]: 68,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 115,
      [Stats.Speed]: 80,
    },
    types: [Types.Psychic, Types.Fairy],
    abilities: [Abilities.Synchronize, Abilities.Trace],
    // Healer is this registry's rather than the mainline's: it is the
    // one that puts itself between its trainer and the hit, and a
    // final evolution is filled to four
    hiddenAbilities: [Abilities.Telepathy, Abilities.Healer],
    eggGroups: [EggGroups.HumanLike, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Confusion, Moves.DoubleTeam, Moves.Teleport],
        21: [Moves.CalmMind],
        26: [Moves.Psychic],
        33: [Moves.Imprison],
        42: [Moves.FutureSight],
        51: [Moves.Hypnosis],
        60: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
