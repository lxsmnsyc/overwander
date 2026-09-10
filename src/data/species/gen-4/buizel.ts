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
  Moves.Attract,
  Moves.Blizzard,
  Moves.BrickBreak,
  Moves.Brine,
  Moves.BulkUp,
  Moves.Captivate,
  Moves.Dig,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcePunch,
  Moves.IcyWind,
  Moves.IronTail,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Strength,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.Toxic,
  Moves.WaterPulse,
  Moves.Waterfall,
  Moves.Whirlpool,
];

/**
 * The sea weasel: the sac around its neck is what keeps it up, and
 * the two tails are what it screws through the water with
 */
export default function registerBuizelSpecies(): void {
  registerSpecies(Species.Buizel, {
    dexNumber: 418,
    evolvesInto: [
      {
        species: Species.Floatzel,
        method: EvolutionMethod.Level,
        level: 26,
      },
    ],
    name: 'Buizel',
    category: 'Sea Weasel Pokemon',
    height: 0.7,
    weight: 29.5,
    family: Families.Buizel,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 65,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 85,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.WaterVeil],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.SonicBoom, Moves.WaterSport],
        3: [Moves.QuickAttack],
        6: [Moves.WaterGun],
        10: [Moves.Pursuit],
        15: [Moves.Swift],
        21: [Moves.AquaJet],
        28: [Moves.Agility],
        36: [Moves.Whirlpool],
        45: [Moves.RazorWind],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BatonPass,
        Moves.DoubleSlap,
        Moves.FuryCutter,
        Moves.FurySwipes,
        Moves.Headbutt,
        Moves.MudSlap,
        Moves.OdorSleuth,
        Moves.Slash,
      ],
    },
  });
  registerSpecies(Species.Floatzel, {
    dexNumber: 419,
    name: 'Floatzel',
    category: 'Sea Weasel Pokemon',
    height: 1.1,
    weight: 33.5,
    family: Families.Buizel,
    evolvesFrom: Species.Buizel,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 105,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 115,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    // Strong Jaw and Moxie are this registry's rather than the
    // mainline's: what it hunts with, and what hunting does for it
    hiddenAbilities: [Abilities.WaterVeil, Abilities.StrongJaw, Abilities.Moxie],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.IceFang, Moves.QuickAttack, Moves.SonicBoom, Moves.WaterSport],
        3: [Moves.QuickAttack],
        6: [Moves.WaterGun],
        10: [Moves.Pursuit],
        15: [Moves.Swift],
        21: [Moves.AquaJet],
        26: [Moves.Crunch],
        29: [Moves.Agility],
        39: [Moves.Whirlpool],
        50: [Moves.RazorWind],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AquaTail,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.Headbutt,
        Moves.HyperBeam,
        Moves.LowKick,
        Moves.MudSlap,
        Moves.Payback,
        Moves.Roar,
        Moves.Taunt,
        Moves.Torment,
      ],
    },
  });
}
