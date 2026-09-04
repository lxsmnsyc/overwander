import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.PayDay,
  Moves.Rage,
  Moves.Dig,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Surf,
  Moves.Strength,
  Moves.Flash,
  Moves.Headbutt,
  Moves.Earthquake,
  Moves.Swift,
  Moves.DreamEater,
  Moves.Nightmare,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.ZapCannon,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
  Moves.PsychUp,
  Moves.ShadowBall,
  Moves.Flamethrower,
];

// Slowbro's claws open up the fighting-style TMs
const EVOLVED_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Submission,
  Moves.Counter,
  Moves.SeismicToss,
];

const FAMILY_ABILITIES = [Abilities.Oblivious, Abilities.OwnTempo];

export default function registerSlowpokeSpecies(): void {
  registerSpecies(Species.Slowpoke, {
    dexNumber: 79,
    evolvesInto: [
      {
        species: Species.Slowbro,
        method: EvolutionMethod.Level,
        level: 37,
      },
      {
        species: Species.Slowking,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.KingsRock,
      },
    ],
    name: 'Slowpoke',
    category: 'Dopey Pokemon',
    height: 1.2,
    weight: 36,
    family: Families.Slowpoke,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 15,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Regenerator],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.Swamp, Biome.Mangrove, Biome.RockyCoast],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.Tackle, Moves.Curse],
        6: [Moves.Growl],
        15: [Moves.WaterGun],
        18: [Moves.Disable],
        22: [Moves.Headbutt],
        40: [Moves.Amnesia],
        48: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Stomp, Moves.BellyDrum, Moves.Safeguard, Moves.FutureSight],
    },
  });

  registerSpecies(Species.Slowbro, {
    dexNumber: 80,
    name: 'Slowbro',
    category: 'Hermit Crab Pokemon',
    height: 1.6,
    weight: 78.5,
    family: Families.Slowpoke,
    evolvesFrom: Species.Slowpoke,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 75,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 30,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Regenerator, Abilities.Unaware],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.Swamp, Biome.Mangrove, Biome.RockyCoast],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Confusion,
          Moves.Disable,
          Moves.Headbutt,
          Moves.Growl,
          Moves.WaterGun,
          Moves.Tackle,
          Moves.Curse,
        ],
        37: [Moves.Withdraw],
        44: [Moves.Amnesia],
        54: [Moves.Psychic],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...EVOLVED_TEACHABLE,
        Moves.HyperBeam,
        Moves.IcePunch,
        Moves.FuryCutter,
        Moves.DynamicPunch,
        Moves.RockSmash,
      ],
    },
  });
}
