import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerChimechoSpecies(): void {
  registerSpecies(Species.Chimecho, {
    dexNumber: 358,
    name: 'Chimecho',
    category: 'Wind Chime Pokemon',
    height: 0.6,
    weight: 1,
    family: Families.Chimecho,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 50,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 65,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Levitate],
    // Healer, Own Tempo and Forewarn are this registry's rather than
    // the mainline's: a chime is rung over somebody, keeps its own
    // time whatever blows through it, and is hung up to be read
    hiddenAbilities: [Abilities.Healer, Abilities.OwnTempo, Abilities.Forewarn],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Wrap],
        6: [Moves.Growl],
        9: [Moves.Astonish],
        14: [Moves.Confusion],
        17: [Moves.TakeDown],
        22: [Moves.Uproar],
        25: [Moves.Yawn],
        30: [Moves.Psywave],
        33: [Moves.DoubleEdge],
        38: [Moves.HealBell],
        41: [Moves.Safeguard],
        46: [Moves.Psychic],
      },
      teachable: [
        Moves.Attract,
        Moves.CalmMind,
        Moves.DefenseCurl,
        Moves.DoubleEdge,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.IcyWind,
        Moves.LightScreen,
        Moves.Mimic,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Torment,
        Moves.Toxic,
      ],
      egg: [Moves.Curse, Moves.Disable, Moves.DreamEater, Moves.Hypnosis],
    },
  });
}
