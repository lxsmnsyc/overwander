import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The nurse: it carries whatever it finds hurt back to the shallows in
 * its fins, and the film over it does the rest
 */
export default function registerAlomomolaSpecies(): void {
  registerSpecies(Species.Alomomola, {
    dexNumber: 594,
    name: 'Alomomola',
    category: 'Caring Pokemon',
    height: 1.2,
    weight: 31.6,
    family: Families.Alomomola,
    stats: {
      [Stats.HP]: 165,
      [Stats.Attack]: 75,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 65,
    },
    types: [Types.Water],
    abilities: [Abilities.Healer, Abilities.Hydration],
    // Unaware is the invented fourth: the line reaches three, and
    // something with 165 HP wins by still being there at the end
    hiddenAbilities: [Abilities.Regenerator, Abilities.Unaware],
    eggGroups: [EggGroups.Water1, EggGroups.Water2],
    habitat: Habitat.Water,
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Ocean, Biome.CoralReef],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Pound,
          Moves.HydroPump,
          Moves.HelpingHand,
          Moves.WaterSport,
          Moves.HealingWish,
          Moves.WideGuard,
        ],
        5: [Moves.AquaRing],
        9: [Moves.AquaJet],
        13: [Moves.DoubleSlap],
        17: [Moves.HealPulse],
        21: [Moves.Protect],
        25: [Moves.WaterPulse],
        29: [Moves.WakeUpSlap],
        33: [Moves.Soak],
        37: [Moves.Wish],
        41: [Moves.Brine],
        45: [Moves.Safeguard],
        49: [Moves.Whirlpool],
      },
      teachable: [
        Moves.Acrobatics,
        Moves.Attract,
        Moves.BatonPass,
        Moves.Blizzard,
        Moves.BodySlam,
        Moves.Bounce,
        Moves.CalmMind,
        Moves.Dive,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HydroPump,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.KnockOff,
        Moves.LightScreen,
        Moves.MagicCoat,
        Moves.PainSplit,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Round,
        Moves.Safeguard,
        Moves.Scald,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.Surf,
        Moves.Swagger,
        Moves.TakeDown,
        Moves.Toxic,
        Moves.WaterPulse,
        Moves.Waterfall,
        Moves.Whirlpool,
        Moves.ZenHeadbutt,
        Moves.Confide,
        Moves.Liquidation,
      ],
      egg: [
        Moves.Bounce,
        Moves.Endure,
        Moves.MirrorCoat,
        Moves.Mist,
        Moves.PainSplit,
        Moves.Refresh,
        Moves.Tickle,
      ],
    },
  });
}
