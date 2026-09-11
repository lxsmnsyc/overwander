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
  Moves.Toxic,
  Moves.SolarBeam,
  Moves.Dig,
  Moves.Psychic,
  Moves.DoubleTeam,
  Moves.Flash,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.Mimic,
  Moves.SecretPower,
  Moves.Substitute,
];

export default function registerSpinarakSpecies(): void {
  registerSpecies(Species.Spinarak, {
    dexNumber: 167,
    evolvesInto: [
      {
        species: Species.Ariados,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Spinarak',
    category: 'String Spit Pokemon',
    height: 0.5,
    weight: 8.5,
    family: Families.Spinarak,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 60,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 30,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.Swarm, Abilities.Insomnia],
    hiddenAbilities: [Abilities.Sniper],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.StringShot],
        6: [Moves.ScaryFace],
        11: [Moves.Constrict],
        17: [Moves.NightShade],
        23: [Moves.LeechLife],
        30: [Moves.FurySwipes],
        37: [Moves.SpiderWeb],
        45: [Moves.Screech, Moves.Agility],
        53: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.SonicBoom,
        Moves.Disable,
        Moves.Psybeam,
        Moves.BatonPass,
        Moves.Pursuit,
        Moves.SignalBeam,
      ],
    },
  });

  registerSpecies(Species.Ariados, {
    dexNumber: 168,
    name: 'Ariados',
    category: 'Long Leg Pokemon',
    height: 1.1,
    weight: 33.5,
    family: Families.Spinarak,
    evolvesFrom: Species.Spinarak,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 90,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 40,
    },
    types: [Types.Bug, Types.Poison],
    abilities: [Abilities.Swarm, Abilities.Insomnia],
    // Poison Touch is this registry's rather than the mainline's,
    // filling a final evolution to four: what a poison spider does to
    // whatever it gets hold of
    hiddenAbilities: [Abilities.Sniper, Abilities.PoisonTouch],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.TropicalRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.StringShot, Moves.Constrict, Moves.ScaryFace],
        17: [Moves.NightShade],
        25: [Moves.LeechLife],
        34: [Moves.FurySwipes],
        43: [Moves.SpiderWeb],
        53: [Moves.Screech, Moves.Agility],
        63: [Moves.Psychic],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
