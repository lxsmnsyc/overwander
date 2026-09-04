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
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.MegaDrain,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.SelfDestruct,
  Moves.FireBlast,
  Moves.Explosion,
  Moves.Rest,
  Moves.Substitute,
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.MudSlap,
  Moves.ZapCannon,
  Moves.GigaDrain,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Flamethrower,
];

const FAMILY_ABILITIES = [Abilities.Stench, Abilities.StickyHold];

export default function registerGrimerSpecies(): void {
  registerSpecies(Species.Grimer, {
    dexNumber: 88,
    evolvesInto: [
      {
        species: Species.Muk,
        method: EvolutionMethod.Level,
        level: 38,
      },
    ],
    name: 'Grimer',
    category: 'Sludge Pokemon',
    height: 0.9,
    weight: 30,
    family: Families.Grimer,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 80,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 25,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.PoisonTouch],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Disable, Moves.PoisonGas],
        5: [Moves.Harden],
        16: [Moves.Sludge],
        23: [Moves.Minimize],
        31: [Moves.Screech],
        40: [Moves.AcidArmor],
        50: [Moves.SludgeBomb],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Haze, Moves.Lick, Moves.MeanLook],
    },
  });

  registerSpecies(Species.Muk, {
    dexNumber: 89,
    name: 'Muk',
    category: 'Sludge Pokemon',
    height: 1.2,
    weight: 30,
    family: Families.Grimer,
    evolvesFrom: Species.Grimer,
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 105,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 50,
    },
    types: [Types.Poison],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.PoisonTouch, Abilities.LiquidOoze],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Disable, Moves.PoisonGas, Moves.Harden],
        23: [Moves.Minimize],
        31: [Moves.Screech],
        37: [Moves.Sludge],
        45: [Moves.AcidArmor],
        60: [Moves.SludgeBomb],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
