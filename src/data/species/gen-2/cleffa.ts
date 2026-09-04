import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerCleffaSpecies(): void {
  registerSpecies(Species.Cleffa, {
    dexNumber: 173,
    evolvesInto: [
      {
        species: Species.Clefairy,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Cleffa',
    category: 'Star Shape Pokemon',
    height: 0.3,
    weight: 3,
    family: Families.Clefairy,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 25,
      [Stats.Defense]: 28,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 15,
    },
    types: [Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.MagicGuard],
    hiddenAbilities: [Abilities.FriendGuard],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 3],
    catchRate: 150,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Charm, Moves.Pound],
        4: [Moves.Encore],
        8: [Moves.Sing],
        13: [Moves.SweetKiss],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Toxic,
        Moves.ZapCannon,
      ],
      egg: [
        Moves.Amnesia,
        Moves.BellyDrum,
        Moves.Metronome,
        Moves.Mimic,
        Moves.Present,
        Moves.Splash,
      ],
    },
  });
}
