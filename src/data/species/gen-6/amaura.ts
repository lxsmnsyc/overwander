import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AquaTail,
  Moves.Attract,
  Moves.Blizzard,
  Moves.Bulldoze,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DragonTail,
  Moves.DreamEater,
  Moves.EarthPower,
  Moves.EchoedVoice,
  Moves.Facade,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.FrostBreath,
  Moves.Frustration,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.HyperVoice,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.IronTail,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.NaturePower,
  Moves.Outrage,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.Swagger,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.WaterPulse,
  Moves.ZenHeadbutt,
];

// What the aurora learns whichever size it is
const FAMILY_LEVEL = {
  1: [Moves.Growl, Moves.PowderSnow],
  5: [Moves.ThunderWave],
  10: [Moves.RockThrow],
  13: [Moves.IcyWind],
  15: [Moves.TakeDown],
  18: [Moves.Mist],
  20: [Moves.AuroraBeam],
  26: [Moves.AncientPower],
  30: [Moves.Round],
  34: [Moves.Avalanche],
  38: [Moves.Hail],
};

/**
 * The sail in the rock. A Sail Fossil is the only road to it, and the
 * lights it hangs over a cold night are what it was named for
 */
export default function registerAmauraSpecies(): void {
  registerSpecies(Species.Amaura, {
    dexNumber: 698,
    evolvesInto: [
      {
        species: Species.Aurorus,
        method: EvolutionMethod.Level | EvolutionMethod.TimeOfDay,
        level: 39,
        time: TimeOfDay.Night,
      },
    ],
    name: 'Amaura',
    category: 'Tundra Pokemon',
    height: 1.3,
    weight: 25.2,
    family: Families.Amaura,
    stats: {
      [Stats.HP]: 77,
      [Stats.Attack]: 59,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 67,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 46,
    },
    types: [Types.Rock, Types.Ice],
    abilities: [Abilities.Refrigerate],
    hiddenAbilities: [Abilities.SnowWarning],
    eggGroups: [EggGroups.Monster],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        41: [Moves.NaturePower],
        44: [Moves.Encore],
        47: [Moves.LightScreen],
        50: [Moves.IceBeam],
        57: [Moves.HyperBeam],
        65: [Moves.Blizzard],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Barrier, Moves.Discharge, Moves.Haze, Moves.MagnetRise, Moves.MirrorCoat],
    },
  });
  registerSpecies(Species.Aurorus, {
    dexNumber: 699,
    name: 'Aurorus',
    category: 'Tundra Pokemon',
    height: 2.7,
    weight: 225.0,
    family: Families.Amaura,
    evolvesFrom: Species.Amaura,
    stats: {
      [Stats.HP]: 123,
      [Stats.Attack]: 77,
      [Stats.Defense]: 72,
      [Stats.SpecialAttack]: 99,
      [Stats.SpecialDefense]: 92,
      [Stats.Speed]: 58,
    },
    types: [Types.Rock, Types.Ice],
    abilities: [Abilities.Refrigerate],
    // Ice Body and Snow Cloak are this line's invented fillers: the
    // mainline gives Aurorus the two above and nothing else
    hiddenAbilities: [Abilities.SnowWarning, Abilities.IceBody, Abilities.SnowCloak],
    eggGroups: [EggGroups.Monster],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        43: [Moves.NaturePower],
        46: [Moves.Encore],
        50: [Moves.LightScreen],
        56: [Moves.IceBeam],
        63: [Moves.HyperBeam],
        74: [Moves.Blizzard],
        77: [Moves.FreezeDry],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Earthquake,
        Moves.GigaImpact,
        Moves.Psychic,
        Moves.Thunder,
      ],
    },
  });
}
