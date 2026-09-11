import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerEspeonSpecies(): void {
  registerSpecies(Species.Espeon, {
    dexNumber: 196,
    name: 'Espeon',
    category: 'Sun Pokemon',
    height: 0.9,
    weight: 26.5,
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 65,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 110,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize],
    hiddenAbilities: [Abilities.MagicBounce],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.HelpingHand],
        8: [Moves.SandAttack],
        16: [Moves.Confusion],
        23: [Moves.QuickAttack],
        30: [Moves.Swift],
        36: [Moves.Psybeam],
        42: [Moves.PsychUp],
        47: [Moves.Psychic],
        52: [Moves.MorningSun],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Cut,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Toxic,
        Moves.ZapCannon,

        Moves.BodySlam,
        Moves.CalmMind,
        Moves.Dig,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.LightScreen,
        Moves.Mimic,
        Moves.Reflect,
        Moves.SecretPower,
        Moves.SkillSwap,
        Moves.Substitute,
      ],
    },
  });
}
