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

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Attract,
  Moves.BrickBreak,
  Moves.BrutalSwing,
  Moves.BulkUp,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.DualChop,
  Moves.Earthquake,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusPunch,
  Moves.FrostBreath,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.IcePunch,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Scald,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Thief,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
];

export default function registerCrabrawlerSpecies(): void {
  registerSpecies(Species.Crabrawler, {
    dexNumber: 739,
    // An Ice Stone rather than the top of Mount Lanakila, the way the
    // later games ask for one: nowhere here is that mountain
    evolvesInto: [
      { species: Species.Crabominable, method: EvolutionMethod.UsedItem, item: Items.IceStone },
    ],
    name: 'Crabrawler',
    category: 'Boxing Pokemon',
    height: 0.6,
    weight: 7,
    family: Families.Crabrawler,
    stats: {
      [Stats.HP]: 47,
      [Stats.Attack]: 82,
      [Stats.Defense]: 57,
      [Stats.SpecialAttack]: 42,
      [Stats.SpecialDefense]: 47,
      [Stats.Speed]: 63,
    },
    types: [Types.Fighting],
    abilities: [Abilities.HyperCutter, Abilities.IronFist],
    hiddenAbilities: [Abilities.AngerPoint],
    eggGroups: [EggGroups.Water3],
    genderRatio: [4, 4],
    catchRate: 225,
    biomes: [Biome.Beach, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        5: [Moves.RockSmash],
        9: [Moves.Leer],
        13: [Moves.Pursuit],
        17: [Moves.BubbleBeam],
        22: [Moves.PowerUpPunch],
        25: [Moves.DizzyPunch],
        29: [Moves.Payback],
        33: [Moves.Reversal],
        37: [Moves.Crabhammer],
        42: [Moves.IronDefense],
        45: [Moves.DynamicPunch],
        49: [Moves.CloseCombat],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Amnesia, Moves.Endeavor, Moves.Superpower, Moves.WideGuard],
    },
  });
  registerSpecies(Species.Crabominable, {
    dexNumber: 740,
    name: 'Crabominable',
    category: 'Woolly Crab Pokemon',
    height: 1.7,
    weight: 180,
    family: Families.Crabrawler,
    evolvesFrom: Species.Crabrawler,
    stats: {
      [Stats.HP]: 97,
      [Stats.Attack]: 132,
      [Stats.Defense]: 77,
      [Stats.SpecialAttack]: 62,
      [Stats.SpecialDefense]: 67,
      [Stats.Speed]: 43,
    },
    types: [Types.Fighting, Types.Ice],
    abilities: [Abilities.HyperCutter, Abilities.IronFist],
    hiddenAbilities: [Abilities.AngerPoint, Abilities.ShellArmor],
    eggGroups: [EggGroups.Water3],
    genderRatio: [4, 4],
    catchRate: 60,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.IcePunch, Moves.Leer, Moves.Pursuit, Moves.RockSmash],
        17: [Moves.BubbleBeam],
        22: [Moves.PowerUpPunch],
        25: [Moves.DizzyPunch],
        29: [Moves.Avalanche],
        33: [Moves.Reversal],
        37: [Moves.IceHammer],
        42: [Moves.IronDefense],
        45: [Moves.DynamicPunch],
        49: [Moves.CloseCombat],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Blizzard,
        Moves.Block,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.IceBeam,
        Moves.IcyWind,
      ],
    },
  });
}
