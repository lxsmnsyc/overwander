import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerGligarSpecies(): void {
  registerSpecies(Species.Gligar, {
    dexNumber: 207,
    name: 'Gligar',
    category: 'Fly Scorpion Pokemon',
    height: 1.1,
    weight: 64.8,
    family: Families.Gligar,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 75,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 85,
    },
    types: [Types.Ground, Types.Flying],
    abilities: [Abilities.HyperCutter, Abilities.SandVeil],
    hiddenAbilities: [Abilities.Immunity],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Badlands, Biome.ColdDesert],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.PoisonSting],
        6: [Moves.SandAttack],
        13: [Moves.Harden],
        20: [Moves.QuickAttack],
        28: [Moves.FeintAttack],
        36: [Moves.Slash],
        44: [Moves.Screech],
        52: [Moves.Guillotine],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Cut,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.Sandstorm,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.Snore,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,
      ],
      egg: [Moves.Counter, Moves.MetalClaw, Moves.RazorWind, Moves.WingAttack],
    },
  });
}
