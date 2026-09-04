import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMurkrowSpecies(): void {
  registerSpecies(Species.Murkrow, {
    dexNumber: 198,
    name: 'Murkrow',
    category: 'Darkness Pokemon',
    height: 0.5,
    weight: 2.1,
    family: Families.Murkrow,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 42,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 42,
      [Stats.Speed]: 91,
    },
    types: [Types.Dark, Types.Flying],
    abilities: [Abilities.Insomnia, Abilities.SuperLuck],
    hiddenAbilities: [Abilities.Prankster],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Peck],
        11: [Moves.Pursuit],
        16: [Moves.Haze],
        26: [Moves.NightShade],
        31: [Moves.FeintAttack],
        41: [Moves.MeanLook],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Fly,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Rest,
        Moves.Return,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SteelWing,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,
      ],
      egg: [
        Moves.DrillPeck,
        Moves.MirrorMove,
        Moves.QuickAttack,
        Moves.SkyAttack,
        Moves.Whirlwind,
        Moves.WingAttack,
      ],
    },
  });
}
