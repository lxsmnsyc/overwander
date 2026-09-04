import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.IcyWind,
  Moves.Surf,
  Moves.Waterfall,
  Moves.Whirlpool,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.IcePunch,
  Moves.DynamicPunch,
  Moves.MudSlap,
  Moves.Swift,
];

const FAMILY_ABILITIES = [Abilities.ThickFat, Abilities.HugePower];

const FAMILY_BIOMES = [Biome.Bog, Biome.Swamp, Biome.TemperateRainforest];

export default function registerMarillSpecies(): void {
  registerSpecies(Species.Marill, {
    dexNumber: 183,
    evolvesInto: [
      {
        species: Species.Azumarill,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Marill',
    category: 'Aqua Mouse Pokemon',
    height: 0.4,
    weight: 8.5,
    family: Families.Marill,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 20,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 40,
    },
    types: [Types.Water, Types.Fairy],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.SapSipper],
    eggGroups: [EggGroups.Water1, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        3: [Moves.DefenseCurl],
        6: [Moves.TailWhip],
        10: [Moves.WaterGun],
        15: [Moves.Rollout],
        21: [Moves.BubbleBeam],
        28: [Moves.DoubleEdge],
        36: [Moves.RainDance],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Amnesia,
        Moves.BellyDrum,
        Moves.Foresight,
        Moves.FutureSight,
        Moves.LightScreen,
        Moves.PerishSong,
        Moves.Present,
        Moves.Supersonic,
      ],
    },
  });

  registerSpecies(Species.Azumarill, {
    dexNumber: 184,
    name: 'Azumarill',
    category: 'Aqua Rabbit Pokemon',
    height: 0.8,
    weight: 28.5,
    family: Families.Marill,
    evolvesFrom: Species.Marill,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 50,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 50,
    },
    types: [Types.Water, Types.Fairy],
    abilities: [...FAMILY_ABILITIES],
    // Water Veil is this registry's rather than the mainline's,
    // filling a final evolution to four: a body of water this full
    // cannot be set alight
    hiddenAbilities: [Abilities.SapSipper, Abilities.WaterVeil],
    eggGroups: [EggGroups.Water1, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [...FAMILY_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.DefenseCurl, Moves.TailWhip, Moves.WaterGun],
        15: [Moves.Rollout],
        25: [Moves.BubbleBeam],
        36: [Moves.DoubleEdge],
        48: [Moves.RainDance],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Strength, Moves.RockSmash, Moves.HyperBeam],
    },
  });
}
