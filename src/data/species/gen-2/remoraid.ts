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
  Moves.IceBeam,
  Moves.Flamethrower,
  Moves.Surf,
  Moves.HyperBeam,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Whirlpool,
  Moves.Swift,
  Moves.MudSlap,
  Moves.DefenseCurl,
  Moves.Blizzard,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.FireBlast,
  Moves.Mimic,
  Moves.Psychic,
  Moves.SecretPower,
  Moves.Substitute,
  Moves.WaterPulse,
  Moves.Waterfall,
];

// The three beams all land together, at the same level up the line
const BEAMS = { 22: [Moves.AuroraBeam, Moves.BubbleBeam, Moves.Psybeam] };

export default function registerRemoraidSpecies(): void {
  registerSpecies(Species.Remoraid, {
    dexNumber: 223,
    evolvesInto: [
      {
        species: Species.Octillery,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Remoraid',
    category: 'Jet Pokemon',
    height: 0.6,
    weight: 12,
    family: Families.Remoraid,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 65,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 65,
    },
    types: [Types.Water],
    abilities: [Abilities.Hustle, Abilities.Sniper],
    hiddenAbilities: [Abilities.Moody],
    eggGroups: [EggGroups.Water1, EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Ocean, Biome.KelpForest, Biome.CoralReef],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun],
        11: [Moves.LockOn],
        ...BEAMS,
        33: [Moves.FocusEnergy],
        44: [Moves.IceBeam],
        55: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Haze,
        Moves.Octazooka,
        Moves.Screech,
        Moves.Supersonic,
        Moves.RockBlast,
        Moves.ThunderWave,
      ],
    },
  });

  registerSpecies(Species.Octillery, {
    dexNumber: 224,
    name: 'Octillery',
    category: 'Jet Pokemon',
    height: 0.9,
    weight: 28.5,
    family: Families.Remoraid,
    evolvesFrom: Species.Remoraid,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 105,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 45,
    },
    types: [Types.Water],
    abilities: [Abilities.SuctionCups, Abilities.Sniper],
    hiddenAbilities: [Abilities.Moody],
    eggGroups: [EggGroups.Water1, EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.KelpForest, Biome.CoralReef],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun],
        11: [Moves.Constrict],
        ...BEAMS,
        25: [Moves.Octazooka],
        38: [Moves.FocusEnergy],
        54: [Moves.IceBeam],
        70: [Moves.HyperBeam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BulletSeed,
        Moves.SeismicToss,
        Moves.SludgeBomb,
        Moves.ThunderWave,
      ],
    },
  });
}
