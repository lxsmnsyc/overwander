import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.HornDrill,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Earthquake,
  Moves.Fissure,
  Moves.Dig,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.FireBlast,
  Moves.Rest,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Strength,
];

const FAMILY_ABILITIES = [Abilities.LightningRod, Abilities.RockHead];

export default function registerRhyhornSpecies(): void {
  registerSpecies(Species.Rhyhorn, {
    dexNumber: 111,
    evolvesInto: [
      {
        species: Species.Rhydon,
        method: EvolutionMethod.Level,
        level: 42,
      },
    ],
    name: 'Rhyhorn',
    category: 'Spikes Pokemon',
    height: 1,
    weight: 115,
    family: Families.Rhyhorn,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 85,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 25,
    },
    types: [Types.Ground, Types.Rock],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.Reckless,
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Savanna, Biome.Desert],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.HornAttack],
        30: [Moves.Stomp],
        35: [Moves.TailWhip],
        40: [Moves.FuryAttack],
        45: [Moves.HornDrill],
        50: [Moves.Leer],
        55: [Moves.TakeDown],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.RockSlide, Moves.Thrash, Moves.Counter],
    },
  });

  registerSpecies(Species.Rhydon, {
    dexNumber: 112,
    name: 'Rhydon',
    category: 'Drill Pokemon',
    height: 1.9,
    weight: 120,
    family: Families.Rhyhorn,
    evolvesFrom: Species.Rhyhorn,
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 130,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 40,
    },
    types: [Types.Ground, Types.Rock],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbility: Abilities.Reckless,
    eggGroups: [EggGroups.Monster, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Savanna, Biome.Desert],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.HornAttack, Moves.Stomp, Moves.TailWhip, Moves.FuryAttack],
        30: [Moves.Stomp],
        35: [Moves.TailWhip],
        40: [Moves.FuryAttack],
        48: [Moves.HornDrill],
        55: [Moves.Leer],
        64: [Moves.TakeDown],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.DragonRage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Reflect,
        Moves.SkullBash,
        Moves.Surf,
      ],
    },
  });
}
