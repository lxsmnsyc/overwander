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
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.SludgeBomb,
  Moves.ZapCannon,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.RainDance,
  Moves.DefenseCurl,
  Moves.Headbutt,
  Moves.Roar,
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.DynamicPunch,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Strength,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.Counter,
  Moves.Dig,
  Moves.DoubleEdge,
  Moves.Earthquake,
  Moves.Facade,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.FocusPunch,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Mimic,
  Moves.Overheat,
  Moves.SecretPower,
  Moves.SeismicToss,
  Moves.ShockWave,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.Taunt,
  Moves.ThunderWave,
  Moves.Torment,
  Moves.WaterPulse,
];

const FAMILY_LEVEL = {
  1: [Moves.ScaryFace, Moves.Tackle],
  4: [Moves.TailWhip],
  8: [Moves.Charm],
  13: [Moves.Bite],
  19: [Moves.Lick],
};

export default function registerSnubbullSpecies(): void {
  registerSpecies(Species.Snubbull, {
    dexNumber: 209,
    evolvesInto: [
      {
        species: Species.Granbull,
        method: EvolutionMethod.Level,
        level: 23,
      },
    ],
    name: 'Snubbull',
    category: 'Fairy Pokemon',
    height: 0.6,
    weight: 7.8,
    family: Families.Snubbull,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 80,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 30,
    },
    types: [Types.Fairy],
    abilities: [Abilities.Intimidate, Abilities.RunAway],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Shrubland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        26: [Moves.Roar],
        34: [Moves.Rage],
        43: [Moves.TakeDown],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Crunch,
        Moves.FeintAttack,
        Moves.HealBell,
        Moves.Leer,
        Moves.Metronome,
        Moves.Present,
        Moves.Reflect,

        Moves.SmellingSalts,
      ],
    },
  });

  registerSpecies(Species.Granbull, {
    dexNumber: 210,
    name: 'Granbull',
    category: 'Fairy Pokemon',
    height: 1.4,
    weight: 48.7,
    family: Families.Snubbull,
    evolvesFrom: Species.Snubbull,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 120,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 45,
    },
    types: [Types.Fairy],
    abilities: [Abilities.Intimidate, Abilities.QuickFeet],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Shrubland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        61: [Moves.Crunch],
        28: [Moves.Roar],
        38: [Moves.Rage],
        51: [Moves.TakeDown],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.Metronome,
        Moves.RockSlide,
        Moves.RockTomb,
      ],
    },
  });
}
