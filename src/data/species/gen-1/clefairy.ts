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
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.PayDay,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.SolarBeam,
  Moves.Thunderbolt,
  Moves.Thunder,
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
  Moves.Strength,
  Moves.Flash,
];

export default function registerClefairySpecies(): void {
  registerSpecies(Species.Clefairy, {
    dexNumber: 35,
    evolvesInto: [
      {
        species: Species.Clefable,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Clefairy',
    category: 'Fairy Pokemon',
    height: 0.6,
    weight: 7.5,
    family: Families.Clefairy,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 45,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 35,
    },
    types: [Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.MagicGuard],
    hiddenAbilities: [Abilities.FriendGuard],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 150,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Growl],
        13: [Moves.Sing],
        18: [Moves.DoubleSlap],
        24: [Moves.Minimize],
        31: [Moves.Metronome],
        39: [Moves.DefenseCurl],
        48: [Moves.LightScreen],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Clefable, {
    dexNumber: 36,
    name: 'Clefable',
    category: 'Fairy Pokemon',
    height: 1.3,
    weight: 40,
    family: Families.Clefairy,
    evolvesFrom: Species.Clefairy,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 70,
      [Stats.Defense]: 73,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 60,
    },
    types: [Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.MagicGuard],
    hiddenAbilities: [Abilities.Unaware],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 25,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Sing, Moves.DoubleSlap, Moves.Minimize, Moves.Metronome],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
