import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerJirachiSpecies(): void {
  registerSpecies(Species.Jirachi, {
    dexNumber: 385,
    name: 'Jirachi',
    category: 'Wish Pokemon',
    height: 0.3,
    weight: 1.1,
    family: Families.Jirachi,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Steel, Types.Psychic],
    abilities: [Abilities.SereneGrace],
    // Levitate, Healer and Magic Bounce are this registry's rather
    // than the mainline's: it never touches the ground, a wish is
    // granted for somebody else, and what is aimed at a charm comes
    // back
    hiddenAbilities: [Abilities.Levitate, Abilities.Healer, Abilities.MagicBounce],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    // The valley it sleeps under, dry ground with the sky open over
    // it, which is what a comet has to be seen through. The tag is
    // the reliable way to one; the badlands are the other, at odds
    // nobody walks out looking for
    biomes: [Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wish, Moves.Confusion],
        5: [Moves.Rest],
        10: [Moves.Swift],
        15: [Moves.HelpingHand],
        20: [Moves.Psychic],
        25: [Moves.Refresh],
        35: [Moves.DoubleEdge],
        40: [Moves.FutureSight],
        45: [Moves.CosmicPower],
        50: [Moves.DoomDesire],
      },
      teachable: [
        Moves.CalmMind,
        Moves.Toxic,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.Protect,
        Moves.RainDance,
        Moves.Safeguard,
        Moves.Frustration,
        Moves.Return,
        Moves.Psychic,
        Moves.ShadowBall,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.ShockWave,
        Moves.Sandstorm,
        Moves.AerialAce,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.SkillSwap,
        Moves.Flash,
        Moves.WaterPulse,
      ],
    },
  });
}
