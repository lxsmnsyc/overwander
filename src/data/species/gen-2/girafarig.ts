import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerGirafarigSpecies(): void {
  registerSpecies(Species.Girafarig, {
    dexNumber: 203,
    name: 'Girafarig',
    category: 'Long Neck Pokemon',
    height: 1.5,
    weight: 41.5,
    family: Families.Girafarig,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 80,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 85,
    },
    types: [Types.Normal, Types.Psychic],
    abilities: [Abilities.InnerFocus, Abilities.EarlyBird],
    hiddenAbilities: [Abilities.SapSipper],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Savanna, Biome.Grassland, Biome.Steppe],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        7: [Moves.Astonish],
        25: [Moves.OdorSleuth],
        1: [Moves.Confusion, Moves.Growl, Moves.Stomp, Moves.Tackle],
        20: [Moves.Agility],
        30: [Moves.BatonPass],
        41: [Moves.Psybeam],
        54: [Moves.Crunch],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Thunder,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZapCannon,

        Moves.BodySlam,
        Moves.CalmMind,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Flash,
        Moves.LightScreen,
        Moves.Mimic,
        Moves.Reflect,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SkillSwap,
        Moves.Substitute,
        Moves.ThunderWave,
      ],
      egg: [
        Moves.Amnesia,
        Moves.BeatUp,
        Moves.Foresight,
        Moves.FutureSight,
        Moves.TakeDown,
        Moves.MagicCoat,
        Moves.Wish,
      ],
    },
  });
}
