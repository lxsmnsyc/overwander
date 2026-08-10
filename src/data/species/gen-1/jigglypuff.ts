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

export default function registerJigglypuffSpecies(): void {
  registerSpecies(Species.Jigglypuff, {
    dexNumber: 39,
    evolvesInto: [
      {
        species: Species.Wigglytuff,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Jigglypuff',
    category: 'Balloon Pokemon',
    height: 0.5,
    weight: 5.5,
    family: Families.Jigglypuff,
    stats: {
      [Stats.HP]: 115,
      [Stats.Attack]: 45,
      [Stats.Defense]: 20,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 20,
    },
    types: [Types.Normal, Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.Competitive],
    hiddenAbility: Abilities.FriendGuard,
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 170,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Sing],
        9: [Moves.Pound],
        14: [Moves.Disable],
        19: [Moves.DefenseCurl],
        24: [Moves.DoubleSlap],
        29: [Moves.Rest],
        34: [Moves.BodySlam],
        39: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Wigglytuff, {
    dexNumber: 40,
    name: 'Wigglytuff',
    category: 'Balloon Pokemon',
    height: 1,
    weight: 12,
    family: Families.Jigglypuff,
    evolvesFrom: Species.Jigglypuff,
    stats: {
      [Stats.HP]: 140,
      [Stats.Attack]: 70,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 45,
    },
    types: [Types.Normal, Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.Competitive],
    hiddenAbility: Abilities.Frisk,
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 50,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Sing, Moves.Disable, Moves.DefenseCurl, Moves.DoubleSlap],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
