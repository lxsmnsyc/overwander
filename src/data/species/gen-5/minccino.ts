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
  Moves.AfterYou,
  Moves.AquaTail,
  Moves.Attract,
  Moves.BatonPass,
  Moves.BulletSeed,
  Moves.CalmMind,
  Moves.Charm,
  Moves.Covet,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Encore,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Fling,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.GunkShot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HyperVoice,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LastResort,
  Moves.MudSlap,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.SuperFang,
  Moves.Swagger,
  Moves.Swift,
  Moves.TailSlap,
  Moves.TakeDown,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WorkUp,
  Moves.Confide,
  Moves.DazzlingGleam,
];

/**
 * The chinchillas: a Minccino cleans everything it can reach with its
 * tail, and a Cinccino's scarf is oiled enough that nothing sticks to
 * it at all
 */
export default function registerMinccinoSpecies(): void {
  registerSpecies(Species.Minccino, {
    dexNumber: 572,
    evolvesInto: [
      {
        species: Species.Cinccino,
        method: EvolutionMethod.UsedItem,
        item: Items.ShinyStone,
      },
    ],
    name: 'Minccino',
    category: 'Chinchilla Pokemon',
    height: 0.4,
    weight: 5.8,
    family: Families.Minccino,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 50,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 75,
    },
    types: [Types.Normal],
    abilities: [Abilities.CuteCharm, Abilities.Technician],
    hiddenAbilities: [Abilities.SkillLink],
    eggGroups: [EggGroups.Field],
    // Three females to every male
    genderRatio: [1, 3],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound],
        3: [Moves.Growl, Moves.BabyDollEyes],
        4: [Moves.HelpingHand],
        8: [Moves.EchoedVoice],
        9: [Moves.Tickle],
        12: [Moves.Sing],
        13: [Moves.DoubleSlap],
        15: [Moves.Encore],
        16: [Moves.Charm],
        19: [Moves.Swift],
        25: [Moves.TailSlap],
        28: [Moves.AfterYou],
        31: [Moves.WakeUpSlap],
        37: [Moves.Slam],
        39: [Moves.Captivate],
        43: [Moves.HyperVoice],
        45: [Moves.LastResort],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AquaTail,
        Moves.Endure,
        Moves.FakeTears,
        Moves.Flail,
        Moves.IronTail,
        Moves.KnockOff,
        Moves.MudSlap,
        Moves.SleepTalk,
        Moves.TailWhip,
      ],
    },
  });
  registerSpecies(Species.Cinccino, {
    dexNumber: 573,
    name: 'Cinccino',
    category: 'Scarf Pokemon',
    height: 0.5,
    weight: 7.5,
    family: Families.Minccino,
    evolvesFrom: Species.Minccino,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 95,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 115,
    },
    types: [Types.Normal],
    abilities: [Abilities.CuteCharm, Abilities.Technician],
    // Sturdy is the invented fourth: the line reaches three, and the
    // oiled scarf is what everything thrown at it slides off
    hiddenAbilities: [Abilities.SkillLink, Abilities.Sturdy],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 60,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // A stone evolution learns nothing further on its own, beyond
      // the tail it comes into
      level: {
        1: [
          Moves.Pound,
          Moves.Slam,
          Moves.Sing,
          Moves.Swift,
          Moves.Charm,
          Moves.Encore,
          Moves.HelpingHand,
          Moves.HyperVoice,
          Moves.Tickle,
          Moves.BulletSeed,
          Moves.RockBlast,
          Moves.LastResort,
          Moves.AfterYou,
          Moves.EchoedVoice,
          Moves.TailSlap,
        ],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DoubleEdge,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.RockBlast,
        Moves.Thunder,
        Moves.LaserFocus,
      ],
    },
  });
}
