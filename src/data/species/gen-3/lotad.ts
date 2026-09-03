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

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Surf,
  Moves.Flash,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
];

// What the two above the base pick up: a lily pad has no arms to
// swing a machine with, and the two that stand up do
const GROWN_TEACHABLE = [
  Moves.BrickBreak,
  Moves.Dive,
  Moves.Strength,
  Moves.RockSmash,
  Moves.Waterfall,
  Moves.MudSlap,
  Moves.DynamicPunch,
  Moves.IcePunch,
  Moves.FirePunch,
  Moves.ThunderPunch,
];

export default function registerLotadSpecies(): void {
  registerSpecies(Species.Lotad, {
    dexNumber: 270,
    evolvesInto: [
      {
        species: Species.Lombre,
        method: EvolutionMethod.Level,
        level: 14,
      },
    ],
    name: 'Lotad',
    category: 'Water Weed Pokemon',
    height: 0.5,
    weight: 2.6,
    family: Families.Lotad,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 30,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 30,
    },
    types: [Types.Water, Types.Grass],
    abilities: [Abilities.SwiftSwim, Abilities.RainDish],
    hiddenAbilities: [Abilities.OwnTempo],
    eggGroups: [EggGroups.Water1, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Bog, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Astonish],
        3: [Moves.Growl],
        7: [Moves.Absorb],
        13: [Moves.NaturePower],
        21: [Moves.Mist],
        31: [Moves.RainDance],
        43: [Moves.MegaDrain],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.WaterGun,
        Moves.Synthesis,
        Moves.LeechSeed,
        Moves.RazorLeaf,
        Moves.SweetScent,
        Moves.Flail,
      ],
    },
  });

  registerSpecies(Species.Lombre, {
    dexNumber: 271,
    evolvesInto: [
      {
        species: Species.Ludicolo,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Lombre',
    category: 'Jolly Pokemon',
    height: 1.2,
    weight: 32.5,
    family: Families.Lotad,
    evolvesFrom: Species.Lotad,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 50,
    },
    types: [Types.Water, Types.Grass],
    abilities: [Abilities.SwiftSwim, Abilities.RainDish],
    hiddenAbilities: [Abilities.OwnTempo],
    eggGroups: [EggGroups.Water1, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Bog, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Astonish],
        3: [Moves.Growl],
        7: [Moves.Absorb],
        13: [Moves.NaturePower],
        19: [Moves.FakeOut],
        25: [Moves.FurySwipes],
        31: [Moves.WaterSport],
        37: [Moves.Thief],
        43: [Moves.Uproar],
        49: [Moves.HydroPump],
      },
      teachable: [...FAMILY_TEACHABLE, ...GROWN_TEACHABLE],
    },
  });

  registerSpecies(Species.Ludicolo, {
    dexNumber: 272,
    name: 'Ludicolo',
    category: 'Carefree Pokemon',
    height: 1.5,
    weight: 55,
    family: Families.Lotad,
    evolvesFrom: Species.Lombre,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 70,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Grass],
    abilities: [Abilities.SwiftSwim, Abilities.RainDish],
    // Hydration is this registry's rather than the mainline's: it
    // dances in its own Rain Dance beside Rain Dish, and a final
    // evolution is filled to four
    hiddenAbilities: [Abilities.OwnTempo, Abilities.Hydration],
    eggGroups: [EggGroups.Water1, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Bog, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Astonish, Moves.Growl, Moves.Absorb, Moves.NaturePower],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...GROWN_TEACHABLE,
        Moves.FocusPunch,
        Moves.HyperBeam,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Metronome,
      ],
    },
  });
}
