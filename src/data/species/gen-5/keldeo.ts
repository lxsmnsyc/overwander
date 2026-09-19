import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The fourth sword, and the youngest: a colt that crosses water at a
 * gallop and is learning the blade from the three that already have
 * it. It is a mythical, so a relic calls it rather than a lair
 * staging it
 */
export default function registerKeldeoSpecies(): void {
  registerSpecies(Species.Keldeo, {
    dexNumber: 647,
    name: 'Keldeo',
    category: 'Colt Pokemon',
    height: 1.4,
    weight: 48.5,
    family: Families.Keldeo,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 72,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 129,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 108,
    },
    types: [Types.Water, Types.Fighting],
    habitat: Habitat.Amphibious,
    abilities: [Abilities.Justified],
    // Swift Swim, Analytic and Steadfast are this registry's rather
    // than the mainline's: the colt is quickest where the water is,
    // and it strikes into what is still winding up
    hiddenAbilities: [Abilities.SwiftSwim, Abilities.Analytic, Abilities.Steadfast],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.AquaJet, Moves.Leer],
        7: [Moves.DoubleKick],
        13: [Moves.BubbleBeam],
        19: [Moves.TakeDown],
        25: [Moves.HelpingHand],
        31: [Moves.Retaliate],
        37: [Moves.AquaTail],
        43: [Moves.SacredSword],
        49: [Moves.SwordsDance],
        55: [Moves.QuickGuard],
        61: [Moves.WorkUp],
        67: [Moves.HydroPump],
        73: [Moves.CloseCombat],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AquaTail,
        Moves.Bounce,
        Moves.CalmMind,
        Moves.Covet,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Endeavor,
        Moves.Facade,
        Moves.FalseSwipe,
        Moves.FocusBlast,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcyWind,
        Moves.LastResort,
        Moves.PoisonJab,
        Moves.Protect,
        Moves.PsychUp,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Retaliate,
        Moves.Return,
        Moves.Roar,
        Moves.RockSmash,
        Moves.Round,
        Moves.Safeguard,
        Moves.Scald,
        Moves.SecretSword,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.Superpower,
        Moves.Surf,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Taunt,
        Moves.Toxic,
        Moves.WorkUp,
        Moves.XScissor,
        Moves.Confide,
      ],
    },
  });
}
