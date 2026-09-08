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
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.SludgeBomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Snatch,
  Moves.Flash,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerShroomishSpecies(): void {
  registerSpecies(Species.Shroomish, {
    dexNumber: 285,
    evolvesInto: [
      {
        species: Species.Breloom,
        method: EvolutionMethod.Level,
        level: 23,
      },
    ],
    name: 'Shroomish',
    category: 'Mushroom Pokemon',
    height: 0.4,
    weight: 4.5,
    family: Families.Shroomish,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 40,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 35,
    },
    types: [Types.Grass],
    abilities: [Abilities.EffectSpore, Abilities.PoisonHeal],
    hiddenAbilities: [Abilities.QuickFeet],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.TemperateRainforest, Biome.TropicalRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        4: [Moves.Tackle],
        7: [Moves.StunSpore],
        10: [Moves.LeechSeed],
        16: [Moves.MegaDrain],
        22: [Moves.Headbutt],
        28: [Moves.PoisonPowder],
        36: [Moves.Growth],
        45: [Moves.GigaDrain],
        54: [Moves.Spore],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Charm, Moves.HelpingHand, Moves.FalseSwipe, Moves.FakeTears],
    },
  });

  registerSpecies(Species.Breloom, {
    dexNumber: 286,
    name: 'Breloom',
    category: 'Mushroom Pokemon',
    height: 1.2,
    weight: 39.2,
    family: Families.Shroomish,
    evolvesFrom: Species.Shroomish,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 130,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 70,
    },
    types: [Types.Grass, Types.Fighting],
    abilities: [Abilities.EffectSpore, Abilities.PoisonHeal],
    hiddenAbilities: [Abilities.Technician],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.TemperateRainforest, Biome.TropicalRainforest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.Tackle, Moves.StunSpore, Moves.LeechSeed],
        16: [Moves.MegaDrain],
        22: [Moves.Headbutt],
        23: [Moves.MachPunch],
        28: [Moves.Counter],
        36: [Moves.SkyUppercut],
        45: [Moves.MindReader],
        54: [Moves.DynamicPunch],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FocusPunch,
        Moves.BulkUp,
        Moves.IronTail,
        Moves.BrickBreak,
        Moves.HyperBeam,
        Moves.Cut,
        Moves.Strength,
        Moves.RockSmash,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.DynamicPunch,
        Moves.MudSlap,
        Moves.FuryCutter,
        Moves.ThunderPunch,
      ],
    },
  });
}
