import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The Chimecho that has not learned to hold its note: a Chingling
 * rings with every step it takes
 */
export default function registerChinglingSpecies(): void {
  registerSpecies(Species.Chingling, {
    dexNumber: 433,
    evolvesInto: [
      {
        species: Species.Chimecho,
        method: EvolutionMethod.Friendship | EvolutionMethod.TimeOfDay,
        time: TimeOfDay.Evening | TimeOfDay.Night,
      },
    ],
    name: 'Chingling',
    category: 'Bell Pokemon',
    height: 0.2,
    weight: 0.6,
    family: Families.Chimecho,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 30,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 45,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wrap],
        6: [Moves.Growl],
        9: [Moves.Astonish],
        14: [Moves.Confusion],
        17: [Moves.Uproar],
        22: [Moves.LastResort],
      },
      teachable: [
        Moves.Attract,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.ChargeBeam,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.IcyWind,
        Moves.KnockOff,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Taunt,
        Moves.ThunderWave,
        Moves.Torment,
        Moves.Toxic,
        Moves.Trick,
        Moves.TrickRoom,
        Moves.Uproar,
        Moves.ZenHeadbutt,
      ],
      egg: [
        Moves.Curse,
        Moves.Disable,
        Moves.DreamEater,
        Moves.FutureSight,
        Moves.Hypnosis,
        Moves.Recover,
        Moves.Wish,
      ],
    },
  });
}
