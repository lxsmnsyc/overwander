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
  Moves.Attract,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.Gravity,
  Moves.GyroBall,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.PainSplit,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.ShadowBall,
  Moves.SignalBeam,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.ThunderWave,
  Moves.Torment,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.WonderRoom,
  Moves.WorrySeed,
  Moves.ZenHeadbutt,
];

/**
 * The dreamers: a Munna eats what somebody is dreaming, and a
 * Musharna breathes the pink mist of it back out
 */
export default function registerMunnaSpecies(): void {
  registerSpecies(Species.Munna, {
    dexNumber: 517,
    evolvesInto: [
      {
        species: Species.Musharna,
        method: EvolutionMethod.UsedItem,
        item: Items.MoonStone,
      },
    ],
    name: 'Munna',
    category: 'Dream Eater Pokemon',
    height: 0.6,
    weight: 23.3,
    family: Families.Munna,
    stats: {
      [Stats.HP]: 76,
      [Stats.Attack]: 25,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 67,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 24,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Forewarn, Abilities.Synchronize],
    hiddenAbilities: [Abilities.Telepathy],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.DefenseCurl, Moves.Psywave],
        5: [Moves.LuckyChant],
        7: [Moves.Yawn],
        11: [Moves.Psybeam],
        13: [Moves.Imprison],
        17: [Moves.Moonlight],
        19: [Moves.Hypnosis],
        23: [Moves.ZenHeadbutt],
        25: [Moves.Synchronoise],
        29: [Moves.Nightmare],
        31: [Moves.FutureSight],
        35: [Moves.CalmMind],
        37: [Moves.Psychic],
        41: [Moves.DreamEater],
        43: [Moves.Telekinesis],
        47: [Moves.StoredPower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Barrier,
        Moves.BatonPass,
        Moves.Curse,
        Moves.SecretPower,
        Moves.SonicBoom,
        Moves.Swift,
      ],
    },
  });
  registerSpecies(Species.Musharna, {
    dexNumber: 518,
    name: 'Musharna',
    category: 'Drowsing Pokemon',
    height: 1.1,
    weight: 60.5,
    family: Families.Munna,
    evolvesFrom: Species.Munna,
    stats: {
      [Stats.HP]: 116,
      [Stats.Attack]: 55,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 107,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 29,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Forewarn, Abilities.Synchronize],
    // Comatose is the invented fourth: the line reaches three, and a
    // pokemon that never wakes is what a Musharna is
    hiddenAbilities: [Abilities.Telepathy, Abilities.Comatose],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      // A stone evolution learns nothing further: everything it knows
      // it knew as a Munna
      level: {
        1: [Moves.DefenseCurl, Moves.Hypnosis, Moves.LuckyChant, Moves.Psybeam],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
