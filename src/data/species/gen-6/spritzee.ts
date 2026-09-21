import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by both scents
const FAMILY_TEACHABLE = [
  Moves.AfterYou,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Charm,
  Moves.Confide,
  Moves.Covet,
  Moves.DazzlingGleam,
  Moves.DoubleTeam,
  Moves.DrainingKiss,
  Moves.DreamEater,
  Moves.EchoedVoice,
  Moves.Encore,
  Moves.Endeavor,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.GyroBall,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MistyTerrain,
  Moves.NastyPlot,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.SecretPower,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Thunderbolt,
  Moves.Torment,
  Moves.Toxic,
  Moves.TrickRoom,
];

// What the perfume knows at either size
const FAMILY_LEVEL = {
  12: [Moves.Aromatherapy],
  17: [Moves.CalmMind],
  18: [Moves.Attract],
  21: [Moves.Flail],
  24: [Moves.MistyTerrain],
  27: [Moves.Psychic],
  30: [Moves.Charm],
  31: [Moves.Moonblast],
  39: [Moves.SkillSwap],
};

/**
 * The perfume bird and the fragrance it becomes. Nothing is staged
 * yet: Aromatisse has only two of its animations drawn, so the line
 * waits for the rest
 */
export default function registerSpritzeeSpecies(): void {
  registerSpecies(Species.Spritzee, {
    dexNumber: 682,
    evolvesInto: [
      {
        species: Species.Aromatisse,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.Sachet,
      },
    ],
    name: 'Spritzee',
    category: 'Perfume Pokemon',
    height: 0.2,
    weight: 0.5,
    family: Families.Spritzee,
    stats: {
      [Stats.HP]: 78,
      [Stats.Attack]: 52,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 63,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 23,
    },
    types: [Types.Fairy],
    abilities: [Abilities.Healer],
    hiddenAbilities: [Abilities.AromaVeil],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.FairyWind, Moves.SweetScent],
        3: [Moves.SweetKiss],
        6: [Moves.EchoedVoice],
        8: [Moves.OdorSleuth],
        9: [Moves.DrainingKiss],
        ...FAMILY_LEVEL,
        50: [Moves.DisarmingVoice],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AfterYou,
        Moves.Captivate,
        Moves.Disable,
        Moves.NastyPlot,
        Moves.Refresh,
        Moves.Wish,
      ],
    },
  });
  registerSpecies(Species.Aromatisse, {
    dexNumber: 683,
    name: 'Aromatisse',
    category: 'Fragrance Pokemon',
    height: 0.8,
    weight: 15.5,
    family: Families.Spritzee,
    evolvesFrom: Species.Spritzee,
    stats: {
      [Stats.HP]: 101,
      [Stats.Attack]: 72,
      [Stats.Defense]: 72,
      [Stats.SpecialAttack]: 99,
      [Stats.SpecialDefense]: 89,
      [Stats.Speed]: 29,
    },
    types: [Types.Fairy],
    abilities: [Abilities.Healer],
    // Natural Cure and Misty Surge are this line's invented fillers:
    // the mainline gives it Healer and Aroma Veil and nothing else
    hiddenAbilities: [Abilities.AromaVeil, Abilities.NaturalCure, Abilities.MistySurge],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 140,
    biomes: [],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.AromaticMist,
          Moves.EchoedVoice,
          Moves.FairyWind,
          Moves.HealPulse,
          Moves.OdorSleuth,
          Moves.SweetKiss,
          Moves.SweetScent,
        ],
        9: [Moves.DisarmingVoice],
        15: [Moves.DrainingKiss],
        ...FAMILY_LEVEL,
        42: [Moves.PsychUp],
        57: [Moves.Reflect],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DrainPunch,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Metronome,
        Moves.Psyshock,
        Moves.Thunder,
      ],
    },
  });
}
