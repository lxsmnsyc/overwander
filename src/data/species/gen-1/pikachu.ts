import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.PayDay,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Flash,
  Moves.ThunderPunch,
  Moves.Headbutt,
  Moves.Strength,
  Moves.DefenseCurl,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.ZapCannon,
  Moves.Detect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.BrickBreak,
  Moves.Counter,
  Moves.Dig,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.RockSmash,
  Moves.SecretPower,
  Moves.ShockWave,
];

export default function registerPikachuSpecies(): void {
  registerSpecies(Species.Pikachu, {
    dexNumber: 25,
    evolvesInto: [
      {
        species: Species.Raichu,
        method: EvolutionMethod.UsedItem,
        item: Items.ThunderStone,
      },
    ],
    name: 'Pikachu',
    category: 'Mouse Pokemon',
    height: 0.4,
    weight: 6,
    family: Families.Pikachu,
    evolvesFrom: Species.Pichu,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 55,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 90,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.LightningRod],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.ThunderShock, Moves.Growl],
        6: [Moves.TailWhip],
        8: [Moves.ThunderWave],
        11: [Moves.QuickAttack],
        15: [Moves.DoubleTeam],
        20: [Moves.Slam],
        26: [Moves.Swift, Moves.Thunderbolt],
        33: [Moves.Agility],
        41: [Moves.Thunder],
        50: [Moves.LightScreen],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Raichu, {
    dexNumber: 26,
    name: 'Raichu',
    category: 'Mouse Pokemon',
    height: 0.8,
    weight: 30,
    family: Families.Pikachu,
    evolvesFrom: Species.Pikachu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 90,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 110,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.LightningRod, Abilities.VoltAbsorb, Abilities.QuickFeet],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.ThunderShock,
          Moves.Growl,
          Moves.ThunderWave,
          Moves.TailWhip,
          Moves.Thunderbolt,
          Moves.QuickAttack,
        ],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Thief, Moves.LightScreen],
    },
  });
}
