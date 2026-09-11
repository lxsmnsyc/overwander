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
  Moves.CalmMind,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.IronTail,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Return,
  Moves.Dig,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Flash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.ThunderWave,
  Moves.Substitute,
  Moves.Rollout,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
  Moves.Swift,
];

export default function registerSkittySpecies(): void {
  registerSpecies(Species.Skitty, {
    dexNumber: 300,
    evolvesInto: [
      {
        species: Species.Delcatty,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Skitty',
    category: 'Kitten Pokemon',
    height: 0.6,
    weight: 11,
    family: Families.Skitty,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 45,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 50,
    },
    types: [Types.Normal],
    abilities: [Abilities.CuteCharm, Abilities.Normalize],
    hiddenAbilities: [Abilities.WonderSkin],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        3: [Moves.TailWhip],
        7: [Moves.Attract],
        13: [Moves.Sing],
        15: [Moves.DoubleSlap],
        19: [Moves.Assist],
        25: [Moves.Charm],
        27: [Moves.FeintAttack],
        31: [Moves.Covet],
        37: [Moves.HealBell],
        39: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Uproar,
        Moves.HelpingHand,
        Moves.BatonPass,
        Moves.Wish,
        Moves.Tickle,
        Moves.FakeTears,
      ],
    },
  });

  registerSpecies(Species.Delcatty, {
    dexNumber: 301,
    name: 'Delcatty',
    category: 'Prim Pokemon',
    height: 1.1,
    weight: 32.6,
    family: Families.Skitty,
    evolvesFrom: Species.Skitty,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 65,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.CuteCharm, Abilities.Normalize],
    // Limber is this registry's rather than the mainline's: a cat
    // that never seizes up, and a final evolution is filled to four
    hiddenAbilities: [Abilities.WonderSkin, Abilities.Limber],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.DoubleSlap, Moves.Sing, Moves.Attract],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength, Moves.RockSmash],
    },
  });
}
