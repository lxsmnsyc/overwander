import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * A Mantine that has not grown its wings out: a Mantyke swims with
 * whatever is bigger than it and copies how that thing moves
 */
export default function registerMantykeSpecies(): void {
  registerSpecies(Species.Mantyke, {
    dexNumber: 458,
    evolvesInto: [
      {
        species: Species.Mantine,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Mantyke',
    category: 'Kite Pokemon',
    height: 1.0,
    weight: 65.0,
    family: Families.Mantine,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 20,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 50,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.SwiftSwim, Abilities.WaterAbsorb],
    hiddenAbilities: [Abilities.WaterVeil],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 25,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Tackle],
        4: [Moves.Supersonic],
        10: [Moves.BubbleBeam],
        13: [Moves.Headbutt],
        19: [Moves.Agility],
        22: [Moves.WingAttack],
        28: [Moves.WaterPulse],
        31: [Moves.TakeDown],
        37: [Moves.ConfuseRay],
        40: [Moves.Bounce],
        46: [Moves.AquaRing],
        49: [Moves.HydroPump],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AirCutter,
        Moves.Attract,
        Moves.Blizzard,
        Moves.Bounce,
        Moves.Captivate,
        Moves.Dive,
        Moves.DoubleTeam,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Facade,
        Moves.Frustration,
        Moves.Hail,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.Surf,
        Moves.Swagger,
        Moves.Swift,
        Moves.Toxic,
        Moves.WaterPulse,
        Moves.Waterfall,
      ],
      egg: [
        Moves.Haze,
        Moves.HydroPump,
        Moves.MirrorCoat,
        Moves.MudSport,
        Moves.RockSlide,
        Moves.SignalBeam,
        Moves.Slam,
        Moves.Splash,
        Moves.Twister,
        Moves.WaterSport,
      ],
    },
  });
}
