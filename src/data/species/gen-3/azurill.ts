import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerAzurillSpecies(): void {
  registerSpecies(Species.Azurill, {
    dexNumber: 298,
    evolvesInto: [
      {
        species: Species.Marill,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Azurill',
    category: 'Polka Dot Pokemon',
    height: 0.2,
    weight: 2,
    family: Families.Marill,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 20,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 20,
    },
    types: [Types.Normal, Types.Fairy],
    abilities: [Abilities.ThickFat, Abilities.HugePower],
    hiddenAbilities: [Abilities.SapSipper],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 3],
    catchRate: 150,
    biomes: [Biome.Bog, Biome.Swamp, Biome.TemperateRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Splash],
        3: [Moves.Charm],
        6: [Moves.TailWhip],
        10: [Moves.Bubble],
        15: [Moves.Slam],
        21: [Moves.WaterGun],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.BodySlam,
        Moves.DefenseCurl,
        Moves.DoubleEdge,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Frustration,
        Moves.Hail,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.Mimic,
        Moves.MudSlap,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
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
      // The whole line's inheritance, since the egg is laid as an
      // Azurill: what a Marill used to carry is carried here
      egg: [
        Moves.Amnesia,
        Moves.BellyDrum,
        Moves.Encore,
        Moves.Foresight,
        Moves.FutureSight,
        Moves.LightScreen,
        Moves.PerishSong,
        Moves.Present,
        Moves.Refresh,
        Moves.Sing,
        Moves.Substitute,
        Moves.Supersonic,
        Moves.Tickle,
      ],
    },
  });
}
