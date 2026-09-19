import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// The two schools share everything but the stripe and the ability
// behind it: one throws itself about, the other takes the landing
const SHARED = {
  dexNumber: 550,
  category: 'Hostile Pokemon',
  height: 1,
  weight: 18,
  family: Families.Basculin,
  stats: {
    [Stats.HP]: 70,
    [Stats.Attack]: 92,
    [Stats.Defense]: 65,
    [Stats.SpecialAttack]: 80,
    [Stats.SpecialDefense]: 55,
    [Stats.Speed]: 98,
  },
  types: [Types.Water],
  eggGroups: [EggGroups.Water2],
  habitat: Habitat.Water,
  genderRatio: [1, 1] as [number, number],
  catchRate: 25,
  biomes: [Biome.Bog, Biome.Swamp],
  activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
  learnSet: {
    level: {
      1: [Moves.Tackle, Moves.Thrash, Moves.TailWhip, Moves.WaterGun, Moves.Flail],
      3: [Moves.Uproar],
      5: [Moves.Headbutt],
      7: [Moves.Bite],
      9: [Moves.AquaJet],
      11: [Moves.ChipAway],
      14: [Moves.TakeDown],
      17: [Moves.Crunch],
      20: [Moves.ScaryFace, Moves.AquaTail],
      23: [Moves.Soak],
      26: [Moves.DoubleEdge],
      38: [Moves.FinalGambit],
      46: [Moves.HeadSmash],
    },
    teachable: [
      Moves.Agility,
      Moves.AquaTail,
      Moves.Assurance,
      Moves.Attract,
      Moves.Blizzard,
      Moves.Bounce,
      Moves.Brine,
      Moves.Crunch,
      Moves.Cut,
      Moves.Dive,
      Moves.DoubleEdge,
      Moves.DoubleTeam,
      Moves.Endeavor,
      Moves.Endure,
      Moves.Facade,
      Moves.Frustration,
      Moves.GigaImpact,
      Moves.Hail,
      Moves.HiddenPower,
      Moves.HydroPump,
      Moves.HyperBeam,
      Moves.IceBeam,
      Moves.IceFang,
      Moves.IcyWind,
      Moves.MudShot,
      Moves.MuddyWater,
      Moves.Protect,
      Moves.RainDance,
      Moves.Rest,
      Moves.Return,
      Moves.Revenge,
      Moves.Reversal,
      Moves.Round,
      Moves.Scald,
      Moves.ScaryFace,
      Moves.SecretPower,
      Moves.SleepTalk,
      Moves.Snore,
      Moves.Substitute,
      Moves.Superpower,
      Moves.Surf,
      Moves.Swagger,
      Moves.Swift,
      Moves.TakeDown,
      Moves.Taunt,
      Moves.Toxic,
      Moves.Uproar,
      Moves.WaterPulse,
      Moves.Waterfall,
      Moves.Whirlpool,
      Moves.ZenHeadbutt,
    ],
    egg: [
      Moves.Agility,
      Moves.Brine,
      Moves.BubbleBeam,
      Moves.Endeavor,
      Moves.HeadSmash,
      Moves.MudShot,
      Moves.MuddyWater,
      Moves.Rage,
      Moves.Revenge,
      Moves.Swift,
      Moves.Whirlpool,
    ],
  },
};

/**
 * The two schools: they look the same to anybody but each other, and
 * they will not share a river. The white stripe is left out until the
 * generation that gives it somewhere to go
 */
export default function registerBasculinSpecies(): void {
  registerSpecies(Species.Basculin, {
    ...SHARED,
    name: 'Basculin',
    abilities: [Abilities.Reckless, Abilities.Adaptability],
    // Swift Swim is the invented fourth, and both stripes take it: the
    // line reaches three either way, and what they do is run a river
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.SwiftSwim],
  });
  registerSpecies(Species.BasculinBlue, {
    ...SHARED,
    name: 'Basculin Blue',
    baseForm: false,
    // The blue school takes the landing rather than the throw, which
    // is the whole difference between them
    abilities: [Abilities.RockHead, Abilities.Adaptability],
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.SwiftSwim],
  });
}
