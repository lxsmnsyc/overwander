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
 * A Sudowoodo before it learned to keep still: a Bonsly leaks the
 * water it cannot hold and calls it crying
 */
export default function registerBonslySpecies(): void {
  registerSpecies(Species.Bonsly, {
    dexNumber: 438,
    evolvesInto: [
      {
        species: Species.Sudowoodo,
        method: EvolutionMethod.Level | EvolutionMethod.KnownMove,
        level: 20,
        move: Moves.Mimic,
      },
    ],
    name: 'Bonsly',
    category: 'Bonsai Pokemon',
    height: 0.5,
    weight: 15.0,
    family: Families.Sudowoodo,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 80,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 10,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 10,
    },
    types: [Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.RockHead],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Copycat, Moves.FakeTears],
        6: [Moves.Flail],
        9: [Moves.LowKick],
        14: [Moves.RockThrow],
        17: [Moves.Mimic],
        22: [Moves.Block],
        25: [Moves.FeintAttack],
        30: [Moves.RockTomb],
        33: [Moves.RockSlide],
        38: [Moves.Slam],
        41: [Moves.SuckerPunch],
        46: [Moves.DoubleEdge],
      },
      teachable: [
        Moves.Attract,
        Moves.BrickBreak,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.EarthPower,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.Frustration,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Rest,
        Moves.Return,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StealthRock,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Thief,
        Moves.Toxic,
        Moves.Uproar,
      ],
      egg: [
        Moves.DefenseCurl,
        Moves.Harden,
        Moves.Headbutt,
        Moves.Rollout,
        Moves.SandTomb,
        Moves.SelfDestruct,
      ],
    },
  });
}
