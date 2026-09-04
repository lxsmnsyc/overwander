import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerUmbreonSpecies(): void {
  registerSpecies(Species.Umbreon, {
    dexNumber: 197,
    name: 'Umbreon',
    category: 'Moonlight Pokemon',
    height: 1,
    weight: 27,
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 65,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 130,
      [Stats.Speed]: 65,
    },
    types: [Types.Dark],
    abilities: [Abilities.Synchronize],
    hiddenAbilities: [Abilities.InnerFocus],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip],
        8: [Moves.SandAttack],
        16: [Moves.Pursuit],
        23: [Moves.QuickAttack],
        30: [Moves.ConfuseRay],
        36: [Moves.FeintAttack],
        42: [Moves.MeanLook],
        47: [Moves.Screech],
        52: [Moves.Moonlight],
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
      ],
    },
  });
}
