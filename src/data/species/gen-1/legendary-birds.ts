import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by all three birds
const BIRD_TEACHABLE = [
  Moves.Toxic,
  Moves.RazorWind,
  Moves.Whirlwind,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.HyperBeam,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkyAttack,
  Moves.Rest,
  Moves.Substitute,
  Moves.Fly,
];

export default function registerLegendaryBirdSpecies(): void {
  registerSpecies(Species.Articuno, {
    dexNumber: 144,
    name: 'Articuno',
    category: 'Freeze Pokemon',
    family: Families.Articuno,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 85,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 125,
      [Stats.Speed]: 85,
    },
    types: [Types.Ice, Types.Flying],
    abilities: [Abilities.SnowCloak, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.IceBeam],
        51: [Moves.Blizzard],
        55: [Moves.Agility],
        60: [Moves.Mist],
      },
      teachable: [
        ...BIRD_TEACHABLE,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.Surf,
      ],
    },
  });

  registerSpecies(Species.Zapdos, {
    dexNumber: 145,
    name: 'Zapdos',
    category: 'Electric Pokemon',
    family: Families.Zapdos,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 90,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 100,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.Static, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.ThunderShock, Moves.DrillPeck],
        51: [Moves.Thunder],
        55: [Moves.Agility],
        60: [Moves.LightScreen],
      },
      teachable: [
        ...BIRD_TEACHABLE,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Flash,
      ],
    },
  });

  registerSpecies(Species.Moltres, {
    dexNumber: 146,
    name: 'Moltres',
    category: 'Flame Pokemon',
    family: Families.Moltres,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 100,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 90,
    },
    types: [Types.Fire, Types.Flying],
    abilities: [Abilities.FlameBody, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.FireSpin],
        51: [Moves.Leer],
        55: [Moves.Agility],
        60: [Moves.SkyAttack],
      },
      teachable: [...BIRD_TEACHABLE, Moves.FireBlast],
    },
  });
}
