import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// The two shapes share everything but their stats and their size
const WISHIWASHI_SHARED = {
  dexNumber: 746,
  category: 'Small Fry Pokemon',
  family: Families.Wishiwashi,
  habitat: Habitat.Water,
  types: [Types.Water],
  abilities: [Abilities.Schooling],
  hiddenAbilities: [Abilities.SwiftSwim, Abilities.WimpOut, Abilities.Anticipation],
  eggGroups: [EggGroups.Water2],
  genderRatio: [4, 4] as [number, number],
  catchRate: 60,
  activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
  learnSet: {
    level: {
      1: [Moves.Growl, Moves.WaterGun],
      6: [Moves.HelpingHand],
      9: [Moves.FeintAttack],
      14: [Moves.Brine],
      17: [Moves.AquaRing],
      22: [Moves.TearfulLook],
      25: [Moves.TakeDown],
      30: [Moves.Dive],
      33: [Moves.BeatUp],
      38: [Moves.AquaTail],
      41: [Moves.DoubleEdge],
      46: [Moves.Soak],
      49: [Moves.Endeavor],
      54: [Moves.HydroPump],
    },
    teachable: [
      Moves.AquaTail,
      Moves.Attract,
      Moves.Bulldoze,
      Moves.Confide,
      Moves.Covet,
      Moves.DoubleTeam,
      Moves.Earthquake,
      Moves.Endeavor,
      Moves.Facade,
      Moves.Frustration,
      Moves.Hail,
      Moves.HelpingHand,
      Moves.HiddenPower,
      Moves.IceBeam,
      Moves.IronTail,
      Moves.Protect,
      Moves.RainDance,
      Moves.Rest,
      Moves.Return,
      Moves.Round,
      Moves.Scald,
      Moves.SleepTalk,
      Moves.Snore,
      Moves.Substitute,
      Moves.Surf,
      Moves.Swagger,
      Moves.Toxic,
      Moves.UTurn,
      Moves.WaterPulse,
      Moves.Waterfall,
    ],
    egg: [Moves.Mist, Moves.MuddyWater, Moves.WaterPulse, Moves.WaterSport, Moves.Whirlpool],
  },
};

export default function registerWishiwashiSpecies(): void {
  registerSpecies(Species.Wishiwashi, {
    ...WISHIWASHI_SHARED,
    name: 'Wishiwashi',
    height: 0.2,
    weight: 0.3,
    biomes: [Biome.CoralReef, Biome.Ocean, Biome.Mangrove],
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 20,
      [Stats.Defense]: 20,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 40,
    },
  });
  registerSpecies(Species.WishiwashiSchool, {
    ...WISHIWASHI_SHARED,
    name: 'Wishiwashi School',
    // The school it calls together mid-fight, so it is never met on its own
    baseForm: false,
    worn: true,
    height: 8.2,
    weight: 78.6,
    biomes: [],
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 140,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 140,
      [Stats.SpecialDefense]: 135,
      [Stats.Speed]: 30,
    },
  });
}
