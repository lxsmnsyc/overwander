import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerStantlerSpecies(): void {
  registerSpecies(Species.Stantler, {
    dexNumber: 234,
    name: 'Stantler',
    category: 'Big Horn Pokemon',
    height: 1.4,
    weight: 71.2,
    family: Families.Stantler,
    stats: {
      [Stats.HP]: 73,
      [Stats.Attack]: 95,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 85,
    },
    types: [Types.Normal],
    abilities: [Abilities.Intimidate, Abilities.Frisk],
    hiddenAbilities: [Abilities.SapSipper],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Taiga, Biome.MontaneForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        13: [Moves.Astonish],
        1: [Moves.Tackle],
        8: [Moves.Leer],
        15: [Moves.Hypnosis],
        23: [Moves.Stomp],
        31: [Moves.SandAttack, Moves.RolePlay],
        40: [Moves.TakeDown],
        49: [Moves.ConfuseRay, Moves.CalmMind],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roar,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,

        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.IronTail,
        Moves.Mimic,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SkillSwap,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
      ],
      egg: [
        Moves.Bite,
        Moves.Disable,
        Moves.LightScreen,
        Moves.Reflect,
        Moves.Spite,
        Moves.Extrasensory,
      ],
    },
  });
}
