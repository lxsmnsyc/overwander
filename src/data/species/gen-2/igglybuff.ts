import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerIgglybuffSpecies(): void {
  registerSpecies(Species.Igglybuff, {
    dexNumber: 174,
    evolvesInto: [
      {
        species: Species.Jigglypuff,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Igglybuff',
    category: 'Balloon Pokemon',
    height: 0.3,
    weight: 1,
    family: Families.Jigglypuff,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 30,
      [Stats.Defense]: 15,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 15,
    },
    types: [Types.Normal, Types.Fairy],
    abilities: [Abilities.CuteCharm, Abilities.Competitive],
    hiddenAbilities: [Abilities.FriendGuard],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 3],
    catchRate: 170,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Charm, Moves.Sing],
        4: [Moves.DefenseCurl],
        9: [Moves.Pound],
        14: [Moves.SweetKiss],
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
      egg: [Moves.FeintAttack, Moves.PerishSong, Moves.Present],
    },
  });
}
